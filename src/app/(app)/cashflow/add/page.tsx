'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  ShoppingBag, 
  Truck, 
  Home, 
  PlusCircle, 
  X 
} from 'lucide-react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useCashflow } from '@/modules/cashflow/hooks/useCashflow'
import styles from './page.module.css'

const categories = [
  { id: 'Sales', label: 'Sales', icon: TrendingUp },
  { id: 'Supplies', label: 'Supplies', icon: ShoppingBag },
  { id: 'Transport', label: 'Transport', icon: Truck },
  { id: 'Rent', label: 'Rent', icon: Home },
  { id: 'Other', label: 'Other', icon: PlusCircle },
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
        <button className={styles.backButton} onClick={() => router.replace('/cashflow')} aria-label="Back to cashflow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className={styles.title}>New Entry</h1>
        <div style={{ width: 40 }} />
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
            {categories.map((cat) => {
              const IconComponent = cat.icon
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.categoryChip} ${category === cat.id ? styles.categoryChipActive : ''}`}
                  onClick={() => setCategory(cat.id)}
                >
                  <span className={styles.categoryIcon} style={{ pointerEvents: 'none' }}>
                    <IconComponent size={20} />
                  </span>
                  <span className={styles.categoryLabel} style={{ pointerEvents: 'none' }}>
                    {cat.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Category Help Content */}
        <div className={styles.categoryHelpBox}>
          {category === 'Sales' && (
            <p><strong>Sales</strong>: Recording income from sales increases your Consistency &amp; Volume scores.</p>
          )}
          {category === 'Supplies' && (
            <p><strong>Supplies</strong>: Log purchases of stock, inventory, raw materials, or wholesale items.</p>
          )}
          {category === 'Transport' && (
            <p><strong>Transport</strong>: Log logistics, dispatch, fueling, or travel expenses for business.</p>
          )}
          {category === 'Rent' && (
            <p><strong>Rent</strong>: Track monthly shop rent, storage fees, or commercial operating space costs.</p>
          )}
          {category === 'Other' && (
            <p><strong>Other</strong>: Log miscellaneous transactions, bank charges, or custom expenses.</p>
          )}
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ pointerEvents: 'none' }}>
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
