'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, ShoppingBag, Calendar, CheckCircle, AlertCircle, Coins, Users } from 'lucide-react'
import styles from './page.module.css'

export default function GroupBuyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const purchaseId = params.id as string

  const { profile } = useAuth()

  const [purchase, setPurchase] = useState<any>(null)
  const [contributions, setContributions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [contribAmount, setContribAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchPurchaseDetails = async () => {
      if (!purchaseId) return
      try {
        // Fetch order
        const { data: ord, error: ordErr } = await supabase
          .from('group_purchases')
          .select('*')
          .eq('id', purchaseId)
          .single()

        if (ordErr || !ord) throw new Error('Order not found.')
        setPurchase(ord)

        // Fetch contributions
        const { data: contribs } = await supabase
          .from('group_purchase_contributions')
          .select(`
            id,
            amount,
            created_at,
            profiles:profile_id (name)
          `)
          .eq('group_purchase_id', purchaseId)
          .order('created_at', { ascending: false })

        setContributions(contribs || [])
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load details.')
      } finally {
        setLoading(false)
      }
    }
    fetchPurchaseDetails()
  }, [purchaseId])

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contribAmount || submitting || !profile?.id) return

    const amt = parseFloat(contribAmount)
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please specify a valid contribution amount.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      // 1. Insert contribution row
      const { error: contribErr } = await supabase
        .from('group_purchase_contributions')
        .insert({
          group_purchase_id: purchaseId,
          profile_id: profile.id,
          amount: amt
        })

      if (contribErr) throw contribErr

      // 2. Update group buy amount_contributed sum
      const newTotal = Number(purchase.amount_contributed || 0) + amt
      const targetMet = newTotal >= Number(purchase.target_amount)
      const newStatus = targetMet ? 'funded' : purchase.status

      const { error: updateErr } = await supabase
        .from('group_purchases')
        .update({
          amount_contributed: newTotal,
          status: newStatus
        })
        .eq('id', purchaseId)

      if (updateErr) throw updateErr

      // 3. Update local state
      setPurchase({ ...purchase, amount_contributed: newTotal, status: newStatus })
      setContributions([
        {
          id: Math.random().toString(),
          amount: amt,
          created_at: new Date().toISOString(),
          profiles: { name: profile.name }
        },
        ...contributions
      ])
      setContribAmount('')
      setToastMsg('Contribution added successfully!')
      setTimeout(() => setToastMsg(''), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit contribution.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading bulk order details...</p>
      </div>
    )
  }

  if (errorMsg && !purchase) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={40} style={{ color: 'var(--color-error)' }} />
        <h2>Order Not Found</h2>
        <Link href="/group-commerce" className="btn btn-secondary" style={{ marginTop: '12px' }}>
          Back to list
        </Link>
      </div>
    )
  }

  const percent = Math.min(100, Math.round((Number(purchase.amount_contributed || 0) / Number(purchase.target_amount)) * 100))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/group-commerce" className={styles.backButton} aria-label="Back to listing">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Order Details</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {toastMsg && (
          <div className={styles.toast}>
            <CheckCircle size={16} />
            <span>{toastMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Info Card */}
        <section className={`card ${styles.detailsCard}`}>
          <div className={styles.cardHeader}>
            <ShoppingBag size={24} className={styles.icon} />
            <span className={`${styles.statusBadge} ${purchase.status === 'open' ? styles.statusOpen : styles.statusFunded}`}>
              {purchase.status.toUpperCase()}
            </span>
          </div>

          <h2 className={styles.orderTitle}>{purchase.title}</h2>
          <p className={styles.orderDesc}>{purchase.description}</p>

          <div className={styles.metaRow}>
            <span>Supplier: <strong>{purchase.supplier_name || 'N/A'}</strong></span>
            <span className={styles.deadline}>
              <Calendar size={12} style={{ marginRight: '4px' }} />
              Deadline: {formatDate(purchase.deadline)}
            </span>
          </div>

          {/* Raising progress bar */}
          <div className={styles.progressSection}>
            <div className={styles.progressLabelRow}>
              <span>{percent}% Raised</span>
              <span>{profile?.currency || 'NGN'} {Number(purchase.amount_contributed || 0).toLocaleString()} / {Number(purchase.target_amount).toLocaleString()}</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${percent}%` }} />
            </div>
          </div>
        </section>

        {/* Contribute Form */}
        {purchase.status === 'open' && (
          <section className={`card ${styles.contribCard}`}>
            <h3>Contribute Funds</h3>
            <form onSubmit={handleContribute} className={styles.contribForm}>
              <div className="form-group">
                <label className="form-label">Contribution Amount ({profile?.currency || 'NGN'})</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 5000"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    required
                    disabled={submitting}
                  />
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '4px', alignItems: 'center' }} disabled={submitting}>
                    <Coins size={16} /> Contribute
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        {/* Contributors List */}
        <section className={styles.listSection}>
          <div className={styles.listHeader}>
            <Users size={18} />
            <h3>Order Contributors</h3>
          </div>

          {contributions.length === 0 ? (
            <div className={styles.emptyListCard}>
              <p>No contributions received yet. Be the first to fund this order!</p>
            </div>
          ) : (
            <div className={styles.contributionsList}>
              {contributions.map((c) => (
                <div key={c.id} className={`card ${styles.contribItem}`}>
                  <div>
                    <h4>{c.profiles?.name || 'Group Member'}</h4>
                    <p className={styles.contribDate}>{formatDate(c.created_at)}</p>
                  </div>
                  <span className={styles.contribAmount}>
                    {profile?.currency || 'NGN'} {Number(c.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
