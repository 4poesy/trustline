'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useBillPayments } from '@/modules/pay/hooks/useBillPayments'
import { ArrowLeft, CreditCard, Landmark, PhoneCall, Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react'
import styles from './page.module.css'

type FundingTab = 'bank_transfer' | 'card' | 'momo'

interface BankDetails {
  bankName: string
  accountName: string
  accountNumber: string
  currency: string
  currencySymbol: string
}

export default function FundWalletPage() {
  const { profile } = useAuth()
  const router = useRouter()
  
  const profileId = profile?.id
  const { walletBalance, currency, fundWallet, loading, processing } = useBillPayments(profileId)

  const [activeTab, setActiveTab] = useState<FundingTab>('bank_transfer')
  const [copied, setCopied] = useState(false)
  
  // Card Form State
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardAmount, setCardAmount] = useState('')
  
  // MoMo Form State
  const [momoOperator, setMomoOperator] = useState('')
  const [momoPhone, setMomoPhone] = useState('')
  const [momoAmount, setMomoAmount] = useState('')

  // Mock Bank Transfer Simulation State
  const [transferAmount, setTransferAmount] = useState('')
  const [transferSuccess, setTransferSuccess] = useState(false)
  const [txRef, setTxRef] = useState('')

  // Form error/success alerts
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)

  // Auto-detect bank details based on user location country
  const getMockBankDetails = (): BankDetails => {
    if (!profile?.location) {
      return {
        bankName: 'Providus Bank',
        accountName: `Trustline - ${profile?.name || 'User'}`,
        accountNumber: '1083948572',
        currency: 'NGN',
        currencySymbol: '₦'
      }
    }
    const loc = profile.location.toLowerCase()
    if (loc.includes('ghana')) {
      return {
        bankName: 'Fidelity Bank Ghana',
        accountName: `TL-GHS - ${profile.name}`,
        accountNumber: '4482039485',
        currency: 'GHS',
        currencySymbol: '₵'
      }
    }
    if (loc.includes('kenya')) {
      return {
        bankName: 'Equity Bank Kenya',
        accountName: `TL-KES - ${profile.name}`,
        accountNumber: '70293847562',
        currency: 'KES',
        currencySymbol: 'KSh'
      }
    }
    if (loc.includes('south africa')) {
      return {
        bankName: 'Standard Bank South Africa',
        accountName: `TL-ZAR - ${profile.name}`,
        accountNumber: '9083948201',
        currency: 'ZAR',
        currencySymbol: 'R'
      }
    }
    if (loc.includes('uganda')) {
      return {
        bankName: 'Stanbic Bank Uganda',
        accountName: `TL-UGX - ${profile.name}`,
        accountNumber: '8839201948',
        currency: 'UGX',
        currencySymbol: 'USh'
      }
    }
    return {
      bankName: 'Providus Bank',
      accountName: `Trustline - ${profile.name}`,
      accountNumber: '1083948572',
      currency: 'NGN',
      currencySymbol: '₦'
    }
  }

  const bankDetails = getMockBankDetails()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle Simulated Card Funding
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const amt = parseFloat(cardAmount)
    if (!amt || amt <= 0) {
      setFormError('Please enter a valid funding amount.')
      return
    }

    try {
      const res = await fundWallet(amt, 'card', {
        cardLast4: cardNumber.slice(-4) || '4242',
        desc: `Deposited via Card ending in ${cardNumber.slice(-4) || '4242'}`
      })

      if (res.success) {
        setTxRef(res.reference || '')
        setFormSuccess(true)
        setTimeout(() => {
          router.replace('/dashboard')
        }, 2200)
      } else {
        setFormError(res.error || 'Failed to authorize card transaction.')
      }
    } catch (err: any) {
      setFormError('Failed to process card payment.')
    }
  }

  // Handle Simulated MoMo Funding
  const handleMomoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const amt = parseFloat(momoAmount)
    if (!amt || amt <= 0) {
      setFormError('Please enter a valid funding amount.')
      return
    }
    if (!momoOperator) {
      setFormError('Please select a Mobile Money operator.')
      return
    }

    try {
      const res = await fundWallet(amt, 'card', {
        desc: `Deposited via Mobile Money (${momoOperator}) - Ref: ${momoPhone}`
      })

      if (res.success) {
        setTxRef(res.reference || '')
        setFormSuccess(true)
        setTimeout(() => {
          router.replace('/dashboard')
        }, 2200)
      } else {
        setFormError(res.error || 'Mobile Money push prompt timed out.')
      }
    } catch (err: any) {
      setFormError('Mobile Money funding failed.')
    }
  }

  // Simulate incoming Bank Transfer Deposit Webhook trigger
  const triggerMockBankTransfer = async () => {
    setFormError('')
    const amt = parseFloat(transferAmount)
    if (!amt || amt <= 0) {
      setFormError('Please enter a valid transfer amount.')
      return
    }

    try {
      const res = await fundWallet(amt, 'bank_transfer', {
        bankName: bankDetails.bankName,
        desc: `Simulated incoming bank transfer from Access Bank to providus account`
      })

      if (res.success) {
        setTxRef(res.reference || '')
        setTransferSuccess(true)
        setTransferAmount('')
        setTimeout(() => {
          setTransferSuccess(false)
          router.replace('/dashboard')
        }, 2500)
      } else {
        setFormError(res.error || 'Failed to simulate bank transfer deposit.')
      }
    } catch (err: any) {
      setFormError('Bank transfer simulation failed.')
    }
  }

  // Formatting Card Number: xxxx xxxx xxxx xxxx
  const formatCardNumInput = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 16)
    const matches = clean.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '))
    } else {
      setCardNumber(clean)
    }
  }

  // Formatting Expiry: MM/YY
  const formatExpiryInput = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 4)
    if (clean.length >= 2) {
      setCardExpiry(`${clean.substring(0, 2)}/${clean.substring(2)}`)
    } else {
      setCardExpiry(clean)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading funding services...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Back to dashboard">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Fund Wallet</h1>
          <div style={{ width: '40px' }} />
        </div>
      </header>

      <main className={styles.main}>
        {/* Tab Selection */}
        <section className={styles.tabRow}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'bank_transfer' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('bank_transfer')
              setFormError('')
              setFormSuccess(false)
            }}
          >
            <Landmark size={16} />
            <span>Bank Transfer</span>
          </button>
          
          <button
            className={`${styles.tabBtn} ${activeTab === 'card' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('card')
              setFormError('')
              setFormSuccess(false)
            }}
          >
            <CreditCard size={16} />
            <span>Card Checkout</span>
          </button>

          {['ghana', 'kenya', 'uganda', 'cameroon'].some(c => profile?.location?.toLowerCase().includes(c)) && (
            <button
              className={`${styles.tabBtn} ${activeTab === 'momo' ? styles.tabBtnActive : ''}`}
              onClick={() => {
                setActiveTab('momo')
                setFormError('')
                setFormSuccess(false)
              }}
            >
              <PhoneCall size={16} />
              <span>Mobile Money</span>
            </button>
          )}
        </section>

        {/* Tab 1: Bank Transfer details */}
        {activeTab === 'bank_transfer' && (
          <section className={styles.tabContentSection}>
            <div className={`card ${styles.accountCard}`}>
              <span className={styles.cardSubtitle}>YOUR PERMANENT DEPOSIT ACCOUNT</span>
              <h2 className={styles.bankName}>{bankDetails.bankName}</h2>
              
              <div className={styles.accountNoWrapper}>
                <span className={styles.accountNumber}>{bankDetails.accountNumber}</span>
                <button className={styles.copyBtn} onClick={copyToClipboard} aria-label="Copy Account Number">
                  {copied ? <Check size={18} className={styles.copiedIcon} /> : <Copy size={18} />}
                </button>
              </div>

              <div className={styles.accountDetailsGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Account Name</span>
                  <span className={styles.detailVal}>{bankDetails.accountName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Currency</span>
                  <span className={styles.detailVal}>{bankDetails.currency} ({bankDetails.currencySymbol})</span>
                </div>
              </div>

              <div className={styles.shieldNotice}>
                <ShieldCheck size={16} className={styles.shieldIcon} />
                <span>Funds transfered to this account credit your wallet instantly.</span>
              </div>
            </div>

            {/* Simulated webhook simulator */}
            <div className={`card ${styles.simulatorCard}`}>
              <h3 className={styles.simTitle}>Transfer Webhook Simulator</h3>
              <p className={styles.simDesc}>
                To test funding in this local build, specify an amount and click mock deposit. This simulates an incoming credit alert from your bank:
              </p>
              
              <div className={styles.simInputRow}>
                <div className={styles.currencyPrefix}>{bankDetails.currencySymbol}</div>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 5000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  disabled={processing || transferSuccess}
                />
              </div>

              <button
                className={`btn btn-primary ${styles.simBtn}`}
                onClick={triggerMockBankTransfer}
                disabled={processing || !transferAmount || transferSuccess}
              >
                {processing ? 'Processing Webhook...' : 'Send Mock Deposit'}
              </button>

              {transferSuccess && (
                <div className={styles.successBlock}>
                  <ShieldCheck size={24} className={styles.successBlockIcon} />
                  <div>
                    <h4>Deposit Credited Successfully!</h4>
                    <p>Reference: {txRef}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab 2: Pay with Card */}
        {activeTab === 'card' && (
          <section className={styles.tabContentSection}>
            <form onSubmit={handleCardSubmit} className={`card ${styles.formCard}`}>
              <h2 className={styles.formTitle}>Pay Securely with Card</h2>
              
              {formError && (
                <div className={styles.errorAlert} role="alert">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className={styles.successAlert} role="alert">
                  <ShieldCheck size={20} />
                  <div>
                    <h4>Card Payment Authorized</h4>
                    <p>Wallet funded! Redirecting to dashboard...</p>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Funding Amount ({bankDetails.currencySymbol})</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 10000"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
                  required
                  disabled={processing || formSuccess}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => formatCardNumInput(e.target.value)}
                  required
                  disabled={processing || formSuccess}
                />
              </div>

              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => formatExpiryInput(e.target.value)}
                    required
                    disabled={processing || formSuccess}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="123"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    required
                    disabled={processing || formSuccess}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cardholder Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Akinola Olujobi"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                  disabled={processing || formSuccess}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-large"
                style={{ marginTop: 'var(--space-2)' }}
                disabled={processing || formSuccess}
              >
                {processing ? 'Processing Securely...' : `Pay ${bankDetails.currencySymbol}${Number(cardAmount || 0).toLocaleString()}`}
              </button>
            </form>
          </section>
        )}

        {/* Tab 3: Mobile Money */}
        {activeTab === 'momo' && (
          <section className={styles.tabContentSection}>
            <form onSubmit={handleMomoSubmit} className={`card ${styles.formCard}`}>
              <h2 className={styles.formTitle}>Pay via Mobile Money</h2>

              {formError && (
                <div className={styles.errorAlert} role="alert">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className={styles.successAlert} role="alert">
                  <ShieldCheck size={20} />
                  <div>
                    <h4>Mobile Money Transfer Authorized</h4>
                    <p>Simulating wallet credit. Redirecting...</p>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Funding Amount ({bankDetails.currencySymbol})</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 2500"
                  value={momoAmount}
                  onChange={(e) => setMomoAmount(e.target.value)}
                  required
                  disabled={processing || formSuccess}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Operator</label>
                <select
                  className="form-input"
                  value={momoOperator}
                  onChange={(e) => setMomoOperator(e.target.value)}
                  required
                  disabled={processing || formSuccess}
                >
                  <option value="">-- Choose Operator --</option>
                  {profile?.location?.toLowerCase().includes('ghana') && (
                    <>
                      <option value="MTN Momo">MTN Mobile Money</option>
                      <option value="Telecel Cash">Telecel Cash</option>
                      <option value="AT Money">AT Money</option>
                    </>
                  )}
                  {profile?.location?.toLowerCase().includes('kenya') && (
                    <>
                      <option value="M-Pesa">Safaricom M-Pesa</option>
                      <option value="Airtel Money">Airtel Money</option>
                    </>
                  )}
                  {profile?.location?.toLowerCase().includes('uganda') && (
                    <>
                      <option value="MTN Momo Uganda">MTN Mobile Money</option>
                      <option value="Airtel Money Uganda">Airtel Money</option>
                    </>
                  )}
                  {profile?.location?.toLowerCase().includes('cameroon') && (
                    <>
                      <option value="MTN Momo Cameroon">MTN Mobile Money</option>
                      <option value="Orange Money">Orange Money</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Money Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 0541234567"
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  required
                  disabled={processing || formSuccess}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-large"
                style={{ marginTop: 'var(--space-2)' }}
                disabled={processing || formSuccess}
              >
                {processing ? 'Requesting Prompt...' : `Request MoMo Debit`}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}
