'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendOTP } from '@/lib/supabase/auth'
import { CountryCodeSelect } from '@/modules/auth/components/CountryCodeSelect'
import styles from './page.module.css'

export default function LoginPage() {
  const [countryCode, setCountryCode] = useState('+234')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleaned = phoneNumber.replace(/\D/g, '').replace(/^0+/, '')
    if (cleaned.length < 7 || cleaned.length > 12) {
      setError('Please enter a valid phone number')
      return
    }

    setLoading(true)
    try {
      const { error: otpError } = await sendOTP(`${countryCode}${cleaned}`)

      if (otpError) {
        setError(otpError.message)
        setLoading(false)
        return
      }

      // Store phone for the verify page
      sessionStorage.setItem('trustline_auth_phone', `${countryCode}${cleaned}`)
      router.push('/verify')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.logoIcon}>
              <rect width="40" height="40" rx="10" fill="#0D7C66" />
              <path d="M12 28L16 14L20 22L24 16L28 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="28" cy="24" r="2" fill="#D4A24E" />
            </svg>
            <span className={styles.logoText}>Trustline</span>
          </div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Enter your phone number to continue</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.phoneRow}>
            <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
            <input
              type="tel"
              inputMode="numeric"
              className={`form-input ${styles.phoneInput} ${error ? 'form-input-error' : ''}`}
              placeholder="801 234 5678"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ''))
                setError('')
              }}
              autoComplete="tel-national"
              autoFocus
              id="phone-number-input"
            />
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading || phoneNumber.replace(/\D/g, '').length < 7}
            id="send-code-button"
          >
            {loading ? (
              <>
                <span className="spinner spinner-white" />
                Sending code...
              </>
            ) : (
              'Send verification code'
            )}
          </button>
        </form>

        <p className={styles.terms}>
          By continuing, you agree to our{' '}
          <a href="/terms">Terms of Service</a>{' '}
          and <a href="/privacy">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
