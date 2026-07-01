'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, FileDown, CheckCircle, AlertCircle, Loader, TrendingUp, Calendar, Shield, Star } from 'lucide-react'
import styles from './page.module.css'

export default function CreditProfileExportPage() {
  const { profile } = useAuth()

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [exportHistory, setExportHistory] = useState<any[]>([])
  const [trustScore, setTrustScore] = useState<number | null>(null)
  const [totalIncome, setTotalIncome] = useState(0)
  const [txCount, setTxCount] = useState(0)
  const [kycTier, setKycTier] = useState(0)
  const [toastMsg, setToastMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return
      try {
        // 1. Get trust score
        const { data: profileData } = await supabase
          .from('profiles')
          .select('trust_score')
          .eq('id', profile.id)
          .single()

        if (profileData) setTrustScore(profileData.trust_score)

        // 2. Get KYC tier
        const { data: kyc } = await supabase
          .from('kyc_profiles')
          .select('tier')
          .eq('profile_id', profile.id)
          .maybeSingle()

        if (kyc) setKycTier(kyc.tier)

        // 3. Get 90 day income
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        const { data: sales } = await supabase
          .from('sales')
          .select('amount')
          .eq('profile_id', profile.id)
          .gte('sale_date', ninetyDaysAgo)

        if (sales) {
          setTotalIncome(sales.reduce((sum: number, s: any) => sum + Number(s.amount), 0))
          setTxCount(sales.length)
        }

        // 4. Get export history
        const { data: exports } = await supabase
          .from('financial_summary_exports')
          .select('*')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (exports) setExportHistory(exports)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [profile?.id])

  const handleGenerateExport = async () => {
    if (!profile?.id || generating) return

    setGenerating(true)
    setErrorMsg('')

    try {
      // Record the export request
      const { data, error } = await supabase
        .from('financial_summary_exports')
        .insert({
          profile_id: profile.id,
          export_type: 'pdf',
          summary_data: {
            trust_score: trustScore,
            total_income_90d: totalIncome,
            transaction_count_90d: txCount,
            kyc_tier: kycTier,
            profile_name: profile.name,
            business_type: profile.business_type,
            generated_at: new Date().toISOString()
          },
          status: 'completed'
        })
        .select()
        .single()

      if (error) throw error

      setExportHistory([data, ...exportHistory])
      setToastMsg('Financial summary generated successfully!')
      setTimeout(() => setToastMsg(''), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate summary.')
    } finally {
      setGenerating(false)
    }
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return d }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#059669'
    if (score >= 60) return '#d97706'
    return '#dc2626'
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading financial data...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Back">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Credit Profile</h1>
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

        {errorMsg && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Trust Score Hero */}
        <section className={`card ${styles.heroCard}`}>
          <div className={styles.scoreCircle}>
            <svg viewBox="0 0 120 120" className={styles.scoreSvg}>
              <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
              <circle
                cx="60" cy="60" r="52"
                stroke={trustScore !== null ? getScoreColor(trustScore) : '#999'}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${((trustScore || 0) / 100) * 327} 327`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <span className={styles.scoreValue}>{trustScore ?? '--'}</span>
          </div>
          <h2>Your Trust Score</h2>
          <p className={styles.heroSubtitle}>Based on cashflow consistency, savings participation, and community trust</p>
        </section>

        {/* Summary Metrics Grid */}
        <section className={styles.metricsGrid}>
          <div className={`card ${styles.metricCard}`}>
            <TrendingUp size={22} className={styles.metricIcon} />
            <span className={styles.metricValue}>{profile?.currency || 'NGN'} {totalIncome.toLocaleString()}</span>
            <span className={styles.metricLabel}>90-Day Income</span>
          </div>

          <div className={`card ${styles.metricCard}`}>
            <Calendar size={22} className={styles.metricIcon} />
            <span className={styles.metricValue}>{txCount}</span>
            <span className={styles.metricLabel}>Transactions</span>
          </div>

          <div className={`card ${styles.metricCard}`}>
            <Shield size={22} className={styles.metricIcon} />
            <span className={styles.metricValue}>Tier {kycTier}</span>
            <span className={styles.metricLabel}>KYC Level</span>
          </div>

          <div className={`card ${styles.metricCard}`}>
            <Star size={22} className={styles.metricIcon} />
            <span className={styles.metricValue}>{trustScore !== null && trustScore >= 70 ? 'Good' : 'Building'}</span>
            <span className={styles.metricLabel}>Credit Rating</span>
          </div>
        </section>

        {/* Generate Export CTA */}
        <section className={`card ${styles.exportCard}`}>
          <FileDown size={28} className={styles.exportIcon} />
          <h3>Generate Financial Summary</h3>
          <p>Create a shareable credit profile document with your trust score, income data, and verification status. Perfect for loan applications and cooperative memberships.</p>
          <button
            onClick={handleGenerateExport}
            className="btn btn-primary btn-large"
            style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader size={18} className={styles.spinIcon} /> Generating...
              </>
            ) : (
              <>
                <FileDown size={18} /> Export Credit Summary
              </>
            )}
          </button>
        </section>

        {/* Export History */}
        {exportHistory.length > 0 && (
          <section className={styles.historySection}>
            <h3>Export History</h3>
            <div className={styles.historyList}>
              {exportHistory.map((exp) => (
                <div key={exp.id} className={`card ${styles.historyItem}`}>
                  <div>
                    <h4>Financial Summary</h4>
                    <p className={styles.historyDate}>{formatDate(exp.created_at)}</p>
                  </div>
                  <span className={styles.historyStatus}>
                    {exp.status === 'completed' ? '✓ Complete' : exp.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
