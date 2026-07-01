'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import styles from './page.module.css'

const PREMIUM_OPTIONS: Record<string, { amount: number; frequency: string; coverage: number }[]> = {
  inventory: [
    { amount: 500, frequency: 'monthly', coverage: 50000 },
    { amount: 1500, frequency: 'monthly', coverage: 200000 },
    { amount: 2500, frequency: 'monthly', coverage: 500000 },
  ],
  health: [
    { amount: 1000, frequency: 'monthly', coverage: 50000 },
    { amount: 3000, frequency: 'monthly', coverage: 100000 },
    { amount: 5000, frequency: 'monthly', coverage: 200000 },
  ],
  device: [
    { amount: 300, frequency: 'monthly', coverage: 50000 },
    { amount: 800, frequency: 'monthly', coverage: 100000 },
    { amount: 1500, frequency: 'monthly', coverage: 150000 },
  ],
}

export default function EnrollInsurancePage() {
  const { profile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const planType = searchParams.get('type') || 'inventory'
  const planName = searchParams.get('name') || 'Insurance Plan'
  const options = PREMIUM_OPTIONS[planType] || PREMIUM_OPTIONS.inventory

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleEnroll = async () => {
    if (!profile?.id || submitting) return

    setSubmitting(true)
    setErrorMsg('')

    const selected = options[selectedIdx]
    const startDate = new Date()
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 1) // 1-year policy

    try {
      const { error } = await supabase
        .from('insurance_policies')
        .insert({
          profile_id: profile.id,
          plan_name: decodeURIComponent(planName),
          plan_type: planType,
          premium_amount: selected.amount,
          premium_frequency: selected.frequency,
          coverage_amount: selected.coverage,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active'
        })

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to enroll in plan.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className={styles.page}>
        <main className={styles.successContainer}>
          <CheckCircle size={56} className={styles.successIcon} />
          <h2>Enrollment Successful!</h2>
          <p>You are now covered under <strong>{decodeURIComponent(planName)}</strong>. Your policy is active immediately.</p>
          <Link href="/insurance" className="btn btn-primary" style={{ marginTop: '16px' }}>
            View My Policies
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/insurance/browse" className={styles.backButton} aria-label="Back">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Enroll</h1>
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

        <section className={`card ${styles.planSummary}`}>
          <Shield size={32} className={styles.planIcon} />
          <h2>{decodeURIComponent(planName)}</h2>
          <p className={styles.planType}>{planType} coverage</p>
        </section>

        <section className={styles.tierSection}>
          <h3>Choose Your Coverage Tier</h3>
          <div className={styles.tierGrid}>
            {options.map((opt, idx) => (
              <button
                key={idx}
                className={`card ${styles.tierCard} ${selectedIdx === idx ? styles.tierActive : ''}`}
                onClick={() => setSelectedIdx(idx)}
              >
                <span className={styles.tierPremium}>₦{opt.amount.toLocaleString()}</span>
                <span className={styles.tierFreq}>/{opt.frequency}</span>
                <span className={styles.tierCoverage}>
                  Up to ₦{opt.coverage.toLocaleString()} cover
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className={`card ${styles.confirmCard}`}>
          <h3>Enrollment Summary</h3>
          <div className={styles.summaryRow}>
            <span>Plan:</span>
            <strong>{decodeURIComponent(planName)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Monthly Premium:</span>
            <strong>₦{options[selectedIdx].amount.toLocaleString()}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Coverage Limit:</span>
            <strong>₦{options[selectedIdx].coverage.toLocaleString()}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Policy Duration:</span>
            <strong>12 months</strong>
          </div>

          <button onClick={handleEnroll} className="btn btn-primary btn-large" style={{ marginTop: '20px' }} disabled={submitting}>
            {submitting ? 'Processing Enrollment...' : 'Confirm & Activate Policy'}
          </button>

          <p className={styles.disclaimer}>
            By enrolling, you agree to the Trustline micro-insurance terms. Premiums are collected monthly from your Trustline wallet. Cancel anytime.
          </p>
        </section>
      </main>
    </div>
  )
}
