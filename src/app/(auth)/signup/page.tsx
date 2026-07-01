'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Shield, Download, Share2, Copy } from 'lucide-react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
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

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  
  // Step 1 State
  const [name, setName] = useState('')
  const [role, setRole] = useState<'trader' | 'service_provider' | 'group_member'>('trader')
  const [businessType, setBusinessType] = useState('')
  const [location, setLocation] = useState('')
  const [phoneLast4, setPhoneLast4] = useState('')
  const [countryCode, setCountryCode] = useState('NG')

  // Step 2 State
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinStep, setPinStep] = useState<'choose' | 'confirm'>('choose')
  const [recoveryQuestion, setRecoveryQuestion] = useState(RECOVERY_QUESTIONS[0])
  const [recoveryAnswer, setRecoveryAnswer] = useState('')
  const [publicUsername, setPublicUsername] = useState('')

  // Step 3 State
  const [generatedCode, setGeneratedCode] = useState('')
  const [hasSavedCode, setHasSavedCode] = useState(false)

  // System State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  const { signup } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  // Handle step transitions
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.')
      return
    }
    if (phoneLast4 && !/^\d{4}$/.test(phoneLast4)) {
      setError('Phone last 4 digits must be exactly 4 numbers.')
      return
    }
    setStep(2)
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (pin !== confirmPin) {
      setError('PINs do not match. Please re-enter.')
      setPin('')
      setConfirmPin('')
      setPinStep('choose')
      return
    }

    if (!recoveryAnswer.trim()) {
      setError('Please provide a recovery answer.')
      return
    }

    setLoading(true)
    try {
      // 1. Generate code first using generate-trustline-code Edge Function
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fecvmzybfzumyxcphpmp.supabase.co'
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

      const res = await fetch(`${supabaseUrl}/functions/v1/generate-trustline-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({ name, phone_last4: phoneLast4 || null })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to generate your unique code.')
      }

      setGeneratedCode(data.trustline_code)
      setStep(3)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle final registration on step 3
  const handleFinalRegister = async () => {
    if (!hasSavedCode) return
    setLoading(true)
    setError('')

    try {
      const result = await signup({
        trustline_code: generatedCode,
        pin,
        name,
        role,
        business_type: businessType || undefined,
        location: location || undefined,
        phone_last4: phoneLast4 || undefined,
        public_username: publicUsername || undefined,
        recovery_question: recoveryQuestion,
        recovery_answer: recoveryAnswer
      })

      if (result?.error) {
        throw new Error(result.error.message || 'Registration failed.')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Helper: Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  // Helper: Download code as image (offline canvas generation)
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
    ctx.fillText('Permanent Access Pass', 50, 110)

    // Draw code container
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(50, 160, canvas.width - 100, 100)

    // Draw Code
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 36px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(generatedCode, canvas.width / 2, 225)

    // Draw warning note
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = 'italic 14px sans-serif'
    ctx.fillText('Keep this code secure. Do not share it with anyone.', 50, 310)
    ctx.fillText('It is the only way to log back into your Trustline365 account.', 50, 335)

    // Trigger download
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `trustline-code-${generatedCode}.png`
    link.href = dataUrl
    link.click()
  }

  // Helper: Share to WhatsApp Saved Messages
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `My permanent Trustline365 Code is: ${generatedCode}\n\n` +
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
            {step === 1 && 'Create Account'}
            {step === 2 && 'Security & Recovery'}
            {step === 3 && 'Save your Code'}
          </h1>
          <p className={styles.subtitle}>
            {step === 1 && 'Step 1 of 3: Tell us about your business'}
            {step === 2 && 'Step 2 of 3: Choose a PIN and recovery question'}
            {step === 3 && 'Step 3 of 3: Your secure access identity'}
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

        {error && (
          <div className={styles.errorBox} role="alert">
            {error}
          </div>
        )}

        {/* Step Views */}
        <div className={styles.formContainer}>
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="fullname">Your Full Name</label>
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
                <label className="form-label">Select Your Role</label>
                <div className={styles.rolesGrid}>
                  {[
                    { key: 'trader', title: 'Trader', desc: 'Sell goods in the market' },
                    { key: 'service_provider', title: 'Service Provider', desc: 'Offer services to clients' },
                    { key: 'group_member', title: 'Ajo Member', desc: 'Save with a cooperative' }
                  ].map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      className={`${styles.roleCard} ${role === r.key ? styles.roleCardActive : ''}`}
                      onClick={() => setRole(r.key as any)}
                    >
                      <div className={styles.roleCardCheck}>
                        {role === r.key && <Check size={14} />}
                      </div>
                      <h3>{r.title}</h3>
                      <p>{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="business">Business Type</label>
                <input
                  id="business"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Tomato Vendor, Hairdresser, Carpenter"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="loc">Operating Location</label>
                <input
                  id="loc"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Lagos Island, Lagos"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone-last4">
                  Last 4 digits of Phone (Optional)
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
                <span className={styles.fieldHelper}>
                  Helps verify and recover your profile if you ever lose your code.
                </span>
              </div>

              <button type="submit" className="btn btn-primary btn-large">
                Continue to PIN Setup <ArrowRight size={18} />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit} className={styles.form}>
              
              {/* Custom PIN pad workflow */}
              <div className={styles.pinSection}>
                <label className="form-label">
                  {pinStep === 'choose' ? 'Choose a 4-digit PIN' : 'Confirm your 4-digit PIN'}
                </label>
                <PinPad 
                  value={pinStep === 'choose' ? pin : confirmPin}
                  onChange={(val) => {
                    if (pinStep === 'choose') {
                      setPin(val)
                      if (val.length === 4) {
                        setPinStep('confirm')
                      }
                    } else {
                      setConfirmPin(val)
                    }
                  }}
                />
                {pinStep === 'confirm' && (
                  <button 
                    type="button" 
                    className={styles.resetPinBtn}
                    onClick={() => {
                      setPin('')
                      setConfirmPin('')
                      setPinStep('choose')
                    }}
                  >
                    Reset PIN selection
                  </button>
                )}
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
                  placeholder="Your answer (remember this!)"
                  value={recoveryAnswer}
                  onChange={(e) => {
                    setRecoveryAnswer(e.target.value)
                    setError('')
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="username">Public Username (Optional)</label>
                <div className={styles.usernameWrapper}>
                  <span className={styles.usernamePrefix}>@</span>
                  <input
                    id="username"
                    type="text"
                    className="form-input"
                    placeholder="adeola_shop"
                    value={publicUsername}
                    onChange={(e) => setPublicUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                  />
                </div>
                <span className={styles.fieldHelper}>
                  For your public business directory listing.
                </span>
              </div>

              <div className={styles.btnRow}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={pin.length < 4 || confirmPin.length < 4 || !recoveryAnswer.trim() || loading}
                >
                  {loading ? 'Generating account...' : 'Generate My Code'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className={styles.certificateView}>
              <div className={styles.certificate}>
                <Shield className={styles.certIcon} size={48} />
                <span className={styles.certBrand}>TRUSTLINE365</span>
                <h2>YOUR PERMANENT CODE</h2>
                
                <div className={styles.codeReveal}>
                  {generatedCode}
                </div>

                <p className={styles.certWarning}>
                  This is your permanent Access Code. It is the <strong>only way</strong> to log into your account.
                  Write it down on paper. Store it securely. We do not use passwords and cannot email it to you.
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

              <div className={styles.consentCheckbox}>
                <input
                  id="consent"
                  type="checkbox"
                  checked={hasSavedCode}
                  onChange={(e) => setHasSavedCode(e.target.checked)}
                />
                <label htmlFor="consent">
                  I have saved my Trustline365 Code securely on paper or in a safe place.
                </label>
              </div>

              <button
                onClick={handleFinalRegister}
                className="btn btn-primary btn-large"
                disabled={!hasSavedCode || loading}
              >
                {loading ? 'Creating Profile...' : 'I Am Saved — Enter Trustline365'}
              </button>
            </div>
          )}
        </div>

        <div className={styles.footerLinks}>
          <span>Already have an account?</span>
          <Link href="/login" className={styles.loginLink}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  )
}
