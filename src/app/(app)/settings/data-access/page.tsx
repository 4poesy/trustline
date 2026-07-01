'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, ShieldCheck, ShieldAlert, CheckCircle, Database } from 'lucide-react'
import styles from './page.module.css'

export default function DataAccessConsentPage() {
  const { profile } = useAuth()

  const [allowThirdParty, setAllowThirdParty] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    const fetchConsentSettingsAndLogs = async () => {
      if (!profile?.id) return
      try {
        // 1. Fetch user's KYC tier to check if they have Tier 3 consent configuration
        const { data: kyc } = await supabase
          .from('kyc_profiles')
          .select('tier')
          .eq('profile_id', profile.id)
          .maybeSingle()

        // Set consent switch active only if tier is high enough (mock or custom metadata)
        if (kyc && kyc.tier >= 3) {
          setAllowThirdParty(true)
        }

        // 2. Fetch API logs
        const { data: keysData } = await supabase
          .from('api_keys')
          .select('id, name')
          .eq('profile_id', profile.id)

        if (keysData && keysData.length > 0) {
          const keyIds = keysData.map(k => k.id)
          const { data: logRows } = await supabase
            .from('api_requests_log')
            .select('*')
            .in('api_key_id', keyIds)
            .order('requested_at', { ascending: false })
            .limit(10)

          if (logRows) {
            // Map key names
            const mapped = logRows.map(l => ({
              ...l,
              key_name: keysData.find(k => k.id === l.api_key_id)?.name || 'API Key'
            }))
            setLogs(mapped)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchConsentSettingsAndLogs()
  }, [profile?.id])

  const handleSaveSettings = async () => {
    if (!profile?.id) return
    setSaving(true)
    try {
      // Upsert KYC tier configuration to match consent requirement (Tier 3)
      const { data: currentKyc } = await supabase
        .from('kyc_profiles')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle()

      if (allowThirdParty) {
        // Enforce that user must be KYC Tier 3 or we mock raise them to Tier 3 for data access consent
        const targetTier = currentKyc ? Math.max(currentKyc.tier, 3) : 3
        await supabase
          .from('kyc_profiles')
          .upsert({
            profile_id: profile.id,
            tier: targetTier,
            verified_at: new Date().toISOString()
          }, { onConflict: 'profile_id' })
      } else {
        // Reduce tier setting if they opt-out or adjust properties
        if (currentKyc && currentKyc.tier === 3) {
          await supabase
            .from('kyc_profiles')
            .update({ tier: 2 })
            .eq('profile_id', profile.id)
        }
      }

      setToastMsg('Data access settings saved successfully!')
      setTimeout(() => setToastMsg(''), 3000)
    } catch (err: any) {
      alert(err.message || 'Failed to save consent settings.')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading consent configurations...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/developers/dashboard" className={styles.backButton} aria-label="Back to dashboard">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Data Consent</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {toastMsg && (
          <div className={styles.toast}>
            <CheckCircle size={16} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Consent toggle card */}
        <section className={`card ${styles.consentCard}`}>
          <div className={styles.cardHeader}>
            <ShieldCheck size={28} className={styles.shieldIcon} />
            <div>
              <h3>B2B CREDIT SCORE SHARING</h3>
              <p>Authorize external lenders and software to view your financial score</p>
            </div>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.rowLabel}>
              <h4>Allow Third-Party API Access</h4>
              <p>When enabled, verified cooperative partners can request your Trust Score and monthly sales total (Tier 3 KYC required).</p>
            </div>
            <input
              type="checkbox"
              className={styles.switch}
              checked={allowThirdParty}
              onChange={(e) => setAllowThirdParty(e.target.checked)}
            />
          </div>
        </section>

        {/* Audit logs */}
        <section className={styles.listSection}>
          <div className={styles.listHeader}>
            <Database size={18} />
            <h3>Recent Data Access Requests</h3>
          </div>

          {logs.length === 0 ? (
            <div className={styles.emptyCard}>
              <ShieldAlert size={32} />
              <p>No external data access requests logged yet.</p>
            </div>
          ) : (
            <div className={styles.logsList}>
              {logs.map((l) => (
                <div key={l.id} className={`card ${styles.logItem}`}>
                  <div>
                    <span className={styles.methodGet}>GET</span>
                    <span className={styles.logPath}>{l.endpoint}</span>
                    <p className={styles.logApp}>Requested by API key: <strong>{l.key_name}</strong></p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={styles.logStatus}>Status {l.response_code}</span>
                    <p className={styles.logDate}>{formatDate(l.requested_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <button onClick={handleSaveSettings} className="btn btn-primary btn-large" disabled={saving}>
          {saving ? 'Saving Preferences...' : 'Save Settings'}
        </button>
      </main>
    </div>
  )
}
