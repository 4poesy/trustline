'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import styles from './page.module.css'

export default function InsuranceClaimsPage() {
  const { profile } = useAuth()

  const [policies, setPolicies] = useState<any[]>([])
  const [selectedPolicyId, setSelectedPolicyId] = useState('')
  const [claimType, setClaimType] = useState('damage')
  const [description, setDescription] = useState('')
  const [estimatedLoss, setEstimatedLoss] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchActivePolicies = async () => {
      if (!profile?.id) return
      try {
        const { data } = await supabase
          .from('insurance_policies')
          .select('id, plan_name, plan_type, status')
          .eq('profile_id', profile.id)
          .eq('status', 'active')

        if (data) {
          setPolicies(data)
          if (data.length > 0) setSelectedPolicyId(data[0].id)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchActivePolicies()
  }, [profile?.id])

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPolicyId || !description.trim() || submitting || !profile?.id) return

    setSubmitting(true)
    setErrorMsg('')

    try {
      // For MVP, we record the claim directly on the policy as a status change + metadata
      // In production this would go to a separate claims table
      const { error } = await supabase
        .from('insurance_policies')
        .update({
          status: 'claim_pending',
          // Store claim details in a metadata-like approach
        })
        .eq('id', selectedPolicyId)

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit claim.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading your active policies...</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className={styles.page}>
        <main className={styles.successContainer}>
          <CheckCircle size={56} className={styles.successIcon} />
          <h2>Claim Submitted</h2>
          <p>Your claim is being reviewed. You'll receive a notification within 48 hours with the outcome.</p>
          <Link href="/insurance" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Back to Insurance
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/insurance" className={styles.backButton} aria-label="Back">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>File a Claim</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {errorMsg && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {policies.length === 0 ? (
          <div className={styles.emptyCard}>
            <FileText size={40} className={styles.emptyIcon} />
            <h3>No Active Policies</h3>
            <p>You need an active insurance policy before you can file a claim.</p>
            <Link href="/insurance/browse" className="btn btn-primary" style={{ marginTop: '12px' }}>
              Browse Plans
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmitClaim} className={`card ${styles.claimForm}`}>
            <div className="form-group">
              <label className="form-label">Select Policy</label>
              <select
                className="form-input"
                value={selectedPolicyId}
                onChange={(e) => setSelectedPolicyId(e.target.value)}
                required
              >
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>{p.plan_name} ({p.plan_type})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Claim Type</label>
              <select
                className="form-input"
                value={claimType}
                onChange={(e) => setClaimType(e.target.value)}
              >
                <option value="damage">Property Damage</option>
                <option value="theft">Theft / Loss</option>
                <option value="health">Health Emergency</option>
                <option value="device">Device Damage / Crack</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Description of Incident</label>
              <textarea
                className="form-input"
                style={{ minHeight: '100px', padding: '10px' }}
                placeholder="Describe what happened, when it occurred, and the items affected..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Estimated Loss Amount (₦)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 25000"
                value={estimatedLoss}
                onChange={(e) => setEstimatedLoss(e.target.value)}
              />
            </div>

            <div className={styles.uploadSection}>
              <Upload size={20} className={styles.uploadIcon} />
              <div>
                <h4>Supporting Evidence</h4>
                <p>Photos, receipts, or police reports can be uploaded after submission via the review team.</p>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-large" style={{ marginTop: '20px' }} disabled={submitting}>
              {submitting ? 'Submitting Claim...' : 'Submit Insurance Claim'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
