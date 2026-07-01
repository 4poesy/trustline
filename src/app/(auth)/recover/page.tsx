'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Shield, Download, Share2, Copy } from 'lucide-react'
import { PinPad } from '@/modules/auth/components/PinPad'
import { createClient } from '@/lib/supabase/client'
import styles from './page.module.css'

const RECOVERY_QUESTIONS = [
  "What is the name of your first customer or client?",
  "What is the name of the market or street where you work?",
  "What is your mother's first name?",
  "What was the name of your primary school?",
  "What is the nickname your family calls you?"
]

export default function RecoverPage() {
  const [step, setStep] = useState<1 | 2>(1) // 1: Enter Recovery Info, 2: Show Recovered Code
  
  // Inputs
  const [name, setName] = useState('')
  const [phoneLast4, setPhoneLast4] = useState('')
  const [pin, setPin] = useState('')
  const [recoveryQuestion, setRecoveryQuestion] = useState(RECOVERY_QUESTIONS[0])
  const [recoveryAnswer, setRecoveryAnswer] = useState('')

  // Results
  const [recoveredCode, setRecoveredCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (name.trim().length < 2) {
      setError('Please enter your name.')
      return
    }
    if (pin.length < 4) {
      setError('Please enter your 4-digit PIN.')
      return
    }
    if (!recoveryAnswer.trim()) {
      setError('Please provide your recovery answer.')
      return
    }

    setLoading(true)
    try {
      const { data, error: recoveryErr } = await supabase.functions.invoke('recover-trustline-code', {
        body: {
          name: name.trim(),
          phone_last4: phoneLast4 ? phoneLast4.trim() : null,
          pin,
          recovery_question: recoveryQuestion,
          recovery_answer: recoveryAnswer.trim().toLowerCase()
        }
      })

      if (recoveryErr || data?.error) {
        throw new Error(recoveryErr?.message || data?.error || 'Recovery failed.')
      }

      setRecoveredCode(data.trustline_code)
      setStep(2)
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please double-check your answers and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Copy code to clipboard helper
  const handleCopyCode = () => {
    navigator.clipboard.writeText(recoveredCode)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  // Download code as image (offline canvas generation)
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 400
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw background
    ctx.fillStyle = '#0A2E1F' // Trustline Dark Green
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw gold border
    ctx.strokeStyle = '#E8A020'
    ctx.lineWidth = 10
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

    // Draw brand name
    ctx.fillStyle = '#E8A020'
    ctx.font = 'bold 24px sans-serif'
    ctx.fillText('TRUSTLINE365', 50, 70)

    // Draw certificate title
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '20px sans-serif'
    ctx.fillText('Recovered Access Pass', 50, 110)

    // Draw code container
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(50, 160, canvas.width - 100, 100)

    // Draw Code
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 36px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(recoveredCode, canvas.width / 2, 225)

    // Draw warning note
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = 'italic 14px sans-serif'
    ctx.fillText('Keep this code secure. Do not share it with anyone.', 50, 310)
    ctx.fillText('It is the only way to log back into your Trustline365 account.', 50, 335)

    // Trigger download
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `recovered-code-${recoveredCode}.png`
    link.href = dataUrl
    link.click()
  }

  // Share to WhatsApp Saved Messages helper
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `My recovered Trustline365 Code is: ${recoveredCode}\n\n` +
      `Keep this code safe. Do not share it with anyone. It is the only way to access your account!`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  return (
    <div className={styles.page}>
      
      {/* Full-width premium header banner with wavy divider */}
      <header className={styles.headerBanner}>
        <div className={styles.headerBannerInner}>
          <div className={styles.logo}>
            <img src="/icons/icon-192x192.png" alt="Trustline Logo" className={styles.logoIcon} />
            <span className={styles.logoText}>Trustline365</span>
          </div>
          
          <h1 className={styles.title}>
            {step === 1 ? 'Recover Code' : 'Code Recovered!'}
          </h1>
          <p className={styles.subtitle}>
            {step === 1 
              ? 'Verify your identity details to recover your Trustline Code' 
              : 'Here is your recovered Trustline Code'}
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
        
        {/* Back Link */}
        <Link href="/login" className={styles.backLinkBtn}>
          <ArrowLeft size={16} /> Back to Login
        </Link>

        {error && (
          <div className={styles.errorBox} role="alert">
            {error}
          </div>
        )}

        <div className={styles.formContainer}>
          {step === 1 ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              
              <div className="form-group">
                <label className="form-label" htmlFor="fullname">Your Full Name (Registered)</label>
                <input
                  id="fullname"
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Adeola Adesina"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone-last4">
                  Last 4 digits of Phone (If registered)
                </label>
                <input
                  id="phone-last4"
                  type="text"
                  maxLength={4}
                  className="form-input"
                  placeholder="e.g. 5678"
                  value={phoneLast4}
                  onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className={styles.pinSection}>
                <label className="form-label">Enter your 4-digit PIN</label>
                <PinPad 
                  value={pin}
                  onChange={(val) => {
                    setPin(val)
                    setError('')
                  }}
                  maxLength={4}
                />
              </div>

              <div className={styles.dividerLine} />

              <div className="form-group">
                <label className="form-label" htmlFor="question">Account Recovery Question</label>
                <select
                  id="question"
                  className="form-input"
                  value={recoveryQuestion}
                  onChange={(e) => setRecoveryQuestion(e.target.value)}
                >
                  {RECOVERY_QUESTIONS.map((q, idx) => (
                    <option key={idx} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="answer">Recovery Answer</label>
                <input
                  id="answer"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Your answer"
                  value={recoveryAnswer}
                  onChange={(e) => {
                    setRecoveryAnswer(e.target.value)
                    setError('')
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={loading || pin.length < 4 || !recoveryAnswer.trim()}
              >
                {loading ? 'Verifying Answers...' : 'Recover My Code'}
              </button>
            </form>
          ) : (
            <div className={styles.certificateView}>
              <div className={styles.certificate}>
                <Shield className={styles.certIcon} size={48} />
                <span className={styles.certBrand}>TRUSTLINE365</span>
                <h2>RECOVERED PASSCODE</h2>
                
                <div className={styles.codeReveal}>
                  {recoveredCode}
                </div>

                <p className={styles.certWarning}>
                  Please save this code somewhere secure right now! Do not share it with anyone.
                </p>
              </div>

              {/* Recovery Save Actions */}
              <div className={styles.actionsGrid}>
                <button onClick={handleCopyCode} className={styles.actionBtn}>
                  <Copy size={20} />
                  <span>{copySuccess ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <button onClick={handleDownloadImage} className={styles.actionBtn}>
                  <Download size={20} />
                  <span>Save as Photo</span>
                </button>
                <button onClick={handleShareWhatsApp} className={styles.actionBtn}>
                  <Share2 size={20} />
                  <span>Send to WhatsApp</span>
                </button>
              </div>

              <Link href="/login" className="btn btn-primary btn-large">
                Proceed to Login
              </Link>
            </div>
          )}
        </div>

        <div className={styles.footerLinks}>
          <span>Remembered your details?</span>
          <Link href="/login" className={styles.loginLink}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  )
}
