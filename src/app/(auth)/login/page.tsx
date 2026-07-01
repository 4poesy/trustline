'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { TrustlineCodeInput } from '@/modules/auth/components/TrustlineCodeInput'
import { PinPad } from '@/modules/auth/components/PinPad'
import styles from './page.module.css'

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2>(1) // 1: Enter Code, 2: Enter PIN
  const [trustlineCode, setTrustlineCode] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null)
  
  const { login } = useAuth()
  const router = useRouter()

  const handleCodeNext = () => {
    setError('')
    // Check if code matches the placeholder pattern or is filled
    const cleanCode = trustlineCode.replace(/_/g, '')
    if (cleanCode.length < 16) {
      setError('Please fill in your complete 16-character Trustline Code.')
      return
    }
    setStep(2)
  }

  const handlePinChange = async (newPin: string) => {
    setPin(newPin)
    setError('')

    // Auto-submit when exactly 4 digits entered
    if (newPin.length === 4) {
      setLoading(true)
      const cleanCode = trustlineCode.replace(/_/g, '')

      const result = await login(cleanCode, newPin)
      setLoading(false)

      if (result?.error) {
        setPin('') // Reset pin pad
        const err = result.error.message || ''

        if (err.includes('account_locked')) {
          setError('Your account is temporarily locked due to too many failed attempts.')
          setLockoutMinutes(30)
          setStep(1)
        } else if (err.includes('invalid_credentials')) {
          setError('Incorrect Trustline Code or PIN.')
          // Parse attempts if available in response
          if (result.error.attempts_remaining !== undefined) {
            setAttemptsRemaining(result.error.attempts_remaining)
            setError(`Incorrect PIN. ${result.error.attempts_remaining} attempts remaining before temporary lock.`)
          }
        } else {
          setError(err || 'Something went wrong. Please try again.')
        }
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className={styles.page}>
      
      {/* Full-width premium header banner with wavy divider */}
      <header className={styles.headerBanner}>
        <div className={styles.headerBannerInner}>
          <div className={styles.logo}>
            <img src="/images/logo-full.png" alt="Trustline365 Logo" className={styles.logoImage} />
          </div>
          
          <h1 className={styles.title}>
            {step === 1 ? 'Enter your Code' : 'Enter your PIN'}
          </h1>
          <p className={styles.subtitle}>
            {step === 1 
              ? 'Enter your unique 16-character Trustline Code' 
              : 'Enter your 4-digit security PIN to unlock'}
          </p>
        </div>

        {/* Gold Wavy Divider at bottom of banner */}
        <div className={styles.headerWave}>
          <svg className={styles.waveSvg} viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,60 C150,90 350,90 500,60 C650,30 850,30 1000,60 C1150,90 1250,90 1200,60 L1200,120 L0,120 Z" fill="var(--color-background)"></path>
            <path d="M0,60 C150,90 350,90 500,60 C650,30 850,30 1000,60 C1150,90 1250,90 1200,60" fill="none" stroke="var(--saffron)" strokeWidth="3"></path>
          </svg>
        </div>
      </header>

      <div className={styles.container}>
        
        {/* Back navigation when on PIN step */}
        {step === 2 && (
          <button 
            type="button" 
            className={styles.backLinkBtn} 
            onClick={() => {
              setStep(1)
              setPin('')
              setError('')
            }}
          >
            <ArrowLeft size={16} /> Back to Code
          </button>
        )}

        {error && (
          <div className={styles.errorBox} role="alert">
            {error}
          </div>
        )}

        {lockoutMinutes && (
          <div className={styles.lockoutBox}>
            🔒 Locked out. Try again in {lockoutMinutes} minutes.
          </div>
        )}

        <div className={styles.formContainer}>
          {step === 1 ? (
            <div className={styles.stepContainer}>
              <div className={styles.inputWrapper}>
                <TrustlineCodeInput 
                  value={trustlineCode} 
                  onChange={(val) => {
                    setTrustlineCode(val)
                    setError('')
                  }}
                  error={!!error}
                />
              </div>

              <button
                type="button"
                onClick={handleCodeNext}
                className="btn btn-primary btn-large"
                disabled={trustlineCode.replace(/_/g, '').length < 16}
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className={styles.stepContainer}>
              <PinPad 
                value={pin} 
                onChange={handlePinChange} 
                maxLength={4}
              />
              
              {loading && (
                <div className={styles.loadingOverlay}>
                  <span className="spinner" />
                  <p>Verifying PIN...</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footerLinks}>
          <Link href="/recover" className={styles.recoveryLink}>
            I forgot my code
          </Link>
          <span className={styles.divider}>·</span>
          <Link href="/signup" className={styles.signupLink}>
            New to Trustline365? <strong>Sign up</strong>
          </Link>
        </div>

        <p className={styles.terms}>
          By continuing, you agree to our{' '}
          <Link href="/terms">Terms of Service</Link>{' '}
          and <Link href="/privacy">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
