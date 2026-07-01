'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, TrendingUp, HelpCircle, Star, Calendar, Flame, AlertCircle } from 'lucide-react'
import styles from './page.module.css'

export default function BusinessInsightsPage() {
  const { profile } = useAuth()

  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [activeHelp, setActiveHelp] = useState<string | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      if (!profile?.id) return
      try {
        const response = await supabase.functions.invoke('generate-business-insights', {
          body: { profile_id: profile.id }
        })

        if (response.error) throw new Error(response.error)
        if (response.data?.success) {
          setInsights(response.data.insights)
        }
      } catch (err: any) {
        console.error(err)
        setErrorMsg('Failed to compile your business insights.')
      } finally {
        setLoading(false)
      }
    }
    fetchInsights()
  }, [profile?.id])

  const toggleHelp = (key: string) => {
    setActiveHelp(activeHelp === key ? null : key)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Analyzing cashflow trends and compiling insights...</p>
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
          <h1 className={styles.title}>Business Insights</h1>
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

        {insights && (
          <>
            {/* Top overview card */}
            <section className={`card ${styles.overviewCard}`}>
              <div className={styles.overviewHeader}>
                <TrendingUp size={28} className={styles.trendIcon} />
                <div>
                  <h3>THIS MONTH'S TOTAL INCOME</h3>
                  <h2>{insights.currency} {Number(insights.thisMonthIncome || 0).toLocaleString()}</h2>
                </div>
              </div>
              <p className={styles.subText}>
                Projected to end the month at{' '}
                <strong>
                  {insights.currency} {Number(insights.projectedMonthlyIncome || 0).toLocaleString()}
                </strong>
              </p>
            </section>

            {/* Grid of Insight Cards */}
            <section className={styles.grid}>
              
              {/* Best Sales Day */}
              <div className={`card ${styles.insightCard}`}>
                <div className={styles.cardHeader}>
                  <Calendar size={20} className={styles.cardIcon} />
                  <h4>Best Sales Day</h4>
                  <button onClick={() => toggleHelp('bestDay')} className={styles.helpBtn} aria-label="Explain best sales day">
                    <HelpCircle size={14} />
                  </button>
                </div>
                <h3 className={styles.cardVal}>{insights.bestSalesDay || 'N/A'}</h3>
                {activeHelp === 'bestDay' && (
                  <p className={styles.explanation}>Historically, you receive the highest transaction volume on this day of the week.</p>
                )}
              </div>

              {/* Month-on-Month Change */}
              <div className={`card ${styles.insightCard}`}>
                <div className={styles.cardHeader}>
                  <TrendingUp size={20} className={styles.cardIcon} />
                  <h4>Month-on-Month Trend</h4>
                  <button onClick={() => toggleHelp('trend')} className={styles.helpBtn} aria-label="Explain trend">
                    <HelpCircle size={14} />
                  </button>
                </div>
                <h3 className={`${styles.cardVal} ${insights.momPercent >= 0 ? styles.positiveText : styles.negativeText}`}>
                  {insights.momPercent >= 0 ? '+' : ''}{insights.momPercent}%
                </h3>
                {activeHelp === 'trend' && (
                  <p className={styles.explanation}>The percentage increase or decrease in logged sales compared to last month.</p>
                )}
              </div>

              {/* Income Streak */}
              <div className={`card ${styles.insightCard}`}>
                <div className={styles.cardHeader}>
                  <Flame size={20} className={styles.cardIcon} style={{ color: 'var(--color-secondary-500)' }} />
                  <h4>Logging Streak</h4>
                  <button onClick={() => toggleHelp('streak')} className={styles.helpBtn} aria-label="Explain streak">
                    <HelpCircle size={14} />
                  </button>
                </div>
                <h3 className={styles.cardVal}>{insights.streak || 0} Days</h3>
                {activeHelp === 'streak' && (
                  <p className={styles.explanation}>The number of consecutive days you have logged at least one transaction on the platform.</p>
                )}
              </div>

              {/* Top Expense */}
              <div className={`card ${styles.insightCard}`}>
                <div className={styles.cardHeader}>
                  <AlertCircle size={20} className={styles.cardIcon} style={{ color: 'var(--color-error)' }} />
                  <h4>Top Expense Type</h4>
                  <button onClick={() => toggleHelp('expense')} className={styles.helpBtn} aria-label="Explain top expense">
                    <HelpCircle size={14} />
                  </button>
                </div>
                <h3 className={styles.cardVal} style={{ fontSize: '1.1rem' }}>{insights.topExpenseCategory || 'None'}</h3>
                {activeHelp === 'expense' && (
                  <p className={styles.explanation}>The categories where you record the highest volume of business expenses.</p>
                )}
              </div>

            </section>

            {/* Benchmark Comparison */}
            {insights.benchmarkComparison && (
              <section className={`card ${styles.benchmarkCard}`}>
                <div className={styles.benchmarkHeader}>
                  <Star size={20} className={styles.starIcon} />
                  <h4>Local Benchmark Comparison</h4>
                </div>
                <p className={styles.benchmarkLabel}>{insights.benchmarkComparison.label}</p>
                <div className={styles.progressRow}>
                  <span className={styles.progressText}>Lower 25%</span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressIndicator} style={{ left: `${insights.benchmarkComparison.percentile}%` }} />
                  </div>
                  <span className={styles.progressText}>Top 10%</span>
                </div>
              </section>
            )}

            {/* Chart Simulation */}
            <section className={`card ${styles.chartCard}`}>
              <h4>Weekly Sales Distribution</h4>
              <div className={styles.barChart}>
                <div className={styles.barCol}>
                  <div className={styles.barFill} style={{ height: '40%' }} />
                  <span>W1</span>
                </div>
                <div className={styles.barCol}>
                  <div className={styles.barFill} style={{ height: '65%' }} />
                  <span>W2</span>
                </div>
                <div className={styles.barCol}>
                  <div className={styles.barFill} style={{ height: '85%' }} />
                  <span>W3</span>
                </div>
                <div className={styles.barCol}>
                  <div className={styles.barFill} style={{ height: '50%' }} />
                  <span>W4</span>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
