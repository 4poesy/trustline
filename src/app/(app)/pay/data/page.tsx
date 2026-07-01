'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useBillPayments } from '@/modules/pay/hooks/useBillPayments'
import { ArrowLeft, Wifi, ShieldAlert, CheckCircle } from 'lucide-react'
import styles from '../payment-form.module.css'

const NETWORKS = [
  { id: 'MTN', name: 'MTN', logo: 'MTN' },
  { id: 'Airtel', name: 'Airtel', logo: 'Airtel' },
  { id: 'Glo', name: 'Glo', logo: 'Glo' },
  { id: '9mobile', name: '9mobile', logo: '9mobile' }
]

const DATA_PLANS = [
  { amount: 150, label: '150 (300MB)' },
  { amount: 350, label: '350 (1.5GB)' },
  { amount: 600, label: '600 (3GB)' },
  { amount: 1200, label: '1,200 (7GB)' },
  { amount: 1500, label: '1,500 (10GB)' },
  { amount: 3000, label: '3,000 (22GB)' }
]

export default function DataPaymentPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { processPayment, processing, walletBalance, currency, error: apiError } = useBillPayments(profile?.id)

  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card' | 'bank_transfer'>('wallet')

  const getCurrencySymbol = (cur: string) => {
    if (cur === 'GHS') return '₵'
    if (cur === 'KES') return 'KSh'
    if (cur === 'ZAR') return 'R'
    if (cur === 'UGX') return 'USh'
    if (cur === 'TZS') return 'TSh'
    if (cur === 'XAF') return 'FCFA'
    return '₦'
  }

  // Form States
  const [provider, setProvider] = useState('MTN')
  const [recipientType, setRecipientType] = useState<'self' | 'others'>('self')
  const [customRecipient, setCustomRecipient] = useState('')
  const [amountSelection, setAmountSelection] = useState<number | 'custom'>(350)
  const [customAmount, setCustomAmount] = useState('')

  // Overlay states
  const [showConfirm, setShowConfirm] = useState(false)
  const [outcome, setOutcome] = useState<null | {
    status: 'successful' | 'failed'
    message: string
    ref?: string
  }>(null)

  // Get recipient phone number based on toggle
  const recipientNumber = useMemo(() => {
    if (recipientType === 'self') {
      return profile?.phone_number || ''
    }
    return customRecipient.trim()
  }, [recipientType, profile, customRecipient])

  // Get final amount
  const finalAmount = useMemo(() => {
    if (amountSelection === 'custom') {
      return Number(customAmount) || 0
    }
    return amountSelection
  }, [amountSelection, customAmount])

  // Validation
  const validationError = useMemo(() => {
    // 1. Recipient check
    if (!recipientNumber) return 'Please enter a phone number.'
    
    const cleanNum = recipientNumber.replace(/\D/g, '')
    if (cleanNum.length !== 11 && !recipientNumber.startsWith('+')) {
      return 'Please enter a valid 11-digit phone number.'
    }

    // 2. Amount check
    if (finalAmount <= 0) return 'Please select a data bundle.'
    if (finalAmount < 100) return 'Minimum data purchase is ₦100.'
    if (finalAmount > 20000) return 'Maximum data purchase is ₦20,000.'

    return null
  }, [recipientNumber, finalAmount])

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

  // Handle Pay submit
  const handlePayClick = (e: React.FormEvent) => {
    e.preventDefault()
    if (validationError) return
    setShowConfirm(true)
  }

  // Finalize payment invocation
  const handleConfirmPay = async () => {
    setShowConfirm(false)
    
    const result = await processPayment({
      type: 'data',
      recipient_number: recipientNumber,
      network_or_provider: provider,
      amount: finalAmount,
      payment_method: paymentMethod
    })

    const symbol = getCurrencySymbol(currency)

    if (result.success) {
      setOutcome({
        status: 'successful',
        message: `Successfully purchased ${symbol}${finalAmount.toLocaleString('en-US')} ${provider} Data for ${recipientNumber}.`,
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
          <h1 className={styles.title}>Internet Data</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      {/* ===== MAIN BODY ===== */}
      <main className={styles.main}>
        <form onSubmit={handlePayClick} className={styles.formCard}>
          
          {/* Network Provider Selector */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Select Network</label>
            <div className={styles.providerGrid}>
              {NETWORKS.map((net) => (
                <button
                  key={net.id}
                  type="button"
                  className={`${styles.providerButton} ${provider === net.id ? styles.providerButtonActive : ''}`}
                  onClick={() => setProvider(net.id)}
                >
                  <span className={styles.providerLogoText}>{net.logo}</span>
                  <span>{net.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Selector */}
          <div className={styles.formGroup}>
            <div className={styles.recipientToggleRow}>
              <label className={styles.label}>Recipient Phone Number</label>
              <div 
                className={styles.switchContainer}
                onClick={() => setRecipientType(recipientType === 'self' ? 'others' : 'self')}
              >
                <input 
                  type="checkbox" 
                  checked={recipientType === 'others'} 
                  readOnly 
                  style={{ cursor: 'pointer' }}
                />
                <span className={styles.switchLabel}>Pay for someone else</span>
              </div>
            </div>

            {recipientType === 'self' ? (
              <input
                type="text"
                className={styles.input}
                value={profile.phone_number}
                disabled
              />
            ) : (
              <input
                type="tel"
                className={styles.input}
                placeholder="Enter recipient's 11-digit phone number"
                value={customRecipient}
                onChange={(e) => setCustomRecipient(e.target.value.replace(/\s+/g, ''))}
                autoFocus
              />
            )}
          </div>

          {/* Data Plan / Amount Selector */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Select Data Plan</label>
            <div className={styles.amountGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {DATA_PLANS.map((plan) => (
                <button
                  key={plan.amount}
                  type="button"
                  className={`${styles.amountButton} ${amountSelection === plan.amount ? styles.amountButtonActive : ''}`}
                  onClick={() => {
                    setAmountSelection(plan.amount)
                    setCustomAmount('')
                  }}
                  style={{ fontSize: '11px', padding: '12px 4px' }}
                >
                  ₦{plan.label}
                </button>
              ))}
              <button
                type="button"
                className={`${styles.amountButton} ${amountSelection === 'custom' ? styles.amountButtonActive : ''}`}
                onClick={() => setAmountSelection('custom')}
                style={{ fontSize: '11px', padding: '12px 4px' }}
              >
                Custom Plan
              </button>
            </div>

            {amountSelection === 'custom' && (
              <div className={styles.customAmountContainer} style={{ marginTop: '12px' }}>
                <span className={styles.currencyPrefix}>₦</span>
                <input
                  type="number"
                  className={`${styles.input} ${styles.inputWithPrefix}`}
                  placeholder="Enter amount (100 - 20,000)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min="100"
                  max="20000"
                />
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={!!validationError}
          >
            <Wifi size={20} />
            Pay ₦{finalAmount.toLocaleString('en-NG')}
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
                <span className={styles.confirmVal}>Internet Data</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>Network Operator</span>
                <span className={styles.confirmVal}>{provider}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>Recipient Number</span>
                <span className={styles.confirmVal}>{recipientNumber}</span>
              </div>
              <div className={styles.confirmRow} style={{ borderTop: '1px solid var(--color-neutral-200)', paddingTop: '12px', marginTop: '4px' }}>
                <span className={styles.confirmLabel} style={{ fontWeight: 'bold' }}>Total Amount</span>
                <span className={`${styles.confirmVal} ${styles.confirmAmount}`}>
                  {getCurrencySymbol(currency)}{finalAmount.toLocaleString('en-US')}
                </span>
              </div>

              {/* Checkout Payment Method Picker */}
              <div className={styles.paymentMethodSelectBlock}>
                <span className={styles.confirmLabel} style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '12px', color: 'var(--color-neutral-700)' }}>Choose Payment Method</span>
                
                <div className={styles.paymentMethodGrid}>
                  {/* Wallet Option */}
                  <label className={`${styles.paymentMethodLabel} ${paymentMethod === 'wallet' ? styles.paymentMethodActive : ''} ${walletBalance < finalAmount ? styles.paymentMethodDisabled : ''}`}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="wallet" 
                      checked={paymentMethod === 'wallet'}
                      onChange={() => setPaymentMethod('wallet')}
                      disabled={walletBalance < finalAmount}
                      className={styles.hiddenRadio}
                    />
                    <div className={styles.paymentMethodInfo}>
                      <span className={styles.methodName}>Wallet Balance</span>
                      <span className={styles.methodSubtitle}>
                        {walletBalance >= finalAmount ? `Balance: ${getCurrencySymbol(currency)}${walletBalance.toLocaleString('en-US')}` : 'Insufficient balance'}
                      </span>
                    </div>
                  </label>

                  {/* Card Option */}
                  <label className={`${styles.paymentMethodLabel} ${paymentMethod === 'card' ? styles.paymentMethodActive : ''}`}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="card" 
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className={styles.hiddenRadio}
                    />
                    <div className={styles.paymentMethodInfo}>
                      <span className={styles.methodName}>Pay with Card</span>
                      <span className={styles.methodSubtitle}>Debit Card (Visa/Mastercard)</span>
                    </div>
                  </label>

                  {/* Bank Transfer Option */}
                  <label className={`${styles.paymentMethodLabel} ${paymentMethod === 'bank_transfer' ? styles.paymentMethodActive : ''}`}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="bank_transfer" 
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className={styles.hiddenRadio}
                    />
                    <div className={styles.paymentMethodInfo}>
                      <span className={styles.methodName}>Bank Transfer</span>
                      <span className={styles.methodSubtitle}>Direct deposit checkout</span>
                    </div>
                  </label>
                </div>
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
          <span className={styles.loaderText}>Processing your data purchase...</span>
          <span className={styles.loaderSubtext}>Please do not close this screen or press back.</span>
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
                {outcome.status === 'successful' ? 'Purchase Successful' : 'Purchase Failed'}
              </h3>
              <p className={styles.feedbackMessage}>{outcome.message}</p>
            </div>

            <div className={styles.feedbackDetails}>
              <div className={styles.feedbackDetailRow}>
                <span className={styles.feedbackDetailLabel}>Amount</span>
                <span className={styles.feedbackDetailVal}>{getCurrencySymbol(currency)}{finalAmount.toLocaleString('en-US')}</span>
              </div>
              <div className={styles.feedbackDetailRow}>
                <span className={styles.feedbackDetailLabel}>Recipient</span>
                <span className={styles.feedbackDetailVal}>{recipientNumber}</span>
              </div>
              <div className={styles.feedbackDetailRow}>
                <span className={styles.feedbackDetailLabel}>Operator</span>
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
