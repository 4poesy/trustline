'use client'

import React from 'react'
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
        <span className={styles.label}>NET BALANCE</span>
        <h2 className={`${styles.netValue} ${net >= 0 ? styles.positive : styles.negative}`}>
          ₦{net.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </h2>
      </div>

      <div className={styles.divider} />

      <div className={styles.detailsGrid}>
        <div className={styles.card}>
          <div className={`${styles.icon} ${styles.iconIncome}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>TOTAL INCOME</span>
            <span className={styles.cardValueIncome}>
              ₦{income.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={`${styles.icon} ${styles.iconExpense}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
              <line x1="17" y1="7" x2="7" y2="17" />
              <polyline points="17 17 7 17 7 7" />
            </svg>
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>TOTAL EXPENSES</span>
            <span className={styles.cardValueExpense}>
              ₦{expense.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
