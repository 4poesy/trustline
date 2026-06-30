'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useBillPayments } from '@/modules/pay/hooks/useBillPayments'
import { ArrowLeft, Tv, ShieldAlert, CheckCircle, Search, AlertCircle } from 'lucide-react'
import styles from '../payment-form.module.css'

const TV_PROVIDERS = [
  { id: 'DSTV', name: 'DSTV' },
  { id: 'GOTV', name: 'GOtv' },
  { id: 'Startimes', name: 'StarTimes' }
]

export default function TvPaymentPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { processPayment, processing, error: apiError } = useBillPayments(profile?.id)

  // Form States
  const [provider, setProvider] = useState('DSTV')
  const [smartCardNumber, setSmartCardNumber] = useState('')
  const [amount, setAmount] = useState('')
  
  // Verification states
  const [verifying, setVerifying] = useState(false)
  const [verifiedName, setVerifiedName] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  // Overlay states
  const [showConfirm, setShowConfirm] = useState(false)
  const [outcome, setOutcome] = useState<null | {
    status: 'successful' | 'failed'
    message: string
    ref?: string
  }>(null)

  // Validate inputs
  const validationError = useMemo(() => {
    if (!smartCardNumber.trim()) return 'Please enter a smart card number.'
    if (smartCardNumber.trim().length < 8) return 'Smart card number should be at least 8 digits.'
    if (!verifiedName) return 'Please verify the smart card number before paying.'
    
    const parsedAmount = Number(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return 'Please enter a valid amount.'
    if (parsedAmount < 1000) return 'Minimum TV subscription payment is ₦1,000.'
    if (parsedAmount > 50000) return 'Maximum TV subscription payment is ₦50,000.'

    return null
  }, [smartCardNumber, verifiedName, amount])

  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading details...</p>
      </div>
    )
  }

  if (!profile) {
    router.replace('/login')
    return null
  }

  // Handle smart card verification
  const handleVerifySmartCard = async () => {
    if (!smartCardNumber.trim() || smartCardNumber.trim().length < 8) {
      setVerificationError('Please enter a valid smart card number to verify.')
      return
    }

    setVerifying(true)
    setVerificationError(null)
    setVerifiedName(null)

    // Simulate API delay for pre-check validation
    setTimeout(() => {
      setVerifying(false)
      if (smartCardNumber.endsWith('99')) {
        setVerificationError('Smart card number not found. Please verify the number and provider.')
      } else {
        setVerifiedName(`AKINOLA OLUJOBI (${provider} Compact Bundle)`)
      }
    }, 1200)
  }

  // Handle Pay submit
  const handlePayClick = (e: React.FormEvent) => {
    e.preventDefault()
    if (validationError) return
    setShowConfirm(true)
  }

  // Finalize payment invocation
  const handleConfirmPay = async () => {
    setShowConfirm(false)
    const finalAmount = Number(amount)
    
    const result = await processPayment({
      type: 'tv_subscription',
      recipient_number: smartCardNumber,
      network_or_provider: provider,
      amount: finalAmount
    })

    if (result.success) {
      setOutcome({
        status: 'successful',
        message: `Successfully paid ₦${finalAmount.toLocaleString('en-NG')} TV Subscription for Card ${smartCardNumber}.`,
        ref: result.payment?.provider_reference || 'N/A'
      })
    } else {
      setOutcome({
        status: 'failed',
        message: result.error || 'The subscription payment failed with the provider.'
      })
    }
  }

  return (
    <div className={styles.page}>
      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button 
            className={styles.backButton} 
            onClick={() => router.replace('/pay')} 
            aria-label="Back to payment hub"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className={styles.title}>Cable TV</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      {/* ===== MAIN BODY ===== */}
      <main className={styles.main}>
        <form onSubmit={handlePayClick} className={styles.formCard}>
          
          {/* Provider Selector */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Select TV Operator</label>
            <select
              className={styles.input}
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value)
                setVerifiedName(null) // reset verification
              }}
            >
              {TV_PROVIDERS.map((tv) => (
                <option key={tv.id} value={tv.id}>
                  {tv.name}
                </option>
              ))}
            </select>
          </div>

          {/* Smart Card Number */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Smart Card / Account Number</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className={styles.input}
                placeholder="Enter smart card or UID number"
                value={smartCardNumber}
                onChange={(e) => {
                  setSmartCardNumber(e.target.value.replace(/\D/g, ''))
                  setVerifiedName(null) // reset verification when typing changes
                  setVerificationError(null)
                }}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleVerifySmartCard}
                disabled={verifying || !smartCardNumber.trim()}
                style={{
                  marginTop: 0,
                  minHeight: 48,
                  width: 'auto',
                  padding: '0 20px',
                  boxShadow: 'none',
                  fontSize: '14px'
                }}
              >
                {verifying ? (
                  <span className="spinner spinner-white" />
                ) : (
                  <>
                    <Search size={16} />
                    Verify
                  </>
                )}
              </button>
            </div>

            {/* Verification Results Panel */}
            {verifiedName && (
              <div 
                style={{
                  backgroundColor: 'var(--color-primary-50)',
                  border: '1px solid var(--color-primary-300)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--color-primary-700)',
                  fontSize: '13px'
                }}
              >
                <CheckCircle size={16} style={{ color: 'var(--color-primary-500)', flexShrink: 0 }} />
                <span><strong>Verified Account:</strong> {verifiedName}</span>
              </div>
            )}

            {verificationError && (
              <div 
                style={{
                  backgroundColor: 'var(--color-error-light)',
                  border: '1px solid var(--color-error)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--color-error)',
                  fontSize: '13px'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{verificationError}</span>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Subscription Amount</label>
            <div className={styles.customAmountContainer}>
              <span className={styles.currencyPrefix}>₦</span>
              <input
                type="number"
                className={`${styles.input} ${styles.inputWithPrefix}`}
                placeholder="Enter subscription price (1,000 - 50,000)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1000"
                max="50000"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={!!validationError}
          >
            <Tv size={20} />
            Pay ₦{Number(amount || 0).toLocaleString('en-NG')}
          </button>
        </form>
      </main>

      {/* ===== 1. CONFIRMATION SHEET OVERLAY ===== */}
      {showConfirm && (
        <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.sheetTitle}>Confirm Transaction</h3>
            <div className={styles.confirmGrid}>
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>Payment Type</span>
                <span className={styles.confirmVal}>Cable TV Subscription</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>Operator</span>
                <span className={styles.confirmVal}>{provider}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>Card / Account</span>
                <span className={styles.confirmVal}>{smartCardNumber}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>Verified Owner</span>
                <span className={styles.confirmVal} style={{ fontSize: '12px' }}>{verifiedName}</span>
              </div>
              <div className={styles.confirmRow} style={{ borderTop: '1px solid var(--color-neutral-200)', paddingTop: '12px', marginTop: '4px' }}>
                <span className={styles.confirmLabel} style={{ fontWeight: 'bold' }}>Total Amount</span>
                <span className={`${styles.confirmVal} ${styles.confirmAmount}`}>
                  ₦{Number(amount).toLocaleString('en-NG')}
                </span>
              </div>
            </div>
            <div className={styles.sheetActions}>
              <button className={styles.cancelBtn} onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className={styles.confirmBtn} onClick={handleConfirmPay}>
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 2. PROCESSING LOADING OVERLAY ===== */}
      {processing && (
        <div className={styles.loaderOverlay}>
          <span className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
          <span className={styles.loaderText}>Processing your TV subscription...</span>
          <span className={styles.loaderSubtext}>Contacting billing network. Do not close this screen.</span>
        </div>
      )}

      {/* ===== 3. SUCCESS / FAILURE PANEL OVERLAY ===== */}
      {outcome && (
        <div className={styles.feedbackOverlay}>
          <div className={styles.feedbackCard}>
            <div className={`${styles.feedbackIconCircle} ${outcome.status === 'successful' ? styles.successIconCircle : styles.errorIconCircle}`}>
              {outcome.status === 'successful' ? (
                <CheckCircle size={44} />
              ) : (
                <ShieldAlert size={44} />
              )}
            </div>
            
            <div className={styles.feedbackHeader}>
              <h3 className={styles.feedbackTitle}>
                {outcome.status === 'successful' ? 'Payment Successful' : 'Payment Failed'}
              </h3>
              <p className={styles.feedbackMessage}>{outcome.message}</p>
            </div>

            <div className={styles.feedbackDetails}>
              <div className={styles.feedbackDetailRow}>
                <span className={styles.feedbackDetailLabel}>Amount</span>
                <span className={styles.feedbackDetailVal}>₦{Number(amount).toLocaleString('en-NG')}</span>
              </div>
              <div className={styles.feedbackDetailRow}>
                <span className={styles.feedbackDetailLabel}>Smart Card</span>
                <span className={styles.feedbackDetailVal}>{smartCardNumber}</span>
              </div>
              <div className={styles.feedbackDetailRow}>
                <span className={styles.feedbackDetailLabel}>TV Provider</span>
                <span className={styles.feedbackDetailVal}>{provider}</span>
              </div>
              {outcome.ref && (
                <div className={styles.feedbackDetailRow}>
                  <span className={styles.feedbackDetailLabel}>Reference ID</span>
                  <span className={`${styles.feedbackDetailVal} ${styles.feedbackRef}`}>{outcome.ref}</span>
                </div>
              )}
            </div>

            <button 
              className={styles.feedbackActionBtn}
              onClick={() => {
                if (outcome.status === 'successful') {
                  router.replace('/pay')
                } else {
                  setOutcome(null) // allow retry
                }
              }}
            >
              {outcome.status === 'successful' ? 'Done' : 'Try Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
