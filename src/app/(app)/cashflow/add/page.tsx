'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useCashflow } from '@/modules/cashflow/hooks/useCashflow'
import styles from './page.module.css'

const categories = [
  { id: 'Sales', label: 'Sales', icon: '💰' },
  { id: 'Supplies', label: 'Supplies', icon: '📦' },
  { id: 'Transport', label: 'Transport', icon: '🚗' },
  { id: 'Rent', label: 'Rent', icon: '🏠' },
  { id: 'Other', label: 'Other', icon: '⚙️' },
]

export default function AddTransactionPage() {
  const { profile, loading: authLoading } = useAuth()
  const { addTransaction } = useCashflow(profile?.id)
  const router = useRouter()

  const [type, setType] = useState<'income' | 'expense'>('income')
  const [amountStr, setAmountStr] = useState('')
  const [category, setCategory] = useState('Sales')
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0])

  const handleKeyPress = (val: string) => {
    if (val === 'backspace') {
      setAmountStr(prev => prev.slice(0, -1))
    } else if (val === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr(prev => (prev === '' ? '0.' : prev + '.'))
      }
    } else {
      // Prevent typing more than 2 decimal digits
      if (amountStr.includes('.')) {
        const [, decimals] = amountStr.split('.')
        if (decimals && decimals.length >= 2) return
      }
      setAmountStr(prev => prev + val)
    }
  }

  const handleSave = async () => {
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) return

    try {
      await addTransaction({
        type,
        amount,
        category,
        note: note.trim() || undefined,
        entry_date: entryDate,
      })
      // Return instantly
      router.replace('/cashflow')
    } catch (e) {
      console.error(e)
    }
  }

  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading...</p>
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
        <button className={styles.backButton} onClick={() => router.replace('/cashflow')} aria-label="Cancel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h1 className={styles.title}>New Entry</h1>
        <div style={{ width: 40 }} /> {/* spacer */}
      </header>

      <main className={styles.main}>
        {/* Toggle Income/Expense */}
        <div className={styles.toggleContainer}>
          <button
            type="button"
            className={`${styles.toggleButton} ${type === 'income' ? styles.toggleIncome : ''}`}
            onClick={() => setType('income')}
          >
            Income
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${type === 'expense' ? styles.toggleExpense : ''}`}
            onClick={() => setType('expense')}
          >
            Expense
          </button>
        </div>

        {/* Display Amount */}
        <div className={styles.displayContainer}>
          <span className={styles.currencySymbol}>₦</span>
          <div className={styles.amountDisplay}>
            {amountStr || '0'}
          </div>
        </div>

        {/* Category Picker */}
        <div className={styles.section}>
          <label className={styles.label}>Category</label>
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`${styles.categoryChip} ${category === cat.id ? styles.categoryChipActive : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryLabel}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Note & Date */}
        <div className={styles.advancedSection}>
          {!showNote ? (
            <button
              type="button"
              className={styles.expandButton}
              onClick={() => setShowNote(true)}
            >
              + Add Note &amp; Date
            </button>
          ) : (
            <div className={styles.expandedFields}>
              <div className="form-group">
                <label className="form-label" htmlFor="note-field">Note</label>
                <input
                  id="note-field"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rice bags, Transport fare"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="date-field">Transaction Date</label>
                <input
                  id="date-field"
                  type="date"
                  className="form-input"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className={styles.keypad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
            <button
              key={key}
              type="button"
              className={styles.keypadButton}
              onClick={() => handleKeyPress(key)}
            >
              {key === 'backspace' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              ) : (
                key
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`btn btn-primary btn-large ${styles.saveButton}`}
          disabled={!amountStr || parseFloat(amountStr) <= 0}
          onClick={handleSave}
          id="save-transaction-button"
        >
          Save Entry
        </button>
      </main>
    </div>
  )
}
