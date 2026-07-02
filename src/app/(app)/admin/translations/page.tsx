'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Globe, Search, Edit3, Save, Check, ShieldAlert, Download, Upload, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import styles from './page.module.css'

interface Language {
  code: string
  name: string
  is_rtl: boolean
  is_active: boolean
  completion_percentage: number
}

interface TranslationRow {
  id?: string
  language_code: string
  translation_key: string
  translation_value: string
}

export default function AdminTranslationsPage() {
  const { profile } = useAuth()
  
  // State
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedLang, setSelectedLang] = useState('en-NG')
  const [viewMode, setViewMode] = useState<'language' | 'key'>('language')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUntranslatedOnly, setShowUntranslatedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Translation Rows state
  const [baselineKeys, setBaselineKeys] = useState<string[]>([]) // keys from en-NG
  const [translationsMap, setTranslationsMap] = useState<Record<string, string>>({}) // key -> value for selected lang
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  
  // Side-by-side View 2 state
  const [selectedKeyForCompare, setSelectedKeyForCompare] = useState('')
  const [compareData, setCompareData] = useState<Record<string, string>>({}) // langCode -> value
  
  // Status message
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchLanguages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      setLanguages(data as Language[])
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchTranslationsData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch en-NG keys as the master baseline keys list
      const { data: baselineData, error: bErr } = await supabase
        .from('translations')
        .select('translation_key, translation_value')
        .eq('language_code', 'en-NG')

      if (bErr) throw bErr
      
      const keysList = (baselineData || []).map(r => r.translation_key)
      setBaselineKeys(keysList)
      
      // If comparing a single key
      if (viewMode === 'key') {
        const activeKey = selectedKeyForCompare || keysList[0] || ''
        setSelectedKeyForCompare(activeKey)
        if (activeKey) {
          const { data: compareRows } = await supabase
            .from('translations')
            .select('language_code, translation_value')
            .eq('translation_key', activeKey)
          
          const cmpMap: Record<string, string> = {}
          compareRows?.forEach(r => {
            cmpMap[r.language_code] = r.translation_value
          })
          setCompareData(cmpMap)
        }
        setLoading(false)
        return
      }

      // 2. Fetch translations for selected language
      const { data: selectedData, error: sErr } = await supabase
        .from('translations')
        .select('translation_key, translation_value')
        .eq('language_code', selectedLang)

      if (sErr) throw sErr

      const transMap: Record<string, string> = {}
      // Pre-fill baseline keys as empty first
      keysList.forEach(k => {
        transMap[k] = ''
      })
      // Fill actual translation values
      selectedData?.forEach(r => {
        transMap[r.translation_key] = r.translation_value
      })

      setTranslationsMap(transMap)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedLang, viewMode, selectedKeyForCompare])

  useEffect(() => {
    fetchLanguages()
  }, [fetchLanguages])

  useEffect(() => {
    fetchTranslationsData()
  }, [fetchTranslationsData])

  // Save Translation
  const handleSaveTranslation = async (key: string, value: string) => {
    setSavingKey(key)
    setStatusMsg(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Auth session missing!')

      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fecvmzybfzumyxcphpmp.supabase.co'}/functions/v1/update-translation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          language_code: selectedLang,
          translation_key: key,
          translation_value: value
        })
      })

      const responseData = await res.json()
      if (!res.ok) throw new Error(responseData.error || 'Failed to update translation')

      // Update local state
      setTranslationsMap(prev => ({ ...prev, [key]: value }))
      setEditingKey(null)
      setStatusMsg({ type: 'success', text: `Translation saved. Language completion at ${responseData.completion_percentage}%!` })
      
      // Update completeness count in languages list
      setLanguages(prev => prev.map(l => l.code === selectedLang ? { ...l, completion_percentage: responseData.completion_percentage } : l))
      setTimeout(() => setStatusMsg(null), 2500)
    } catch (e: any) {
      console.error(e)
      setStatusMsg({ type: 'error', text: e.message || 'Error saving translation.' })
    } finally {
      setSavingKey(null)
    }
  }

  // Export language as JSON file
  const handleExportJson = () => {
    const filename = `${selectedLang}_translations.json`
    const jsonStr = JSON.stringify(translationsMap, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // Import JSON File
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid JSON structure')

        setStatusMsg({ type: 'success', text: 'Starting upload import... Please wait.' })
        
        // Loop and save each imported key
        const keys = Object.keys(parsed)
        let successCount = 0

        for (const key of keys) {
          const value = parsed[key]
          if (baselineKeys.includes(key)) {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
              await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fecvmzybfzumyxcphpmp.supabase.co'}/functions/v1/update-translation`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  language_code: selectedLang,
                  translation_key: key,
                  translation_value: value
                })
              })
              successCount++
            }
          }
        }

        setStatusMsg({ type: 'success', text: `Successfully imported ${successCount} translations!` })
        fetchTranslationsData()
        fetchLanguages()
        setTimeout(() => setStatusMsg(null), 3000)
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: err.message || 'Failed parsing translation JSON.' })
      }
    }
    reader.readAsText(file)
  }

  // Filter keys
  const filteredKeys = baselineKeys.filter(k => {
    const value = translationsMap[k] || ''
    const matchesSearch = k.toLowerCase().includes(searchQuery.toLowerCase()) || value.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUntranslated = showUntranslatedOnly ? (!value || value.trim() === '') : true
    return matchesSearch && matchesUntranslated
  })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/admin" className={styles.backButton}>
            <ArrowLeft size={20} />
          </Link>
          <div className={styles.headerTitleRow}>
            <Globe size={20} className={styles.globeIcon} />
            <h1 className={styles.title}>i18n Translations</h1>
          </div>
          
          <div className={styles.viewModeToggle}>
            <button 
              onClick={() => setViewMode('language')}
              className={`${styles.toggleBtn} ${viewMode === 'language' ? styles.toggleBtnActive : ''}`}
            >
              By Language
            </button>
            <button 
              onClick={() => setViewMode('key')}
              className={`${styles.toggleBtn} ${viewMode === 'key' ? styles.toggleBtnActive : ''}`}
            >
              By Key
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {statusMsg && (
          <div className={`${styles.statusAlert} ${statusMsg.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
            <span>{statusMsg.type === 'success' ? '✅' : '⚠️'} {statusMsg.text}</span>
          </div>
        )}

        {viewMode === 'language' ? (
          <>
            {/* Toolbar options */}
            <section className={`card ${styles.toolbarCard}`}>
              <div className={styles.toolbarRow}>
                <div className={styles.selectLangBlock}>
                  <label className={styles.toolbarLabel}>Active Language</label>
                  <select 
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className={styles.langSelect}
                  >
                    {languages.map(l => (
                      <option key={l.code} value={l.code}>
                        {l.name} ({l.completion_percentage}% done)
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.importExportActions}>
                  <button onClick={handleExportJson} className={`btn btn-secondary ${styles.actionBtn}`}>
                    <Download size={14} /> Export JSON
                  </button>
                  <label className={`btn btn-secondary ${styles.importLabel}`}>
                    <Upload size={14} /> Import JSON
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportJson} 
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <div className={styles.filterRow}>
                <div className={styles.searchBox}>
                  <Search size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search translation keys or values..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                
                <label className={styles.untranslatedLabel}>
                  <input
                    type="checkbox"
                    checked={showUntranslatedOnly}
                    onChange={(e) => setShowUntranslatedOnly(e.target.checked)}
                  />
                  <span>Show only untranslated keys</span>
                </label>
              </div>
            </section>

            {/* Translation grid */}
            {loading ? (
              <div className={styles.loader}>
                <span className="spinner" />
                <p>Loading translations dictionary...</p>
              </div>
            ) : (
              <div className={styles.keysList}>
                {filteredKeys.map((key) => {
                  const isEditing = editingKey === key
                  const value = translationsMap[key] || ''
                  const isMissing = !value || value.trim() === ''
                  
                  return (
                    <div 
                      key={key} 
                      className={`${styles.translationCard} ${isMissing ? styles.missingCard : ''}`}
                    >
                      <div className={styles.cardHeader}>
                        <span className={styles.keyText}>{key}</span>
                        {isMissing && <span className={styles.missingBadge}>Missing</span>}
                      </div>

                      {isEditing ? (
                        <div className={styles.editArea}>
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className={styles.editTextarea}
                            placeholder="Enter translation value..."
                            rows={2}
                          />
                          <div className={styles.editActions}>
                            <button
                              onClick={() => handleSaveTranslation(key, editValue)}
                              disabled={savingKey === key}
                              className="btn btn-primary btn-mini"
                            >
                              <Save size={14} /> Save
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="btn btn-secondary btn-mini"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.valueArea}>
                          <p className={value ? styles.valueText : styles.placeholderText}>
                            {value || '(No translation entered yet)'}
                          </p>
                          <button
                            onClick={() => {
                              setEditingKey(key)
                              setEditValue(value)
                            }}
                            className={styles.editBtn}
                            title="Edit String"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          /* Side-by-side key compare view Mode */
          <>
            <section className={`card ${styles.toolbarCard}`}>
              <label className={styles.toolbarLabel}>Select Master Translation Key</label>
              <select
                value={selectedKeyForCompare}
                onChange={(e) => setSelectedKeyForCompare(e.target.value)}
                className={styles.keyCompareSelect}
              >
                {baselineKeys.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </section>

            {loading ? (
              <div className={styles.loader}>
                <span className="spinner" />
                <p>Loading comparisons...</p>
              </div>
            ) : (
              <div className={styles.compareGrid}>
                {languages.map((l) => {
                  const val = compareData[l.code] || ''
                  return (
                    <div key={l.code} className={`card ${styles.compareCard}`}>
                      <div className={styles.compareCardHeader}>
                        <h4 className={styles.langName}>{l.name}</h4>
                        <span className={styles.langCode}>{l.code}</span>
                      </div>
                      <p className={val ? styles.compareVal : styles.compareEmpty}>
                        {val || '(Untranslated)'}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
