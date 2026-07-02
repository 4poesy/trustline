'use client'

import React from 'react'
import Link from 'next/link'
import { Landmark, Coins, Target, AlertTriangle, ArrowRight } from 'lucide-react'
import { usePos } from '../hooks/usePos'
import { useAppConfig } from '@/modules/i18n/AppContext'
import styles from './FloatWidget.module.css'

export function FloatWidget() {
  const { floatTracker, loading } = usePos()
  const { formatCurrency } = useAppConfig()

  if (loading || !floatTracker) {
    return (
      <div className={`card ${styles.widgetCard} ${styles.loading}`}>
        <span className="spinner" />
        <p>Loading Float Status...</p>
      </div>
    )
  }

  const { cash_on_hand, bank_balance, minimum_float_needed } = floatTracker
  const totalAvailable = cash_on_hand + bank_balance
  
  const targetPercent = minimum_float_needed && minimum_float_needed > 0
    ? Math.min(100, Math.round((totalAvailable / minimum_float_needed) * 100))
    : 0

  // Warning calculations
  const isBelow25 = minimum_float_needed ? totalAvailable < minimum_float_needed * 0.25 : false
  const isBelow50 = minimum_float_needed ? totalAvailable < minimum_float_needed * 0.50 : false

  return (
    <section className={`card ${styles.widgetCard}`} id="pos-float-widget">
      <div className={styles.widgetHeader}>
        <div className={styles.titleBlock}>
          <span className={styles.iconWrapper}>💵</span>
          <div>
            <h3 className={styles.widgetTitle}>Float Status</h3>
            <span className={styles.widgetSubtitle}>POS BUSINESS LIQUIDITY</span>
          </div>
        </div>
        <Link href="/pos" className={styles.hubLink} title="POS Hub">
          POS Hub <ArrowRight size={14} />
        </Link>
      </div>

      <div className={styles.totalsGrid}>
        <div className={styles.totalItem}>
          <div className={styles.totalLabel}>
            <Coins size={14} className={styles.cashIcon} /> Cash on Hand
          </div>
          <span className={styles.totalValue}>{formatCurrency(cash_on_hand)}</span>
        </div>
        
        <div className={styles.totalItem}>
          <div className={styles.totalLabel}>
            <Landmark size={14} className={styles.bankIcon} /> Bank Balance
          </div>
          <span className={styles.totalValue}>{formatCurrency(bank_balance)}</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.sumRow}>
        <span className={styles.sumLabel}>Total Available Float</span>
        <strong className={styles.sumValue}>{formatCurrency(totalAvailable)}</strong>
      </div>

      {minimum_float_needed && minimum_float_needed > 0 ? (
        <div className={styles.targetBlock}>
          <div className={styles.targetHeader}>
            <span className={styles.targetLabel}>
              <Target size={12} /> Daily Target Progress
            </span>
            <span className={styles.targetValues}>
              {targetPercent}% ({formatCurrency(minimum_float_needed)} target)
            </span>
          </div>
          
          <div className={styles.progressBarWrapper}>
            <div 
              className={`${styles.progressBar} ${
                isBelow25 
                  ? styles.barDanger 
                  : isBelow50 
                    ? styles.barWarning 
                    : styles.barSuccess
              }`} 
              style={{ width: `${targetPercent}%` }}
            />
          </div>

          {isBelow25 ? (
            <div className={`${styles.alertBox} ${styles.alertDanger}`}>
              <AlertTriangle size={16} />
              <span>🚨 Float running dangerously low! Top up bank/cash immediately.</span>
            </div>
          ) : isBelow50 ? (
            <div className={`${styles.alertBox} ${styles.alertWarning}`}>
              <AlertTriangle size={16} />
              <span>⚠️ Float running low — consider topping up before peak hours.</span>
            </div>
          ) : (
            <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
              <span>✅ Float targets healthy. Ready for transactions!</span>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.noTargetBlock}>
          <p>No float target set. Set a daily minimum float goal to monitor capacity.</p>
          <Link href="/pos/float" className={styles.setupTargetLink}>Set Float Target</Link>
        </div>
      )}

      <div className={styles.widgetActions}>
        <Link href="/pos/float" className={`btn btn-secondary ${styles.actionBtn}`}>
          Update Float
        </Link>
        <Link href="/pos/log" className={`btn btn-primary ${styles.actionBtn}`}>
          Log POS Sale
        </Link>
      </div>
    </section>
  )
}
