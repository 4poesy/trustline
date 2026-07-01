'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, UserCheck, AlertCircle, FileText } from 'lucide-react'
import styles from './page.module.css'

export default function ApplyAgentPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [agreed, setAgreed] = useState(false)
  const [bvnVerified, setBvnVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const checkExistingAgent = async () => {
      if (!profile?.id) return
      try {
        // 1. Check if already an agent
        const { data: agent } = await supabase
          .from('agents')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle()

        if (agent) {
          router.replace('/agents/dashboard')
          return
        }

        // 2. Check if KYC Level is at least Tier 1 (BVN/NIN verified)
        const { data: kyc } = await supabase
          .from('kyc_profiles')
          .select('tier')
          .eq('profile_id', profile.id)
          .maybeSingle()

        if (kyc && kyc.tier >= 1) {
          setBvnVerified(true)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    checkExistingAgent()
  }, [profile?.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed || !profile?.id || submitting) return

    if (!bvnVerified) {
      setErrorMsg('You must complete KYC Tier 1 verification before applying to the agent network.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      // Generate a short unique referral code
      const code = `TL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

      const { error } = await supabase
        .from('agents')
        .insert({
          profile_id: profile.id,
          agent_code: code,
          status: 'active'
        })

      if (error) throw error

      router.replace('/agents/dashboard')
    } catch (err: any) {
      setErrorMsg(err.message || 'Application failed to submit.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading application portal...</p>
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
          <h1 className={styles.title}>Apply as Agent</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {errorMsg && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {!bvnVerified && (
          <section className={`card ${styles.kycNoticeCard}`}>
            <AlertCircle size={28} className={styles.noticeIcon} />
            <div>
              <h3>KYC Verification Required</h3>
              <p>To join our physical distributor network and process commissions, you must link your BVN or NIN first.</p>
              <Link href="/verify-identity" className="btn btn-primary" style={{ marginTop: '12px', display: 'inline-block' }}>
                Complete KYC Tier 1
              </Link>
            </div>
          </section>
        )}

        {bvnVerified && (
          <form onSubmit={handleSubmit} className={`card ${styles.formCard}`}>
            <div className={styles.formHeader}>
              <UserCheck size={28} className={styles.userIcon} />
              <h2>Agent Onboarding Terms</h2>
            </div>

            <div className={styles.termsBox}>
              <div className={styles.termsRow}>
                <FileText size={18} />
                <p>Agents earn commission payouts per direct merchant referred who successfully completes KYC Tier 1 checks.</p>
              </div>
              <div className={styles.termsRow}>
                <FileText size={18} />
                <p>Commissions are paid directly to your Trustline wallet on completion of referral checks.</p>
              </div>
              <div className={styles.termsRow}>
                <FileText size={18} />
                <p>Trustline reserves the right to suspend any agent account suspected of falsifying identities or spamming referrals.</p>
              </div>
            </div>

            <div className={styles.checkboxRow}>
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className={styles.checkbox}
                required
              />
              <label htmlFor="agree">I agree to the Agent program Terms and Conditions</label>
            </div>

            <button type="submit" className="btn btn-primary btn-large" style={{ marginTop: '20px' }} disabled={!agreed || submitting}>
              {submitting ? 'Submitting Application...' : 'Accept & Register'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
