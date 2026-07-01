'use client'

import type { LocalTransaction } from '../db/cashflow-db'
import styles from './TransactionList.module.css'

interface Props {
  transactions: LocalTransaction[]
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'sales':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      )
    case 'supplies':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      )
    case 'transport':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      )
    case 'rent':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      )
  }
}

export function TransactionList({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <p className={styles.emptyText}>No transactions logged yet</p>
        <p className={styles.emptyHint}>Tap the green &apos;+&apos; button below to add your first sale or expense!</p>
      </div>
    )
  }

  // Group transactions by entry_date
  const groups: { [date: string]: LocalTransaction[] } = {}
  transactions.forEach((tx) => {
    if (!groups[tx.entry_date]) {
      groups[tx.entry_date] = []
    }
    groups[tx.entry_date].push(tx)
  })

  // Sort dates descending
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  const formatDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (dateStr === today) return 'Today'
    if (dateStr === yesterday) return 'Yesterday'

    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className={styles.container}>
      {sortedDates.map((dateStr) => (
        <div key={dateStr} className={styles.group}>
          <h3 className={styles.groupHeader}>{formatDateLabel(dateStr)}</h3>
          <div className={styles.groupList}>
            {groups[dateStr].map((tx) => (
              <div key={tx.id} className={`${styles.row} ${tx.type === 'income' ? styles.rowIncome : styles.rowExpense}`}>
                <div className={`${styles.iconWrapper} ${tx.type === 'income' ? styles.iconIncome : styles.iconExpense}`}>
                  {getCategoryIcon(tx.category)}
                </div>

                <div className={styles.content}>
                  <div className={styles.mainInfo}>
                    <span className={styles.category}>{tx.category}</span>
                    <span className={`${styles.amount} ${tx.type === 'income' ? styles.income : styles.expense}`}>
                      {tx.type === 'income' ? '+' : '-'}₦{tx.amount.toLocaleString('en-US')}
                    </span>
                  </div>

                  <div className={styles.subInfo}>
                    <span className={styles.note}>{tx.note || 'No note'}</span>
                    <span className={styles.syncStatus} title={tx.synced_at ? 'Synced' : 'Pending Sync'}>
                      {tx.synced_at ? (
                        <svg className={styles.syncedIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg className={styles.unsyncedIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                          <path d="M17.5 19a3.5 3.5 0 0 0 .5-3A6.97 6.97 0 0 0 18 10a6 6 0 1 0-11.95.8A3.5 3.5 0 1 0 5.5 19H17.5z" />
                        </svg>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
