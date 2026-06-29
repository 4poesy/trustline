'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useCashflow } from '@/modules/cashflow/hooks/useCashflow'
import { TransactionSummary } from '@/modules/cashflow/components/TransactionSummary'
import { TransactionList } from '@/modules/cashflow/components/TransactionList'
import styles from './page.module.css'

export default function CashflowPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const {
    transactions,
    loading: dbLoading,
    isSyncing,
    hasUnsynced,
    triggerSync,
  } = useCashflow(profile?.id)

  const [filter, setFilter] = useState<'week' | 'month' | 'all'>('all')

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions

    const now = new Date()
    const cutoff = new Date()

    if (filter === 'week') {
      cutoff.setDate(now.getDate() - 7)
    } else if (filter === 'month') {
      cutoff.setMonth(now.getMonth() - 1)
    }

    const cutoffStr = cutoff.toISOString().split('T')[0]
    return transactions.filter(t => t.entry_date >= cutoffStr)
  }, [transactions, filter])

  // Calculate totals
  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        income += tx.amount
      } else {
        expense += tx.amount
      }
    })
    return { income, expense }
  }, [filteredTransactions])

  if (authLoading || dbLoading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading cashflow records...</p>
      </div>
    )
  }

  if (!profile) {
    router.replace('/login')
    return null
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button className={styles.backButton} onClick={() => router.replace('/dashboard')} aria-label="Back to dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className={styles.title}>Cashflow Tracker</h1>
          
          <button 
            className={`${styles.syncButton} ${isSyncing ? styles.syncing : ''}`} 
            onClick={triggerSync}
            disabled={isSyncing}
            title={hasUnsynced ? 'Unsynced records pending' : 'All records synced'}
          >
            {isSyncing ? (
              <span className="spinner" />
            ) : hasUnsynced ? (
              <svg className={styles.unsyncedIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                <path d="M17.5 19a3.5 3.5 0 0 0 .5-3A6.97 6.97 0 0 0 18 10a6 6 0 1 0-11.95.8A3.5 3.5 0 1 0 5.5 19H17.5z" />
              </svg>
            ) : (
              <svg className={styles.syncedIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <TransactionSummary income={totals.income} expense={totals.expense} />

        <div className={styles.filterRow}>
          <button
            className={`${styles.filterBtn} ${filter === 'week' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('week')}
          >
            This Week
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'month' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('month')}
          >
            This Month
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('all')}
          >
            All Time
          </button>
        </div>

        <TransactionList transactions={filteredTransactions} />
      </main>

      <Link href="/cashflow/add" className={styles.fab} aria-label="Add transaction" id="add-transaction-fab">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="24" height="24">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>
    </div>
  )
}
