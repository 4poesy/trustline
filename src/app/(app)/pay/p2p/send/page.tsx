'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useBillPayments } from '@/modules/pay/hooks/useBillPayments'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, User, Search, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react'
import styles from './page.module.css'

export default function P2pSendPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const profileId = profile?.id
  const { walletBalance, currency } = useBillPayments(profileId)

  // Search recipient state
  const [recipientPhone, setRecipientPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [recipientProfile, setRecipientProfile] = useState<any>(null)
  
  // Transfer form state
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [processing, setProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [txRef, setTxRef] = useState('')

  const handleSearchRecipient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipientPhone.trim()) return

    setSearching(true)
    setErrorMsg('')
    setRecipientProfile(null)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, location, business_type')
        .eq('phone_number', recipientPhone.trim())
        .single()

      if (error || !data) {
        throw new Error('No user registered with this phone number.')
      }

      if (data.id === profileId) {
        throw new Error('You cannot transfer funds to your own account.')
      }

      setRecipientProfile(data)
    } catch (err: any) {
      setErrorMsg(err.message || 'Recipient not found.')
    } finally {
      setSearching(false)
    }
  }

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipientProfile || !amount || processing) return

    const transferAmt = parseFloat(amount)
    if (isNaN(transferAmt) || transferAmt <= 0) {
      setErrorMsg('Please enter a valid amount.')
      return
    }

    if (transferAmt > walletBalance) {
      setErrorMsg('Insufficient wallet balance.')
      return
    }

    setProcessing(true)
    setErrorMsg('')

    try {
      const response = await supabase.functions.invoke('process-p2p-transfer', {
        body: {
          sender_profile_id: profileId,
          recipient_phone: recipientPhone.trim(),
          amount: transferAmt,
          note: note.trim()
        }
      })

      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data?.success) {
        setTxRef(response.data.reference)
        setSuccessMsg(`Sent successfully to ${recipientProfile.name}!`)
        setAmount('')
        setNote('')
        setTimeout(() => {
          router.replace('/dashboard')
        }, 2500)
      } else {
        setErrorMsg(response.data?.error || 'Transfer failed.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Transfer failed to authorize.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Back to dashboard">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Send Money</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {/* Wallet Balance Card */}
        <section className={`card ${styles.balanceCard}`}>
          <span className={styles.balanceLabel}>YOUR CURRENT BALANCE</span>
          <h2 className={styles.balanceVal}>
            {currency} {walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h2>
        </section>

        {errorMsg && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className={styles.successAlert} role="alert">
            <ShieldCheck size={20} />
            <div>
              <h3>Transfer Completed</h3>
              <p>{successMsg}</p>
              <p className={styles.refText}>Ref: {txRef}</p>
            </div>
          </div>
        )}

        {/* Step 1: Search Recipient */}
        {!recipientProfile && !successMsg && (
          <form onSubmit={handleSearchRecipient} className={`card ${styles.formCard}`}>
            <h3 className={styles.formTitle}>Find Recipient</h3>
            <p className={styles.formDesc}>Search by phone number (include country code e.g. +234...)</p>
            
            <div className={styles.searchRow}>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. +2348012345678"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                required
              />
              <button type="submit" className={styles.searchBtn} disabled={searching} aria-label="Search">
                <Search size={18} />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Confirm & Send Form */}
        {recipientProfile && !successMsg && (
          <form onSubmit={handleExecuteTransfer} className={`card ${styles.formCard}`}>
            <div className={styles.recipientHeader}>
              <div className={styles.avatar}>
                <User size={20} />
              </div>
              <div>
                <h4>{recipientProfile.name}</h4>
                <p>{recipientProfile.business_type} · {recipientProfile.location}</p>
              </div>
              <button type="button" className={styles.changeBtn} onClick={() => setRecipientProfile(null)}>
                Change
              </button>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Transfer Amount ({currency})</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={processing}
              />
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Add a Note (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Payment for supplies"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={processing}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-large" style={{ marginTop: '20px' }} disabled={processing}>
              {processing ? 'Processing Transfer...' : 'Confirm & Send'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
