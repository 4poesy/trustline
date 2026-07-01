'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { ArrowLeft, Copy, Check, Share2, Phone, ShieldCheck } from 'lucide-react'
import styles from './page.module.css'

export default function P2pReceivePage() {
  const { profile } = useAuth()
  const [copied, setCopied] = useState(false)

  const phoneIdentifier = profile?.phone_number || ''

  const handleCopy = () => {
    navigator.clipboard.writeText(phoneIdentifier)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Please send payment to my Trustline phone number: ${phoneIdentifier}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Back to dashboard">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Receive Money</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {/* Payment QR notice */}
        <section className={`card ${styles.receiveCard}`}>
          <div className={styles.avatarCircle}>
            <Phone size={32} />
          </div>
          
          <h2 className={styles.profileName}>{profile?.name}</h2>
          <p className={styles.subtitle}>YOUR TRUSTLINE PHONE IDENTIFIER</p>

          <div className={styles.phoneContainer}>
            <span className={styles.phoneNumber}>{phoneIdentifier}</span>
            <button className={styles.copyButton} onClick={handleCopy} aria-label="Copy phone number">
              {copied ? <Check size={18} className={styles.checkIcon} /> : <Copy size={18} />}
            </button>
          </div>

          <div className={styles.shieldNotice}>
            <ShieldCheck size={18} className={styles.shieldIcon} />
            <span>Payer must specify this exact phone number to initiate transfer.</span>
          </div>
        </section>

        {/* Share Section */}
        <section className={styles.actionSection}>
          <button onClick={handleShareWhatsApp} className={`btn btn-primary ${styles.shareBtn}`}>
            <Share2 size={18} />
            Share via WhatsApp
          </button>

          <Link href="/my-qr" className={`btn btn-secondary ${styles.qrBtn}`}>
            Show My QR Code
          </Link>
        </section>
      </main>
    </div>
  )
}
