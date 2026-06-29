'use client'

import styles from './TransactionSummary.module.css'

interface Props {
  income: number
  expense: number
}

export function TransactionSummary({ income, expense }: Props) {
  const net = income - expense

  return (
    <section className={styles.container}>
      <div className={styles.netWrapper}>
        <span className={styles.label}>Net Balance</span>
        <h2 className={`${styles.netValue} ${net >= 0 ? styles.positive : styles.negative}`}>
          ₦{net.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </h2>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.card}>
          <div className={`${styles.icon} ${styles.iconIncome}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Income</span>
            <span className={styles.cardValueIncome}>
              ₦{income.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={`${styles.icon} ${styles.iconExpense}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Expenses</span>
            <span className={styles.cardValueExpense}>
              ₦{expense.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
