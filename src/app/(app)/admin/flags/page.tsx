'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Check, Save, RefreshCw, AlertTriangle, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import styles from './page.module.css'

interface FeatureFlagRow {
  id: string
  feature_key: string
  country_code: string | null
  is_enabled: boolean
  rollout_percentage: number
  minimum_kyc_tier: number
  minimum_trust_score: number
  is_beta: boolean
  release_notes: string | null
}

const COUNTRIES = [
  { code: 'GLOBAL', label: '🌐 Global Default', dbValue: null },
  { code: 'NG', label: '🇳🇬 Nigeria', dbValue: 'NG' },
  { code: 'GH', label: '🇬🇭 Ghana', dbValue: 'GH' },
  { code: 'KE', label: '🇰🇪 Kenya', dbValue: 'KE' }
]

export default function AdminFlagsPage() {
  const { profile } = useAuth()
  const [flags, setFlags] = useState<FeatureFlagRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // New flag creation form state
  const [newKey, setNewKey] = useState('')
  const [newCountry, setNewCountry] = useState<string>('GLOBAL')
  const [newEnabled, setNewEnabled] = useState(false)
  const [newRollout, setNewRollout] = useState('100')
  const [newKyc, setNewKyc] = useState('0')
  const [newNotes, setNewNotes] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const fetchFlags = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('feature_key', { ascending: true })

      if (error) throw error
      setFlags(data as FeatureFlagRow[])
    } catch (e) {
      console.error('Error fetching flags:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFlags()
  }, [fetchFlags])

  const handleUpdateFlag = async (flagId: string, updates: Partial<FeatureFlagRow>) => {
    setSavingId(flagId)
    setStatusMsg(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userEmail = session?.user?.email || 'admin'
      const { error } = await supabase
        .from('feature_flags')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: userEmail
        })
        .eq('id', flagId)

      if (error) throw error

      setFlags(prev => prev.map(f => f.id === flagId ? { ...f, ...updates } : f))
      setStatusMsg({ type: 'success', text: 'Flag updated and changes logged!' })
      setTimeout(() => setStatusMsg(null), 2500)
    } catch (e: any) {
      console.error('Error saving flag updates:', e)
      setStatusMsg({ type: 'error', text: e.message || 'Failed to update flag.' })
    } finally {
      setSavingId(null)
    }
  }

  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg(null)

    if (!newKey.trim()) {
      setStatusMsg({ type: 'error', text: 'Feature key is required' })
      return
    }

    try {
      const dbCountry = newCountry === 'GLOBAL' ? null : newCountry
      const { data: { session } } = await supabase.auth.getSession()
      const userEmail = session?.user?.email || 'admin'
      
      const { error } = await supabase
        .from('feature_flags')
        .insert({
          feature_key: newKey.trim().toLowerCase(),
          country_code: dbCountry,
          is_enabled: newEnabled,
          rollout_percentage: parseInt(newRollout, 10) || 100,
          minimum_kyc_tier: parseInt(newKyc, 10) || 0,
          release_notes: newNotes.trim() || null,
          updated_by: userEmail
        })

      if (error) throw error

      setNewKey('')
      setNewNotes('')
      setShowAddForm(false)
      fetchFlags()
      setStatusMsg({ type: 'success', text: 'New feature flag added successfully!' })
      setTimeout(() => setStatusMsg(null), 2500)
    } catch (e: any) {
      console.error('Error creating flag:', e)
      setStatusMsg({ type: 'error', text: e.message || 'Failed to create feature flag.' })
    }
  }

  // Group flags by feature key
  const uniqueFeatureKeys = Array.from(new Set(flags.map(f => f.feature_key)))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/admin" className={styles.backButton}>
            <ArrowLeft size={20} />
          </Link>
          <div className={styles.headerTitleRow}>
            <Shield size={20} className={styles.shieldIcon} />
            <h1 className={styles.title}>Feature Flags</h1>
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)} className={`btn btn-primary ${styles.addBtn}`}>
            <Plus size={16} /> Add Flag
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {statusMsg && (
          <div className={`${styles.statusAlert} ${statusMsg.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
            <span>{statusMsg.type === 'success' ? '✅' : '⚠️'} {statusMsg.text}</span>
          </div>
        )}

        {/* Add New Flag Modal/Form */}
        {showAddForm && (
          <section className={`card ${styles.addSection}`}>
            <h3 className={styles.sectionTitle}>Create Feature Flag</h3>
            <form onSubmit={handleCreateFlag} className={styles.addForm}>
              <div className="form-group">
                <label className="form-label">Feature Key (snake_case)</label>
                <input 
                  type="text" 
                  placeholder="e.g. loan_marketplace" 
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Country Scope</label>
                <select 
                  className="form-input"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Rollout Percentage (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={newRollout}
                  onChange={(e) => setNewRollout(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Minimum KYC Tier</label>
                <select 
                  className="form-input"
                  value={newKyc}
                  onChange={(e) => setNewKyc(e.target.value)}
                >
                  <option value="0">Tier 0 (No Verification)</option>
                  <option value="1">Tier 1 (Phone/Name verified)</option>
                  <option value="2">Tier 2 (ID uploaded)</option>
                  <option value="3">Tier 3 (Address verified)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Release Notes / Audit Comment</label>
                <input 
                  type="text" 
                  placeholder="Why is this flag being added?" 
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={newEnabled}
                    onChange={(e) => setNewEnabled(e.target.checked)}
                  />
                  <span>Enable Flag Immediately</span>
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className="btn btn-primary">Create Flag</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className={styles.loader}>
            <span className="spinner" />
            <p>Loading feature flags...</p>
          </div>
        ) : uniqueFeatureKeys.length === 0 ? (
          <div className={styles.emptyState}>
            <span>🏳️</span>
            <h3>No feature flags defined</h3>
          </div>
        ) : (
          <div className={styles.flagsList}>
            {uniqueFeatureKeys.map((key) => {
              const keyFlags = flags.filter(f => f.feature_key === key)
              
              return (
                <section key={key} className={`card ${styles.featureCard}`}>
                  <div className={styles.featureHeader}>
                    <h3 className={styles.featureTitle}>{key}</h3>
                  </div>

                  <div className={styles.overridesContainer}>
                    {COUNTRIES.map((countryOpt) => {
                      const existingFlag = keyFlags.find(f => 
                        countryOpt.code === 'GLOBAL' ? f.country_code === null : f.country_code === countryOpt.code
                      )

                      if (!existingFlag) {
                        return (
                          <div key={countryOpt.code} className={styles.missingOverrideRow}>
                            <span className={styles.countryLabel}>{countryOpt.label}</span>
                            <button
                              type="button"
                              onClick={async () => {
                                // Add override from default
                                try {
                                  const { data: { session } } = await supabase.auth.getSession()
                                  const userEmail = session?.user?.email || 'admin'
                                  const globalRef = keyFlags.find(f => f.country_code === null)
                                  
                                  const { error } = await supabase
                                    .from('feature_flags')
                                    .insert({
                                      feature_key: key,
                                      country_code: countryOpt.dbValue,
                                      is_enabled: globalRef ? globalRef.is_enabled : false,
                                      rollout_percentage: globalRef ? globalRef.rollout_percentage : 100,
                                      minimum_kyc_tier: globalRef ? globalRef.minimum_kyc_tier : 0,
                                      release_notes: `Override created for ${countryOpt.code}`,
                                      updated_by: userEmail
                                    })
                                  if (error) throw error
                                  fetchFlags()
                                } catch (e) {
                                  console.error(e)
                                }
                              }}
                              className={`btn btn-secondary ${styles.overrideBtn}`}
                            >
                              + Create Override
                            </button>
                          </div>
                        )
                      }

                      const isSaving = savingId === existingFlag.id

                      return (
                        <div key={existingFlag.id} className={styles.flagControlRow}>
                          <div className={styles.countryColumn}>
                            <span className={styles.countryLabel}>{countryOpt.label}</span>
                            {existingFlag.is_beta && <span className={styles.betaBadge}>Beta</span>}
                          </div>

                          <div className={styles.controlsGrid}>
                            {/* Toggle State */}
                            <div className={styles.controlItem}>
                              <span className={styles.controlLabel}>Status</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateFlag(existingFlag.id, { is_enabled: !existingFlag.is_enabled })}
                                className={`${styles.toggleSwitch} ${existingFlag.is_enabled ? styles.toggleOn : ''}`}
                                disabled={isSaving}
                              >
                                <span className={styles.toggleKnob} />
                              </button>
                            </div>

                            {/* Rollout Input */}
                            <div className={styles.controlItem}>
                              <span className={styles.controlLabel}>Rollout %</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={existingFlag.rollout_percentage}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10)
                                  if (!isNaN(val) && val >= 0 && val <= 100) {
                                    handleUpdateFlag(existingFlag.id, { rollout_percentage: val })
                                  }
                                }}
                                className={styles.controlInput}
                                disabled={isSaving}
                              />
                            </div>

                            {/* KYC Tier Input */}
                            <div className={styles.controlItem}>
                              <span className={styles.controlLabel}>Min KYC</span>
                              <select
                                value={existingFlag.minimum_kyc_tier}
                                onChange={(e) => handleUpdateFlag(existingFlag.id, { minimum_kyc_tier: parseInt(e.target.value, 10) })}
                                className={styles.controlSelect}
                                disabled={isSaving}
                              >
                                <option value="0">Tier 0</option>
                                <option value="1">Tier 1</option>
                                <option value="2">Tier 2</option>
                                <option value="3">Tier 3</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
