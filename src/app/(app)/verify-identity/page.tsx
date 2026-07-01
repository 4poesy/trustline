'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, ShieldCheck, Upload, UserCheck, Smartphone, Landmark, FileText, CheckCircle2 } from 'lucide-react'
import styles from './page.module.css'

export default function VerifyIdentityPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [currentTier, setCurrentTier] = useState(0)
  const [bvn, setBvn] = useState('')
  const [nin, setNin] = useState('')
  const [docType, setDocType] = useState('national_id')
  const [docUrl, setDocUrl] = useState('')
  const [selfieUrl, setSelfieUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchKycStatus = async () => {
      if (!profile?.id) return
      try {
        const { data, error } = await supabase
          .from('kyc_profiles')
          .select('tier, bvn, nin, document_url, selfie_url')
          .eq('profile_id', profile.id)
          .single()
        if (data) {
          setCurrentTier(data.tier)
          setDocUrl(data.document_url || '')
          setSelfieUrl(data.selfie_url || '')
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchKycStatus()
  }, [profile?.id])

  const handleUpgradeTier1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const response = await supabase.functions.invoke('verify-identity', {
        body: { profile_id: profile?.id, bvn, nin, requested_tier: 1 }
      })
      if (response.error) throw new Error(response.error)
      if (response.data?.success) {
        setCurrentTier(1)
        setSuccessMsg('Tier 1 verification successful! BVN/NIN verified.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpgradeTier2 = async () => {
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      // Mock document upload URL
      const mockUrl = `https://supabase.co/storage/v1/object/public/documents/docs-${profile?.id}.jpg`
      const response = await supabase.functions.invoke('verify-identity', {
        body: { profile_id: profile?.id, document_type: docType, document_url: mockUrl, requested_tier: 2 }
      })
      if (response.error) throw new Error(response.error)
      if (response.data?.success) {
        setCurrentTier(2)
        setDocUrl(mockUrl)
        setSuccessMsg('Tier 2 verification successful! Government ID uploaded.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Document upload failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpgradeTier3 = async () => {
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      // Mock liveness check selfie URL
      const mockSelfie = `https://supabase.co/storage/v1/object/public/documents/selfie-${profile?.id}.jpg`
      const response = await supabase.functions.invoke('verify-identity', {
        body: { profile_id: profile?.id, selfie_url: mockSelfie, requested_tier: 3 }
      })
      if (response.error) throw new Error(response.error)
      if (response.data?.success) {
        setCurrentTier(3)
        setSelfieUrl(mockSelfie)
        setSuccessMsg('Tier 3 verification successful! Liveness check complete.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Liveness check failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading identity profile...</p>
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
          <h1 className={styles.title}>Identity Verification</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {/* Tier Status card */}
        <section className={`card ${styles.statusCard}`}>
          <div className={styles.statusHeader}>
            <ShieldCheck size={28} className={styles.shieldIcon} />
            <div>
              <h3>KYC LEVEL</h3>
              <h2>Tier {currentTier} Verified</h2>
            </div>
          </div>
          <p className={styles.statusDesc}>
            {currentTier === 0 && 'Upgrade to Tier 1 to unlock P2P transfers and loan profile sharing.'}
            {currentTier === 1 && 'Upgrade to Tier 2 to unlock higher limits and micro-insurance.'}
            {currentTier === 2 && 'Upgrade to Tier 3 to unlock cross-border transfers and B2B Developer APIs.'}
            {currentTier === 3 && 'Outstanding! You have reached maximum verification level.'}
          </p>
        </section>

        {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
        {successMsg && <div className={styles.successAlert}>{successMsg}</div>}

        {/* TIER Upgrade Flow */}
        <section className={styles.tierFlow}>
          
          {/* TIER 1 Box */}
          <div className={`${styles.tierBox} ${currentTier >= 1 ? styles.tierBoxVerified : ''}`}>
            <div className={styles.tierHeader}>
              <Smartphone size={22} className={styles.tierIcon} />
              <h4>TIER 1 — Link BVN or NIN</h4>
              {currentTier >= 1 && <span className={styles.verifiedBadge}><CheckCircle2 size={14} /> Link verified</span>}
            </div>
            
            {currentTier === 0 && (
              <form onSubmit={handleUpgradeTier1} className={styles.tierForm}>
                <div className="form-group">
                  <label className="form-label">Bank Verification Number (BVN)</label>
                  <input
                    type="password"
                    maxLength={11}
                    className="form-input"
                    placeholder="Enter 11-digit BVN"
                    value={bvn}
                    onChange={(e) => setBvn(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div className={styles.divider}>OR</div>
                <div className="form-group">
                  <label className="form-label">National Identification Number (NIN)</label>
                  <input
                    type="password"
                    maxLength={11}
                    className="form-input"
                    placeholder="Enter 11-digit NIN"
                    value={nin}
                    onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={submitting}>
                  {submitting ? 'Verifying...' : 'Verify Details'}
                </button>
              </form>
            )}
          </div>

          {/* TIER 2 Box */}
          <div className={`${styles.tierBox} ${currentTier >= 2 ? styles.tierBoxVerified : ''} ${currentTier < 1 ? styles.tierBoxLocked : ''}`}>
            <div className={styles.tierHeader}>
              <Landmark size={22} className={styles.tierIcon} />
              <h4>TIER 2 — Government ID Document</h4>
              {currentTier >= 2 && <span className={styles.verifiedBadge}><CheckCircle2 size={14} /> Document verified</span>}
            </div>
            
            {currentTier === 1 && (
              <div className={styles.tierForm}>
                <div className="form-group">
                  <label className="form-label">Document Type</label>
                  <select value={docType} onChange={(e) => setDocType(e.target.value)} className="form-input">
                    <option value="national_id">National ID Card</option>
                    <option value="voters_card">Voter's Card</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="passport">International Passport</option>
                  </select>
                </div>
                <div className={styles.uploadBox}>
                  <Upload size={24} />
                  <span>Choose file to upload document photo</span>
                </div>
                <button onClick={handleUpgradeTier2} className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={submitting}>
                  {submitting ? 'Uploading...' : 'Submit ID Document'}
                </button>
              </div>
            )}
          </div>

          {/* TIER 3 Box */}
          <div className={`${styles.tierBox} ${currentTier >= 3 ? styles.tierBoxVerified : ''} ${currentTier < 2 ? styles.tierBoxLocked : ''}`}>
            <div className={styles.tierHeader}>
              <UserCheck size={22} className={styles.tierIcon} />
              <h4>TIER 3 — Liveness Check Selfie</h4>
              {currentTier >= 3 && <span className={styles.verifiedBadge}><CheckCircle2 size={14} /> Selfie verified</span>}
            </div>
            
            {currentTier === 2 && (
              <div className={styles.tierForm}>
                <div className={styles.selfiePrompt}>
                  <div className={styles.selfieFrame}>📸</div>
                  <p>Prepare to capture your face inside the liveness check frame</p>
                </div>
                <button onClick={handleUpgradeTier3} className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={submitting}>
                  {submitting ? 'Processing Liveness...' : 'Start Liveness Check'}
                </button>
              </div>
            )}
          </div>

        </section>
      </main>
    </div>
  )
}
