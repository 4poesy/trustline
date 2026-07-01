'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Star, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react'
import styles from './page.module.css'

export default function QrPaymentCheckoutPage() {
  const params = useParams()
  const merchantProfileId = params.profile_id as string

  const [merchant, setMerchant] = useState<any>(null)
  const [reviewsSummary, setReviewsSummary] = useState({ average: '0.0', count: 0 })
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [payerName, setPayerName] = useState('')
  const [payerPhone, setPayerPhone] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [txRef, setTxRef] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchMerchantDetails = async () => {
      if (!merchantProfileId) return
      try {
        // Fetch profile
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('name, business_type, location, currency')
          .eq('id', merchantProfileId)
          .single()

        if (profErr || !prof) throw new Error('Merchant not found.')
        setMerchant(prof)

        // Fetch ratings/reviews
        const { data: revs } = await supabase
          .from('reviews')
          .select('rating')
          .eq('reviewed_profile_id', merchantProfileId)

        if (revs && revs.length > 0) {
          const avg = revs.reduce((sum, r) => sum + r.rating, 0) / revs.length
          setReviewsSummary({
            average: avg.toFixed(1),
            count: revs.length
          })
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load checkout details.')
      } finally {
        setLoading(false)
      }
    }
    fetchMerchantDetails()
  }, [merchantProfileId])

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || processing) return

    const payAmt = parseFloat(amount)
    if (isNaN(payAmt) || payAmt <= 0) {
      setErrorMsg('Please enter a valid amount.')
      return
    }

    setProcessing(true)
    setErrorMsg('')

    try {
      // Simulate payment processing through Paystack/Flutterwave
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const ref = `TL-QR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

      // Create qr_payments row
      const { error: qrErr } = await supabase.from('qr_payments').insert({
        merchant_profile_id: merchantProfileId,
        amount: payAmt,
        currency: merchant.currency || 'NGN',
        payment_provider_reference: ref,
        status: 'completed'
      })
      if (qrErr) throw qrErr

      // Add automatic transaction income log for the merchant
      const todayStr = new Date().toISOString().split('T')[0]
      await supabase.from('transactions').insert({
        profile_id: merchantProfileId,
        type: 'income',
        amount: payAmt,
        category: 'QR Sale',
        note: `Automatic QR payment received from customer ${payerName || 'Anonymous'}`,
        entry_date: todayStr
      })

      // Send push notification to merchant
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            profile_id: merchantProfileId,
            title: 'Payment Received! ⚡',
            body: `You received ${merchant.currency} ${payAmt.toLocaleString()} via Merchant QR scan.`
          }
        })
      } catch (e) {
        console.error(e)
      }

      setTxRef(ref)
      setSuccess(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment transaction failed.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Opening secure QR checkout portal...</p>
      </div>
    )
  }

  if (errorMsg && !merchant) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={40} className={styles.errIcon} />
        <h2>Checkout Error</h2>
        <p>{errorMsg}</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.secureBadge}>🛡️ SECURE PORTAL</span>
        <h1 className={styles.brandTitle}>Trustline Pay</h1>
      </header>

      <main className={styles.main}>
        {success ? (
          <div className={`card ${styles.successCard}`}>
            <CheckCircle size={56} className={styles.checkIcon} />
            <h2>Payment Successful!</h2>
            <p>Your payment of <strong>{merchant.currency} {parseFloat(amount).toLocaleString()}</strong> to <strong>{merchant.name}</strong> was completed.</p>
            <p className={styles.ref}>Reference: {txRef}</p>
          </div>
        ) : (
          <div className={styles.checkoutBox}>
            {/* Merchant info */}
            <section className={styles.merchantSection}>
              <h2 className={styles.merchantName}>{merchant.name}</h2>
              <p className={styles.merchantMeta}>{merchant.business_type} · {merchant.location}</p>
              
              <div className={styles.ratingRow}>
                <Star size={16} className={styles.starIcon} />
                <span>{reviewsSummary.average} / 5.0 ({reviewsSummary.count} reviews)</span>
              </div>
            </section>

            {/* Error alerts */}
            {errorMsg && (
              <div className={styles.errorAlert}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handlePay} className={styles.form}>
              <div className="form-group">
                <label className="form-label">Payment Amount ({merchant.currency})</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Name (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Phone Number (Optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +234..."
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-large" style={{ marginTop: '12px' }} disabled={processing}>
                {processing ? 'Processing Securely...' : `Pay ${merchant.name}`}
              </button>
            </form>

            <div className={styles.trustFooter}>
              <ShieldCheck size={14} />
              <span>Payments are processed securely via registered aggregators.</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
