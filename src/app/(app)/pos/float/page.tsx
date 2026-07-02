'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Coins, Landmark, Target, ShieldCheck, ShieldAlert } from 'lucide-react'
import { usePos } from '@/modules/pos/hooks/usePos'
import { useAppConfig } from '@/modules/i18n/AppContext'
import styles from './page.module.css'

export default function PosFloatManagementPage() {
  const router = useRouter()
  const { floatTracker, loading, updateFloatTracker } = usePos()
  const { formatCurrency } = useAppConfig()

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fields State
  const [cashOnHand, setCashOnHand] = useState('')
  const [bankBalance, setBankBalance] = useState('')
  const [minFloatTarget, setMinFloatTarget] = useState('')

  // Load current values
  useEffect(() => {
    if (floatTracker) {
      setCashOnHand(floatTracker.cash_on_hand.toString())
      setBankBalance(floatTracker.bank_balance.toString())
      setMinFloatTarget(floatTracker.minimum_float_needed ? floatTracker.minimum_float_needed.toString() : '')
    }
  }, [floatTracker])

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    const cash = parseFloat(cashOnHand)
    const bank = parseFloat(bankBalance)
    const target = minFloatTarget ? parseFloat(minFloatTarget) : null

    if (isNaN(cash) || cash < 0) {
      setError('Please enter a valid cash on hand amount.')
      setSaving(false)
      return
    }

    if (isNaN(bank) || bank < 0) {
      setError('Please enter a valid bank balance.')
      setSaving(false)
      return
    }

    if (target !== null && (isNaN(target) || target < 0)) {
      setError('Please enter a valid daily float target.')
      setSaving(false)
      return
    }

    const res = await updateFloatTracker({
      cash_on_hand: cash,
      bank_balance: bank,
      minimum_float_needed: target
    })

    setSaving(false)
    if (res.success) {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        router.push('/pos')
      }, 1500)
    } else {
      setError(res.error || 'Failed to save float tracker values.')
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading float details...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button onClick={() => router.back()} className={styles.backButton} aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>Manage Float</h1>
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
        <form onSubmit={handleSave} className={styles.form}>
          {success && (
            <div className={styles.successAlert}>
              <ShieldCheck size={18} />
              <span>Float details saved successfully!</span>
            </div>
          )}

          {error && (
            <div className={styles.errorAlert}>
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Current Available summary */}
          <div className={`card ${styles.summaryCard}`}>
            <span className={styles.summaryLabel}>Total Calculated Available</span>
            <strong className={styles.summaryValue}>
              {formatCurrency((parseFloat(cashOnHand) || 0) + (parseFloat(bankBalance) || 0))}
            </strong>
          </div>

          {/* Cash on Hand */}
          <div className="form-group">
            <label className="form-label">
              <Coins size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--color-success)' }} />
              Cash on Hand (Physical Cash) (₦)
            </label>
            <input 
              type="number" 
              placeholder="e.g. 50000"
              value={cashOnHand}
              onChange={(e) => setCashOnHand(e.target.value)}
              className="form-input"
              required
            />
            <p className={styles.fieldHint}>Physical Naira bills inside your drawer or cash box.</p>
          </div>

          {/* Bank Balance */}
          <div className="form-group">
            <label className="form-label">
              <Landmark size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: '#3b82f6' }} />
              Bank Settlement Balance (₦)
            </label>
            <input 
              type="number" 
              placeholder="e.g. 150000"
              value={bankBalance}
              onChange={(e) => setBankBalance(e.target.value)}
              className="form-input"
              required
            />
            <p className={styles.fieldHint}>Settlement/wallet balance in your terminal service bank.</p>
          </div>

          {/* Daily Float Target */}
          <div className="form-group">
            <label className="form-label">
              <Target size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--saffron)' }} />
              Minimum Float Needed Target (₦)
            </label>
            <input 
              type="number" 
              placeholder="e.g. 200000"
              value={minFloatTarget}
              onChange={(e) => setMinFloatTarget(e.target.value)}
              className="form-input"
            />
            <p className={styles.fieldHint}>Self-set daily minimum threshold to alert you when liquidity is low.</p>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button 
              type="submit" 
              disabled={saving}
              className="btn btn-primary btn-large"
            >
              {saving ? 'Saving Float...' : 'Update Float Values'}
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
