'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Coins, Calculator, Check, ShieldAlert } from 'lucide-react'
import { usePos } from '@/modules/pos/hooks/usePos'
import { useAppConfig } from '@/modules/i18n/AppContext'
import styles from './page.module.css'

type PosTxType = 'cash_withdrawal' | 'bank_transfer' | 'airtime_purchase' | 'bill_payment' | 'other'

const TYPE_OPTIONS: { id: PosTxType; label: string; icon: string; bg: string }[] = [
  { id: 'cash_withdrawal', label: 'Withdrawal', icon: '📥', bg: '#eff6ff' },
  { id: 'bank_transfer', label: 'Transfer', icon: '📤', bg: '#f0fdfa' },
  { id: 'airtime_purchase', label: 'Airtime', icon: '📱', bg: '#fef3c7' },
  { id: 'bill_payment', label: 'Bill Pay', icon: '📄', bg: '#f5f3ff' },
  { id: 'other', label: 'Other', icon: '📝', bg: '#f5f5f5' }
]

export default function PosLogTransactionPage() {
  const router = useRouter()
  const { logPosTransaction } = usePos()
  const { formatCurrency } = useAppConfig()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fields State
  const [txType, setTxType] = useState<PosTxType>('cash_withdrawal')
  const [customerAmount, setCustomerAmount] = useState('')
  const [feeCharged, setFeeCharged] = useState('')
  const [feeWaived, setFeeWaived] = useState(false)
  const [note, setNote] = useState('')

  // Auto-suggest fee based on amount and type
  useEffect(() => {
    if (feeWaived) {
      setFeeCharged('0')
      return
    }

    const amt = parseFloat(customerAmount) || 0
    if (amt === 0) {
      setFeeCharged('')
      return
    }

    if (txType === 'cash_withdrawal') {
      if (amt <= 5000) setFeeCharged('100')
      else if (amt <= 20000) setFeeCharged('200')
      else if (amt <= 50000) setFeeCharged('300')
      else setFeeCharged('500')
    } else if (txType === 'bank_transfer') {
      setFeeCharged('100')
    } else if (txType === 'airtime_purchase') {
      setFeeCharged('50')
    } else if (txType === 'bill_payment') {
      setFeeCharged('100')
    } else {
      setFeeCharged('0')
    }
  }, [txType, customerAmount, feeWaived])

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amt = parseFloat(customerAmount)
    const fee = parseFloat(feeCharged)

    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid customer amount.')
      return
    }

    if (!feeWaived && (isNaN(fee) || fee < 0)) {
      setError('Please enter a valid fee charged.')
      return
    }

    setSaving(true)
    const todayStr = new Date().toISOString().split('T')[0]

    const res = await logPosTransaction({
      transaction_type: txType,
      customer_amount: amt,
      fee_charged: feeWaived ? 0 : fee,
      fee_waived: feeWaived,
      note: note.trim() || undefined,
      entry_date: todayStr
    })

    setSaving(false)
    if (res.success) {
      router.replace('/pos')
    } else {
      setError(res.error || 'Failed to save transaction.')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button onClick={() => router.back()} className={styles.backButton} aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>Log POS Transaction</h1>
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
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorAlert}>
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Type picker */}
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <div className={styles.typeGrid}>
              {TYPE_OPTIONS.map((opt) => {
                const selected = txType === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setTxType(opt.id)
                      setFeeWaived(false)
                    }}
                    style={{ backgroundColor: opt.bg }}
                    className={`${styles.typeCard} ${selected ? styles.typeCardActive : ''}`}
                  >
                    <span className={styles.typeIcon}>{opt.icon}</span>
                    <span className={styles.typeLabel}>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Customer Amount */}
          <div className="form-group">
            <label className="form-label">Customer Amount (₦)</label>
            <input 
              type="number" 
              placeholder="e.g. 5000"
              value={customerAmount}
              onChange={(e) => setCustomerAmount(e.target.value)}
              className="form-input"
              style={{ fontSize: 20, fontWeight: 800 }}
              required
            />
          </div>

          {/* Fee selection */}
          {!feeWaived && (
            <div className="form-group">
              <label className="form-label">Fee Charged (₦)</label>
              <input 
                type="number" 
                placeholder="e.g. 100"
                value={feeCharged}
                onChange={(e) => setFeeCharged(e.target.value)}
                className="form-input"
                required
              />
            </div>
          )}

          {/* Fee Waived Checkbox */}
          <div className={styles.toggleRow} onClick={() => setFeeWaived(!feeWaived)}>
            <div className={`${styles.checkbox} ${feeWaived ? styles.checkboxChecked : ''}`}>
              {feeWaived && <Check size={14} className={styles.checkIcon} />}
            </div>
            <div>
              <h4 className={styles.toggleLabel}>Waive Customer Fee</h4>
              <p className={styles.toggleDesc}>For friends or regular customers where you don&apos;t charge a markup.</p>
            </div>
          </div>

          {/* Optional Note */}
          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Customer: Mama Tunde"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button 
              type="submit" 
              disabled={saving}
              className="btn btn-primary btn-large"
            >
              {saving ? 'Logging Transaction...' : 'Save Transaction'}
            </button>
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="btn btn-ghost"
              style={{ width: '100%' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
