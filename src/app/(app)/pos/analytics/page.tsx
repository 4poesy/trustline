'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, Clock, Calendar, BarChart2, ShieldAlert } from 'lucide-react'
import { usePos } from '@/modules/pos/hooks/usePos'
import { useAppConfig } from '@/modules/i18n/AppContext'
import styles from './page.module.css'

export default function PosAnalyticsPage() {
  const router = useRouter()
  const { loadPosAnalytics } = usePos()
  const { formatCurrency } = useAppConfig()

  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      const data = await loadPosAnalytics(30) // last 30 days
      setAnalytics(data)
      setLoading(false)
    }
    fetchAnalytics()
  }, [loadPosAnalytics])

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Analyzing POS data...</p>
      </div>
    )
  }

  if (!analytics || analytics.totalCount === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <button onClick={() => router.back()} className={styles.backButton} aria-label="Go back">
              <ArrowLeft size={20} />
            </button>
            <h1 className={styles.title}>POS Analytics</h1>
            <div style={{ width: 40 }} />
          </div>
          <div className={styles.headerBorderBottom}>
            <svg className={styles.waveSvg} viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,60 C150,90 350,90 500,60 C650,30 850,30 1000,60 C1150,90 1250,90 1200,60 L1200,120 L0,120 Z" fill="var(--color-background)"></path>
              <path d="M0,60 C150,90 350,90 500,60 C650,30 850,30 1000,60 C1150,90 1250,90 1200,60" fill="none" stroke="var(--saffron)" strokeWidth="3"></path>
            </svg>
          </div>
        </header>
        <main className={styles.main}>
          <div className={styles.emptyState}>
            <span>📊</span>
            <h3>No transaction data yet</h3>
            <p>Log transactions on the log screen to populate business metrics and volume trends.</p>
            <button onClick={() => router.push('/pos/log')} className="btn btn-primary">
              Log POS Transaction
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Find best type
  let bestType = 'N/A'
  let bestCount = 0
  Object.entries(analytics.typeBreakdown).forEach(([k, v]: [string, any]) => {
    if (v > bestCount) {
      bestCount = v
      bestType = k.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
    }
  })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button onClick={() => router.back()} className={styles.backButton} aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>POS Insights</h1>
          <div style={{ width: 40 }} />
        </div>
        <div className={styles.headerBorderBottom}>
          <svg className={styles.waveSvg} viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,60 C150,90 350,90 500,60 C650,30 850,30 1000,60 C1150,90 1250,90 1200,60 L1200,120 L0,120 Z" fill="var(--color-background)"></path>
            <path d="M0,60 C150,90 350,90 500,60 C650,30 850,30 1000,60 C1150,90 1250,90 1200,60" fill="none" stroke="var(--saffron)" strokeWidth="3"></path>
          </svg>
        </div>
      </header>

      <main className={styles.main}>
        {/* Advice Banner */}
        <section className={`card ${styles.adviceCard}`}>
          <span className={styles.adviceEmoji}>💡</span>
          <div className={styles.adviceText}>
            <h4>Business Recommendation</h4>
            <p>
              Your busiest day is <strong>{analytics.busiestDay}</strong> and peak hour is <strong>{analytics.peakHour}</strong>. 
              Ensure you secure additional cash and bank float before these hours to capture all customer transactions.
            </p>
          </div>
        </section>

        {/* Overview Stats */}
        <section className={styles.statsGrid}>
          <div className={`card ${styles.statCard}`}>
            <span className={styles.statLabel}>Processed Transactions</span>
            <strong className={styles.statValue}>{analytics.totalCount}</strong>
            <span className={styles.statSub}>Last 30 days</span>
          </div>

          <div className={`card ${styles.statCard}`}>
            <span className={styles.statLabel}>Net Markup Fees</span>
            <strong className={`${styles.statValue} ${styles.greenText}`}>
              {formatCurrency(analytics.totalFees)}
            </strong>
            <span className={styles.statSub}>Actual income earned</span>
          </div>
        </section>

        {/* Detailed Insights List */}
        <section className={`card ${styles.detailsCard}`}>
          <h3 className={styles.cardTitle}>Operational Ratios</h3>
          
          <div className={styles.ratioList}>
            <div className={styles.ratioItem}>
              <div className={styles.ratioHeader}>
                <Clock size={16} /> Busiest Time of Day
              </div>
              <strong className={styles.ratioVal}>{analytics.peakHour}</strong>
            </div>

            <div className={styles.ratioItem}>
              <div className={styles.ratioHeader}>
                <Calendar size={16} /> Busiest Day of Week
              </div>
              <strong className={styles.ratioVal}>{analytics.busiestDay}</strong>
            </div>

            <div className={styles.ratioItem}>
              <div className={styles.ratioHeader}>
                <TrendingUp size={16} /> Most Popular Request
              </div>
              <strong className={styles.ratioVal}>{bestType}</strong>
            </div>

            <div className={styles.ratioItem}>
              <div className={styles.ratioHeader}>
                <BarChart2 size={16} /> Average Markup Fee
              </div>
              <strong className={styles.ratioVal}>{formatCurrency(analytics.averageFee)}</strong>
            </div>
          </div>
        </section>

        {/* Customer Volume card */}
        <section className={`card ${styles.volumeCard}`}>
          <span className={styles.volumeLabel}>Customer Volume Handled</span>
          <strong className={styles.volumeValue}>{formatCurrency(analytics.totalVolume)}</strong>
          <p className={styles.volumeHint}>
            This represents the total customer money processed (not your income). 
            Handling this volume builds consistency records which boost your reputation rating.
          </p>
        </section>
      </main>
    </div>
  )
}
