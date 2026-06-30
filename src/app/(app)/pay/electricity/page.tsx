'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useBillPayments } from '@/modules/pay/hooks/useBillPayments'
import { ArrowLeft, Zap, ShieldAlert, CheckCircle, Search, AlertCircle } from 'lucide-react'
import styles from '../payment-form.module.css'

const DISCOS = [
  { id: 'IKEDC', name: 'Ikeja Electric (IKEDC)' },
  { id: 'EKEDC', name: 'Eko Electric (EKEDC)' },
  { id: 'AEDC', name: 'Abuja Electric (AEDC)' },
  { id: 'IBEDC', name: 'Ibadan Electric (IBEDC)' }
]

export default function ElectricityPaymentPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { processPayment, processing, error: apiError } = useBillPayments(profile?.id)

  // Form States
  const [provider, setProvider] = useState('IKEDC')
  const [meterNumber, setMeterNumber] = useState('')
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
    if (!meterNumber.trim()) return 'Please enter a meter number.'
    if (meterNumber.trim().length < 8) return 'Meter number should be at least 8 digits.'
    if (!verifiedName) return 'Please verify the meter number before paying.'
    
    const parsedAmount = Number(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return 'Please enter a valid amount.'
    if (parsedAmount < 500) return 'Minimum electricity token purchase is ₦500.'
    if (parsedAmount > 100000) return 'Maximum electricity token purchase is ₦100,000.'

    return null
  }, [meterNumber, verifiedName, amount])

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

  // Handle meter verification
  const handleVerifyMeter = async () => {
    if (!meterNumber.trim() || meterNumber.trim().length < 8) {
      setVerificationError('Please enter a valid meter number to verify.')
      return
    }

    setVerifying(true)
    setVerificationError(null)
    setVerifiedName(null)

    // Simulate API delay for pre-check validation
    setTimeout(() => {
      setVerifying(false)
      if (meterNumber.endsWith('99')) {
        setVerificationError('Meter number not found. Please verify the number and provider.')
      } else {
        setVerifiedName('AKINOLA OLUJOBI (Prepaid - Single Phase)')
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
      type: 'electricity',
      recipient_number: meterNumber,
      network_or_provider: provider,
      amount: finalAmount
    })

    if (result.success) {
      setOutcome({
        status: 'successful',
        message: `Successfully purchased ₦${finalAmount.toLocaleString('en-NG')} Electricity prepaid token for Meter ${meterNumber}.`,
        ref: result.payment?.provider_reference || 'N/A'
      })
    } else {
      setOutcome({
        status: 'failed',
        message: result.error || 'The purchase transaction failed with the billing provider.'
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
          <h1 className={styles.title}>Electricity Bills</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      {/* ===== MAIN BODY ===== */}
      <main className={styles.main}>
        <form onSubmit={handlePayClick} className={styles.formCard}>
          
          {/* Provider Selector */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Select Biller / Provider</label>
            <select
              className={styles.input}
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value)
                setVerifiedName(null) // reset verification
              }}
            >
              {DISCOS.map((disco) => (
                <option key={disco.id} value={disco.id}>
                  {disco.name}
                </option>
              ))}
            </select>
          </div>

          {/* Meter Number */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Meter Number</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className={styles.input}
                placeholder="Enter prepaid meter number"
                value={meterNumber}
                onChange={(e) => {
                  setMeterNumber(e.target.value.replace(/\D/g, ''))
                  setVerifiedName(null) // reset verification when typing changes
                  setVerificationError(null)
                }}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleVerifyMeter}
                disabled={verifying || !meterNumber.trim()}
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
                <span><strong>Verified Owner:</strong> {verifiedName}</span>
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

          {/* Amount Selector */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Amount to Purchase</label>
            <div className={styles.customAmountContainer}>
              <span className={styles.currencyPrefix}>₦</span>
              <input
                type="number"
                className={`${styles.input} ${styles.inputWithPrefix}`}
                placeholder="Enter amount (500 - 100,000)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="500"
                max="100000"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={!!validationError}
          >
            <Zap size={20} />
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
                <span className={styles.confirmVal}>Electricity Token</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>Provider</span>
                <span className={styles.confirmVal}>{provider}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>Meter Number</span>
                <span className={styles.confirmVal}>{meterNumber}</span>
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
          <span className={styles.loaderText}>Processing bill purchase...</span>
          <span className={styles.loaderSubtext}>Sending command to prepaid operator. Do not close.</span>
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

            {outcome.status === 'successful' && (
              <div 
                style={{
                  backgroundColor: 'var(--color-warning-light)',
                  border: '1.5px dashed var(--color-warning)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  width: '100%',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-secondary-600)', textTransform: 'uppercase' }}>
                  Prepaid Token PIN
                </span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--color-neutral-900)', fontFamily: 'monospace' }}>
                  4038 - 9205 - 8812 - 4001
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-neutral-500)', marginTop: '4px' }}>
                  Enter this token pin on your meter keypad to load the electricity units.
                </span>
              </div>
            )}

            <div className={styles.feedbackDetails}>
              <div className={styles.feedbackDetailRow}>
                <span className={styles.feedbackDetailLabel}>Amount</span>
                <span className={styles.feedbackDetailVal}>₦{Number(amount).toLocaleString('en-NG')}</span>
              </div>
              <div className={styles.feedbackDetailRow}>
                <span className={styles.feedbackDetailLabel}>Meter Number</span>
                <span className={styles.feedbackDetailVal}>{meterNumber}</span>
              </div>
              <div className={styles.feedbackDetailRow}>
                <span className={styles.feedbackDetailLabel}>Biller</span>
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
