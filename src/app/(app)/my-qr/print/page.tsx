'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import styles from './page.module.css'

export default function PrintQrPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const profileId = profile?.id || ''
  const paymentUrl = `https://trustline365.vercel.app/pay/qr/${profileId}`
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=0D7C66&data=${encodeURIComponent(paymentUrl)}`

  // Automatically trigger system print dialog when printable route loads
  useEffect(() => {
    if (profileId) {
      const timer = setTimeout(() => {
        window.print()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [profileId])

  return (
    <div className={styles.container}>
      <div className={styles.noPrintActions}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          ← Go Back
        </button>
        <button onClick={() => window.print()} className={styles.printBtn}>
          Print Poster
        </button>
      </div>

      <div className={styles.poster}>
        <div className={styles.header}>
          <img src="/icons/icon-192x192.png" alt="Trustline Logo" className={styles.logo} />
          <h1 className={styles.brandName}>TRUSTLINE</h1>
        </div>

        <div className={styles.merchantSection}>
          <h2 className={styles.name}>{profile?.name || 'Loading Merchant...'}</h2>
          <p className={styles.subtext}>{profile?.business_type || 'Retail Trader'} · {profile?.location || 'Lagos'}</p>
        </div>

        <div className={styles.qrContainer}>
          <img src={qrCodeImageUrl} alt="Merchant QR code" className={styles.qrCode} />
        </div>

        <div className={styles.footer}>
          <h3>PAY ME SECURELY VIA TRUSTLINE QR</h3>
          <p>Scan with any mobile camera. Instant bank transfer or card payment.</p>
        </div>
      </div>
    </div>
  )
}
