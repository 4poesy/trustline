'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Landmark, Coins, Target, TrendingUp, BarChart2, ListFilter, HelpCircle, Clock } from 'lucide-react'
import { usePos } from '@/modules/pos/hooks/usePos'
import { useAppConfig } from '@/modules/i18n/AppContext'
import type { LocalPosTransaction } from '@/modules/cashflow/db/cashflow-db'
import styles from './page.module.css'

export default function PosHubPage() {
  const router = useRouter()
  const { floatTracker, loading: posLoading, fetchPosTransactions, updateFloatTracker } = usePos()
  const { formatCurrency, formatDate } = useAppConfig()

  const [todayTxs, setTodayTxs] = useState<LocalPosTransaction[]>([])
  const [loading, setLoading] = useState(true)

  // Aggregated Today Stats
  const [txCount, setTxCount] = useState(0)
  const [customerVolume, setCustomerVolume] = useState(0)
  const [feesEarned, setFeesEarned] = useState(0)

  const loadTodayData = useCallback(async () => {
    setLoading(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const list = await fetchPosTransactions(todayStr)
      setTodayTxs(list)

      setTxCount(list.length)
      setCustomerVolume(list.reduce((sum, t) => sum + Number(t.customer_amount), 0))
      setFeesEarned(list.reduce((sum, t) => sum + (t.fee_waived ? 0 : Number(t.fee_charged)), 0))
    } catch (e) {
      console.error('Error loading today POS data:', e)
    } finally {
      setLoading(false)
    }
  }, [fetchPosTransactions])

  useEffect(() => {
    loadTodayData()
  }, [loadTodayData])

  // Helpers
  const getTypeName = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'cash_withdrawal': return '📥'
      case 'bank_transfer': return '📤'
      case 'airtime_purchase': return '📱'
      case 'bill_payment': return '📄'
      case 'account_opening': return '👤'
      default: return '📝'
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Go back">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>POS Operator Hub</h1>
          <Link href="/pos/analytics" className={styles.analyticsLink} title="POS Analytics">
            <BarChart2 size={20} />
          </Link>
        </div>
        <div className={styles.headerBorderBottom}>
          <svg className={styles.waveSvg} viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,60 C150,90 350,90 500,60 C650,30 850,30 1000,60 C1150,90 1250,90 1200,60 L1200,120 L0,120 Z" fill="var(--color-background)"></path>
            <path d="M0,60 C150,90 350,90 500,60 C650,30 850,30 1000,60 C1150,90 1250,90 1200,60" fill="none" stroke="var(--saffron)" strokeWidth="3"></path>
          </svg>
        </div>
      </header>

      <main className={styles.main}>
        {/* Float Status Summary Panel */}
        {floatTracker && (
          <section className={`card ${styles.floatCard}`}>
            <div className={styles.cardHeaderRow}>
              <h3 className={styles.cardSectionTitle}>💵 Float Status</h3>
              <Link href="/pos/float" className={styles.manageFloatLink}>Manage Float</Link>
            </div>
            
            <div className={styles.floatRow}>
              <div className={styles.floatValItem}>
                <span className={styles.floatLabel}>Cash on Hand</span>
                <span className={styles.floatAmount}>{formatCurrency(floatTracker.cash_on_hand)}</span>
              </div>
              <div className={styles.floatValItem}>
                <span className={styles.floatLabel}>Bank Settlement</span>
                <span className={styles.floatAmount}>{formatCurrency(floatTracker.bank_balance)}</span>
              </div>
            </div>

            <div className={styles.floatProgressSection}>
              <div className={styles.floatSummaryRow}>
                <span>Total Available: <strong>{formatCurrency(floatTracker.cash_on_hand + floatTracker.bank_balance)}</strong></span>
                {floatTracker.minimum_float_needed && (
                  <span>Target: {formatCurrency(floatTracker.minimum_float_needed)}</span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Today's POS Activity Panel */}
        <section className={`card ${styles.activityCard}`}>
          <h3 className={styles.cardSectionTitle}>📈 Today&apos;s Operations</h3>
          
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Count</span>
              <span className={styles.statValue}>{txCount}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Customer Volume</span>
              <span className={styles.statValue}>{formatCurrency(customerVolume)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Net Fees Income</span>
              <span className={`${styles.statValue} ${styles.incomeText}`}>{formatCurrency(feesEarned)}</span>
            </div>
          </div>
        </section>

        {/* Quick Action Trigger */}
        <button 
          onClick={() => router.push('/pos/log')}
          className="btn btn-primary btn-large"
          style={{ width: '100%', height: 52, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={20} /> Log POS Transaction
        </button>

        {/* Recent Transactions List */}
        <section className={styles.recentSection}>
          <h3 className={styles.sectionTitle}>Recent Today</h3>

          {loading ? (
            <div className={styles.loader}>
              <span className="spinner" />
              <p>Loading transactions...</p>
            </div>
          ) : todayTxs.length === 0 ? (
            <div className={styles.emptyState}>
              <span>🏧</span>
              <h4>No transaction logged today</h4>
              <p>Transactions you log will show up here. Your fee income builds your reputation score.</p>
            </div>
          ) : (
            <div className={styles.txList}>
              {todayTxs.map((tx) => (
                <div key={tx.id} className={styles.txItem}>
                  <div className={styles.txIcon}>{getTypeEmoji(tx.transaction_type)}</div>
                  <div className={styles.txDetails}>
                    <div className={styles.txHeaderRow}>
                      <h4 className={styles.txTitle}>{getTypeName(tx.transaction_type)}</h4>
                      <span className={styles.txValue}>{formatCurrency(tx.customer_amount)}</span>
                    </div>
                    <div className={styles.txSubRow}>
                      <span className={styles.txTime}>
                        <Clock size={11} /> {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={styles.txFee}>
                        Fee: {tx.fee_waived ? 'Waived' : formatCurrency(tx.fee_charged)}
                      </span>
                    </div>
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
