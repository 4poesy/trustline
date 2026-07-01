'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useBillPayments } from '@/modules/pay/hooks/useBillPayments'
import { 
  ArrowLeft, 
  Smartphone, 
  Wifi, 
  Zap, 
  Tv, 
  History, 
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard
} from 'lucide-react'
import styles from './page.module.css'

export default function PayMainPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { payments, loading: dbLoading, error } = useBillPayments(profile?.id)

  if (authLoading || dbLoading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading payments dashboard...</p>
      </div>
    )
  }

  if (!profile) {
    router.replace('/login')
    return null
  }

  // Display only the last 5 payments
  const recentPayments = payments.slice(0, 5)

  // Utility to render status badges
  const renderStatusBadge = (status: 'pending' | 'successful' | 'failed') => {
    switch (status) {
      case 'successful':
        return (
          <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>
            <CheckCircle size={12} className={styles.badgeIcon} />
            Successful
          </span>
        )
      case 'pending':
        return (
          <span className={`${styles.statusBadge} ${styles.statusPending}`}>
            <Clock size={12} className={styles.badgeIcon} />
            Pending
          </span>
        )
      case 'failed':
        return (
          <span className={`${styles.statusBadge} ${styles.statusFailed}`}>
            <XCircle size={12} className={styles.badgeIcon} />
            Failed
          </span>
        )
    }
  }

  // Map bill type to icon
  const getBillIcon = (type: string) => {
    switch (type) {
      case 'airtime':
        return <Smartphone size={18} className={styles.historyItemIcon} />
      case 'data':
        return <Wifi size={18} className={styles.historyItemIcon} />
      case 'electricity':
        return <Zap size={18} className={styles.historyItemIcon} />
      case 'tv_subscription':
        return <Tv size={18} className={styles.historyItemIcon} />
      default:
        return <Smartphone size={18} className={styles.historyItemIcon} />
    }
  }

  // Format Date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className={styles.page}>
      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button 
            className={styles.backButton} 
            onClick={() => router.replace('/dashboard')} 
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className={styles.title}>Bill Payments</h1>
          <div style={{ width: 40 }} /> {/* balance spacer */}
        </div>
      </header>

      <main className={styles.main}>
        {/* ===== QUICK CATEGORIES ===== */}
        <section className={styles.categoriesSection}>
          <h2 className={styles.sectionTitle}>What would you like to pay?</h2>
          <div className={styles.categoryGrid}>
            <Link href="/pay/airtime" className={styles.categoryCard}>
              <div className={`${styles.iconContainer} ${styles.airtimeIcon}`}>
                <Smartphone size={28} />
              </div>
              <span className={styles.categoryName}>Buy Airtime</span>
              <span className={styles.categoryDesc}>Top up phone credit</span>
            </Link>

            <Link href="/pay/data" className={styles.categoryCard}>
              <div className={`${styles.iconContainer} ${styles.dataIcon}`}>
                <Wifi size={28} />
              </div>
              <span className={styles.categoryName}>Internet Data</span>
              <span className={styles.categoryDesc}>Renew data plans</span>
            </Link>

            <Link href="/pay/electricity" className={styles.categoryCard}>
              <div className={`${styles.iconContainer} ${styles.powerIcon}`}>
                <Zap size={28} />
              </div>
              <span className={styles.categoryName}>Electricity</span>
              <span className={styles.categoryDesc}>Buy prepaid tokens</span>
            </Link>

            <Link href="/pay/tv" className={styles.categoryCard}>
              <div className={`${styles.iconContainer} ${styles.tvIcon}`}>
                <Tv size={28} />
              </div>
              <span className={styles.categoryName}>Cable TV</span>
              <span className={styles.categoryDesc}>DSTV, GOtv subscriptions</span>
            </Link>

            <Link href="/pay/fund" className={styles.categoryCard}>
              <div className={`${styles.iconContainer} ${styles.fundIcon}`}>
                <CreditCard size={28} />
              </div>
              <span className={styles.categoryName}>Fund Wallet</span>
              <span className={styles.categoryDesc}>Add money via Card/Bank</span>
            </Link>
          </div>
        </section>

        {/* ===== RECENT PAYMENTS ===== */}
        <section className={styles.historySection}>
          <div className={styles.sectionHeaderRow}>
            <h2 className={styles.sectionTitle}>Recent Purchases</h2>
            {payments.length > 5 && (
              <Link href="/pay/history" className={styles.viewAllLink}>
                View all <ArrowRight size={14} style={{ marginLeft: 2 }} />
              </Link>
            )}
          </div>

          {error && (
            <div className={styles.errorBanner} role="alert">
              <AlertTriangle size={18} className={styles.errorIcon} />
              <span>{error}</span>
            </div>
          )}

          {recentPayments.length === 0 ? (
            <div className={styles.emptyStateCard}>
              <div className={styles.emptyIconCircle}>
                <Clock size={32} />
              </div>
              <h3>No purchases yet</h3>
              <p>Your payment history will appear here once you make your first purchase.</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {recentPayments.map((payment) => (
                <div key={payment.id} className={styles.historyItem}>
                  <div className={styles.historyItemLeft}>
                    <div className={styles.historyIconWrapper}>
                      {getBillIcon(payment.type)}
                    </div>
                    <div className={styles.historyItemMeta}>
                      <span className={styles.historyItemName}>
                        {payment.network_or_provider} ({payment.type === 'tv_subscription' ? 'Cable TV' : payment.type})
                      </span>
                      <span className={styles.historyItemNumber}>
                        {payment.recipient_number}
                      </span>
                      <span className={styles.historyItemDate}>
                        {formatDate(payment.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.historyItemRight}>
                    <span className={styles.historyItemAmount}>
                      ₦{payment.amount.toLocaleString('en-NG')}
                    </span>
                    {renderStatusBadge(payment.status)}
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
