'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OtpInput } from '@/modules/auth/components/OtpInput'
import styles from './page.module.css'

export default function VerifyPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const storedPhone = sessionStorage.getItem('trustline_auth_phone')
    if (!storedPhone) {
      router.replace('/login')
      return
    }
    setPhone(storedPhone)
  }, [router])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true)
      return
    }

    const interval = setInterval(() => {
      setResendTimer((t) => t - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [resendTimer])

  const handleVerify = useCallback(async (otp: string) => {
    if (!phone) return
    setError('')
    setLoading(true)

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      })

      if (verifyError) {
        setError(verifyError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        sessionStorage.removeItem('trustline_auth_phone')

        if (profile) {
          router.replace('/dashboard')
        } else {
          router.replace('/setup-profile')
        }
      }
    } catch {
      setError('Verification failed. Please try again.')
      setLoading(false)
    }
  }, [phone, supabase, router])

  const handleResend = async () => {
    if (!canResend || !phone) return
    setCanResend(false)
    setResendTimer(30)
    setError('')

    const { error: resendError } = await supabase.auth.signInWithOtp({ phone })
    if (resendError) {
      setError(resendError.message)
    }
  }

  // Format phone for display
  const displayPhone = phone ? `${phone.slice(0, 4)} •••• ${phone.slice(-4)}` : ''

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button
          className={styles.backButton}
          onClick={() => router.back()}
          aria-label="Go back"
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className={styles.header}>
          <div className={styles.iconCircle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M12 12h.01" />
              <path d="M17 12h.01" />
              <path d="M7 12h.01" />
            </svg>
          </div>
          <h1 className={styles.title}>Enter verification code</h1>
          <p className={styles.subtitle}>
            We sent a 6-digit code to <strong>{displayPhone}</strong>
          </p>
        </div>

        <div className={styles.otpContainer}>
          <OtpInput onComplete={handleVerify} disabled={loading} />
        </div>

        {error && <p className={`form-error ${styles.error}`} role="alert">{error}</p>}

        {loading && (
          <div className={styles.verifying}>
            <span className="spinner" />
            <span>Verifying...</span>
          </div>
        )}

        <div className={styles.resendSection}>
          {canResend ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleResend}
              id="resend-code-button"
            >
              Resend code
            </button>
          ) : (
            <p className={styles.resendTimer}>
              Resend code in <strong>{resendTimer}s</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
