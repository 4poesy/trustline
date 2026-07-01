'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Key, Plus, Trash2, Eye, EyeOff, Check, Copy, Settings, ShieldAlert } from 'lucide-react'
import styles from './page.module.css'

export default function DevDashboardPage() {
  const { profile } = useAuth()

  const [keys, setKeys] = useState<any[]>([])
  const [keyName, setKeyName] = useState('')
  const [scopes, setScopes] = useState<string[]>(['read:trust_score'])
  const [newPlainKey, setNewPlainKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [visibleKeyId, setVisibleKeyId] = useState<string | null>(null)

  useEffect(() => {
    const fetchKeys = async () => {
      if (!profile?.id) return
      try {
        const { data, error } = await supabase
          .from('api_keys')
          .select('*')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false })

        if (data) setKeys(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchKeys()
  }, [profile?.id])

  const sha256 = async (text: string) => {
    const msgBuffer = new TextEncoder().encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyName.trim() || !profile?.id || generating) return

    setGenerating(true)
    setNewPlainKey('')

    try {
      // 1. Generate local plain text token
      const randToken = Array.from(crypto.getRandomValues(new Uint8Array(18)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      const plainKey = `tl_live_${randToken}`

      // 2. Hash it
      const hash = await sha256(plainKey)

      // 3. Save to database
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          profile_id: profile.id,
          key_hash: hash,
          name: keyName.trim(),
          scopes: scopes,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      setNewPlainKey(plainKey)
      setKeys([data, ...keys])
      setKeyName('')
    } catch (err: any) {
      alert(err.message || 'Failed to generate key.')
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action is permanent and immediate.')) return

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)

      if (error) throw error

      setKeys(keys.filter(k => k.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to revoke key.')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(newPlainKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading developer configurations...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Back to dashboard">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Developer Portal</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {/* API Key Modal banner if newly created */}
        {newPlainKey && (
          <section className={`card ${styles.modalCard}`}>
            <div className={styles.modalHeader}>
              <ShieldAlert size={24} className={styles.alertIcon} />
              <h4>SAVE YOUR KEY NOW</h4>
            </div>
            <p>For security reasons, this key will only be shown once. Copy it now and save it in a safe place.</p>
            
            <div className={styles.keyDisplayRow}>
              <span className={styles.plainKey}>{newPlainKey}</span>
              <button onClick={handleCopy} className={styles.copyBtn} aria-label="Copy key">
                {copied ? <Check size={18} style={{ color: 'var(--color-primary-500)' }} /> : <Copy size={18} />}
              </button>
            </div>
            <button onClick={() => setNewPlainKey('')} className="btn btn-primary" style={{ marginTop: '8px' }}>
              Done, I've Saved It
            </button>
          </section>
        )}

        {/* Generate Card */}
        <section className={`card ${styles.generateCard}`}>
          <h3>Generate New Key</h3>
          <form onSubmit={handleGenerateKey} className={styles.genForm}>
            <div className="form-group">
              <label className="form-label">Key Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. My Lending App"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Scopes Allowed</label>
              <div className={styles.scopeCheckboxes}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={scopes.includes('read:trust_score')}
                    onChange={(e) => {
                      if (e.target.checked) setScopes([...scopes, 'read:trust_score'])
                      else setScopes(scopes.filter(s => s !== 'read:trust_score'))
                    }}
                  />
                  <span>Read Trust Score</span>
                </label>

                <label className={styles.checkboxLabel} style={{ marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    checked={scopes.includes('read:income_summary')}
                    onChange={(e) => {
                      if (e.target.checked) setScopes([...scopes, 'read:income_summary'])
                      else setScopes(scopes.filter(s => s !== 'read:income_summary'))
                    }}
                  />
                  <span>Read Income Summary</span>
                </label>

                <label className={styles.checkboxLabel} style={{ marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    checked={scopes.includes('read:reviews')}
                    onChange={(e) => {
                      if (e.target.checked) setScopes([...scopes, 'read:reviews'])
                      else setScopes(scopes.filter(s => s !== 'read:reviews'))
                    }}
                  />
                  <span>Read Reviews</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }} disabled={generating}>
              <Plus size={16} /> {generating ? 'Generating...' : 'Create API Key'}
            </button>
          </form>
        </section>

        {/* Existing Keys list */}
        <section className={styles.listSection}>
          <div className={styles.listHeader}>
            <h3>Active API Keys</h3>
            <Link href="/settings/data-access" className={styles.consentLink}>
              <Settings size={14} style={{ marginRight: '4px' }} /> Consent Config
            </Link>
          </div>

          {keys.length === 0 ? (
            <div className={styles.emptyCard}>
              <Key size={36} />
              <p>No active API keys created yet. Generate one above to access API gateways.</p>
            </div>
          ) : (
            <div className={styles.keysList}>
              {keys.map((k) => (
                <div key={k.id} className={`card ${styles.keyItem}`}>
                  <div className={styles.itemLeft}>
                    <h4>{k.name}</h4>
                    <p className={styles.scopesBadge}>Scopes: {k.scopes?.join(', ')}</p>
                    <p className={styles.date}>Created {formatDate(k.created_at)}</p>
                  </div>

                  <div className={styles.itemRight}>
                    <button onClick={() => handleDeleteKey(k.id)} className={styles.revokeBtn} aria-label="Revoke key">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
