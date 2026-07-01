'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { ArrowLeft, Download, Share2, Printer, QrCode } from 'lucide-react'
import styles from './page.module.css'

export default function MyQrPage() {
  const { profile } = useAuth()
  
  const profileId = profile?.id || ''
  const paymentUrl = `https://trustline365.vercel.app/pay/qr/${profileId}`
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=0D7C66&data=${encodeURIComponent(paymentUrl)}`

  const handleShare = () => {
    const text = encodeURIComponent(`Scan my QR Code to pay me on Trustline: ${paymentUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Back to dashboard">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Merchant QR Code</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        <section className={`card ${styles.qrCard}`}>
          <div className={styles.merchantHeader}>
            <QrCode size={24} className={styles.qrIcon} />
            <div>
              <h3>{profile?.name}</h3>
              <p>{profile?.business_type || 'Trader'} · {profile?.location || 'Lagos'}</p>
            </div>
          </div>

          <div className={styles.qrWrapper}>
            {/* Using free api.qrserver.com to generate QR code */}
            <img 
              src={qrCodeImageUrl}
              alt="Payment QR Code" 
              className={styles.qrImage}
            />
          </div>

          <p className={styles.qrLabel}>SCAN TO PAY WITH TRUSTLINE</p>
        </section>

        <section className={styles.actionSection}>
          <button onClick={handleShare} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Share2 size={16} />
            Share QR Link
          </button>
          
          <Link href="/my-qr/print" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Printer size={16} />
            Print QR Poster
          </Link>
        </section>
      </main>
    </div>
  )
}
