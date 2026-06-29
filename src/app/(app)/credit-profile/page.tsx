import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTrustMetrics } from '@/modules/credit/lib/trust-calculator'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Your Credit & Trust Profile — Trustline',
}

export default async function CreditProfilePage() {
  const supabase = await createClient()

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get calculated metrics (loads from cache or triggers cron calculation)
  const metrics = await getTrustMetrics(user.id)

  const getIncomeConsistencyLabel = (score: number) => {
    if (score >= 90) return 'Excellent consistency'
    if (score >= 70) return 'Very steady'
    if (score >= 50) return 'Steady logs'
    return 'Building logs'
  }

  const getIncomeConsistencyDesc = (score: number) => {
    return `You've logged income in ${score}% of the last 12 weeks — steady records establish credibility.`
  }

  const getSavingsDisciplineLabel = (score: number) => {
    if (score >= 90) return 'Outstanding savings discipline'
    if (score >= 75) return 'Good savings record'
    return 'Building savings habit'
  }

  const getSavingsDisciplineDesc = (score: number) => {
    if (score === 0) {
      return 'Join a savings group and log your contributions to start building this score!'
    }
    return `You've logged ${score}% of your scheduled contributions on time. Group members value your reliability.`
  }

  const getReputationLabel = (score: number) => {
    if (score >= 4.5) return 'Exceptional reputation'
    if (score >= 4.0) return 'Strong customer trust'
    if (score >= 1.0) return 'Good feedback'
    return 'No reviews yet'
  }

  const getReputationDesc = (score: number) => {
    if (score === 0) {
      return 'Share your directory profile link to start collecting ratings and reviews from customers.'
    }
    return `Your average customer rating is ${score} / 5.0. Verified reviews confirm customer satisfaction.`
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Back to dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 className={styles.title}>Trust Profile</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.introCard}>
          <h2 className={styles.introTitle}>Your Reputation is Your Credit</h2>
          <p className={styles.introText}>
            Trustline builds your profile using real daily activity. Each sale, review, and group saving contribution shows partners that your business is consistent and reliable.
          </p>
        </div>

        {/* 3 Trust components */}
        <div className={styles.metricsContainer}>
          {/* Income Consistency */}
          <div className={`card ${styles.metricCard}`}>
            <div className={styles.metricHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconTeal}`}>
                📊
              </div>
              <div>
                <h3 className={styles.metricTitle}>Income Consistency</h3>
                <span className={styles.metricBadge}>{getIncomeConsistencyLabel(Number(metrics.income_consistency_score))}</span>
              </div>
            </div>
            <p className={styles.metricDesc}>{getIncomeConsistencyDesc(Number(metrics.income_consistency_score))}</p>
            <div className={styles.progressTrack}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${metrics.income_consistency_score}%` }} 
              />
            </div>
          </div>

          {/* Savings Discipline */}
          <div className={`card ${styles.metricCard}`}>
            <div className={styles.metricHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconGold}`}>
                🛡️
              </div>
              <div>
                <h3 className={styles.metricTitle}>Savings Discipline</h3>
                <span className={styles.metricBadge}>{getSavingsDisciplineLabel(Number(metrics.savings_discipline_score))}</span>
              </div>
            </div>
            <p className={styles.metricDesc}>{getSavingsDisciplineDesc(Number(metrics.savings_discipline_score))}</p>
            {metrics.savings_discipline_score > 0 && (
              <div className={styles.progressTrack}>
                <div 
                  className={`${styles.progressBar} ${styles.progressGold}`} 
                  style={{ width: `${metrics.savings_discipline_score}%` }} 
                />
              </div>
            )}
          </div>

          {/* Reputation */}
          <div className={`card ${styles.metricCard}`}>
            <div className={styles.metricHeader}>
              <div className={`${styles.iconWrapper} ${styles.iconPurple}`}>
                ⭐
              </div>
              <div>
                <h3 className={styles.metricTitle}>Reputation &amp; Trust</h3>
                <span className={styles.metricBadge}>{getReputationLabel(Number(metrics.reputation_score))}</span>
              </div>
            </div>
            <p className={styles.metricDesc}>{getReputationDesc(Number(metrics.reputation_score))}</p>
            {metrics.reputation_score > 0 && (
              <div className={styles.progressTrack}>
                <div 
                  className={`${styles.progressBar} ${styles.progressPurple}`} 
                  style={{ width: `${(metrics.reputation_score / 5) * 100}%` }} 
                />
              </div>
            )}
          </div>
        </div>

        {/* Explainers */}
        <section className={`card ${styles.explainerSection}`}>
          <h3 className={styles.explainerTitle}>What is this used for?</h3>
          <p className={styles.explainerText}>
            Unlike a bank loan which requires collateral, micro-lenders and trading partners rely on <strong>trust</strong>. This profile converts your daily transactions, esusu group reliability, and customer reviews into a transparent reputation report.
          </p>
          <p className={styles.explainerText}>
            <em>Please note:</em> Trustline is a profile-building tool. Sharing this data may help you verify your turnover during future credit conversations, but it does not guarantee a line of credit.
          </p>
        </section>
      </main>
    </div>
  )
}
