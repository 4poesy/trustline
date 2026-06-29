'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useSavings } from '@/modules/savings/hooks/useSavings'
import styles from './page.module.css'

export default function CreateSavingsGroupPage() {
  const { profile, loading: authLoading } = useAuth()
  const { createGroup } = useSavings(profile?.id)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('weekly')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !amount.trim()) return

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid contribution amount')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await createGroup(name.trim(), parsedAmount, frequency)
      router.replace('/savings')
    } catch (err: any) {
      setError(err.message || 'Failed to create group')
      setIsSubmitting(false)
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

  if (!profile) return null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.replace('/savings')} aria-label="Cancel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h1 className={styles.title}>New Savings Group</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSubmit} className={`card ${styles.form}`}>
          <div className="form-group">
            <label htmlFor="group-name" className="form-label">Group Name</label>
            <input
              id="group-name"
              type="text"
              className="form-input"
              placeholder="e.g. Ajo Harmony Traders"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contribution-amount" className="form-label">Contribution Amount (₦)</label>
            <input
              id="contribution-amount"
              type="number"
              inputMode="numeric"
              className="form-input"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payout Frequency</label>
            <div className={styles.frequencyGrid}>
              <button
                type="button"
                className={`${styles.freqBtn} ${frequency === 'weekly' ? styles.freqBtnActive : ''}`}
                onClick={() => setFrequency('weekly')}
              >
                Weekly
              </button>
              <button
                type="button"
                className={`${styles.freqBtn} ${frequency === 'monthly' ? styles.freqBtnActive : ''}`}
                onClick={() => setFrequency('monthly')}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className={styles.infoBox}>
            <p className={styles.infoText}>
              ℹ️ <strong>Payout Order note:</strong> By default, members will receive the payout in the order they join the group. You can coordinate with members to align on who joins first.
            </p>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={isSubmitting || !name.trim() || !amount.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </main>
    </div>
  )
}
