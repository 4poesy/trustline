'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Building2, MapPin, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import styles from './page.module.css'

const NIGERIAN_STATES = ['Lagos','Abuja','Kano','Rivers','Oyo','Kaduna','Ogun','Delta','Enugu','Anambra','Imo','Edo','Kwara','Osun','Ondo','Abia','Benue','Plateau','Cross River','Bayelsa','Akwa Ibom','Kogi','Niger','Nasarawa','Taraba','Borno','Adamawa','Yobe','Gombe','Bauchi','Jigawa','Zamfara','Sokoto','Kebbi','Katsina','Ekiti','Ebonyi']

const COMPANY_TYPES = [
  { value: 'microfinance_bank', label: 'Microfinance Bank' },
  { value: 'digital_lender', label: 'Digital Lender' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'credit_union', label: 'Credit Union' },
  { value: 'other', label: 'Other' },
]

export default function LenderRegisterPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [form, setForm] = useState({
    company_name: '', company_type: 'microfinance_bank', registration_number: '',
    cbn_license_number: '', website: '', headquarters_location: '',
    operating_regions: [] as string[],
    contact_email: '', contact_phone: '',
  })

  const update = (key: string, val: any) => setForm({ ...form, [key]: val })

  const toggleRegion = (r: string) => {
    const current = form.operating_regions
    if (current.includes(r)) update('operating_regions', current.filter(x => x !== r))
    else update('operating_regions', [...current, r])
  }

  const handleSubmit = async () => {
    if (!profile?.id || submitting) return
    setSubmitting(true); setErrorMsg('')
    try {
      const { data: lender, error: lErr } = await supabase.from('lenders').insert({
        company_name: form.company_name.trim(), company_type: form.company_type,
        registration_number: form.registration_number.trim(),
        cbn_license_number: form.cbn_license_number.trim() || null,
        website: form.website.trim() || null, headquarters_location: form.headquarters_location.trim(),
        operating_regions: form.operating_regions, contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(), status: 'pending_review',
        created_by_profile_id: profile.id,
      }).select().single()
      if (lErr) throw lErr

      await supabase.from('lender_admin_users').insert({
        lender_id: lender.id, profile_id: profile.id, role: 'owner', accepted_at: new Date().toISOString()
      })
      setSuccess(true)
    } catch (e: any) { setErrorMsg(e.message || 'Registration failed.') }
    finally { setSubmitting(false) }
  }

  if (success) {
    return (
      <div className={styles.page}><main className={styles.successContainer}>
        <CheckCircle size={56} className={styles.successIcon} />
        <h2>Application Submitted!</h2>
        <p>Your organization is under review. We typically respond within 2-3 business days. You'll receive a notification when approved.</p>
        <Link href="/lenders/dashboard" className="btn btn-primary" style={{ marginTop: 16 }}>Go to Dashboard</Link>
      </main></div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/lenders" className={styles.backButton}><ArrowLeft size={20} /></Link>
        <h1 className={styles.title}>Register Lender</h1>
        <div style={{ width: 40 }} />
      </div></header>

      <main className={styles.main}>
        {errorMsg && <div className={styles.errorAlert}><AlertCircle size={16} /><span>{errorMsg}</span></div>}

        <div className={styles.stepper}>
          {[1,2,3,4].map(s => (
            <div key={s} className={`${styles.stepDot} ${step >= s ? styles.stepActive : ''}`}>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <section className={`card ${styles.formCard}`}>
            <h3><Building2 size={20} /> Company Details</h3>
            <div className="form-group"><label className="form-label">Company Name *</label>
              <input className="form-input" value={form.company_name} onChange={e => update('company_name', e.target.value)} placeholder="e.g. QuickCash Microfinance Bank" required /></div>
            <div className="form-group" style={{marginTop:12}}><label className="form-label">Company Type *</label>
              <select className="form-input" value={form.company_type} onChange={e => update('company_type', e.target.value)}>
                {COMPANY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select></div>
            <div className="form-group" style={{marginTop:12}}><label className="form-label">CAC Registration Number *</label>
              <input className="form-input" value={form.registration_number} onChange={e => update('registration_number', e.target.value)} placeholder="e.g. RC-123456" /></div>
            <div className="form-group" style={{marginTop:12}}><label className="form-label">CBN License Number (if applicable)</label>
              <input className="form-input" value={form.cbn_license_number} onChange={e => update('cbn_license_number', e.target.value)} placeholder="Optional" /></div>
            <div className="form-group" style={{marginTop:12}}><label className="form-label">Website</label>
              <input className="form-input" value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://..." /></div>
            <div className="form-group" style={{marginTop:12}}><label className="form-label">Headquarters Location *</label>
              <input className="form-input" value={form.headquarters_location} onChange={e => update('headquarters_location', e.target.value)} placeholder="e.g. Lagos, Nigeria" /></div>
            <button className="btn btn-primary btn-large" style={{marginTop:24}} onClick={() => { if (form.company_name && form.registration_number && form.headquarters_location) setStep(2); else setErrorMsg('Fill all required fields.') }}>Next: Operating Regions</button>
          </section>
        )}

        {step === 2 && (
          <section className={`card ${styles.formCard}`}>
            <h3><MapPin size={20} /> Operating Regions</h3>
            <p className={styles.hint}>Select the states/regions where you lend. This is used to match you with borrowers.</p>
            <div className={styles.regionGrid}>
              {NIGERIAN_STATES.map(r => (
                <label key={r} className={`${styles.regionChip} ${form.operating_regions.includes(r) ? styles.regionActive : ''}`}>
                  <input type="checkbox" checked={form.operating_regions.includes(r)} onChange={() => toggleRegion(r)} style={{display:'none'}} />{r}
                </label>
              ))}
            </div>
            <div className={styles.btnRow}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={() => { if (form.operating_regions.length > 0) setStep(3); else setErrorMsg('Select at least one region.') }}>Next: Contact Info</button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className={`card ${styles.formCard}`}>
            <h3><Mail size={20} /> Contact & Documentation</h3>
            <div className="form-group"><label className="form-label">Contact Email *</label>
              <input type="email" className="form-input" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} placeholder="loans@yourcompany.com" /></div>
            <div className="form-group" style={{marginTop:12}}><label className="form-label">Contact Phone *</label>
              <input className="form-input" value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} placeholder="+234..." /></div>
            <div className={styles.btnRow}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
              <button className="btn btn-primary" onClick={() => { if (form.contact_email && form.contact_phone) setStep(4); else setErrorMsg('Fill all required fields.') }}>Next: Review</button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className={`card ${styles.formCard}`}>
            <h3><CheckCircle size={20} /> Review & Submit</h3>
            <div className={styles.reviewGrid}>
              <div className={styles.reviewItem}><span>Company</span><strong>{form.company_name}</strong></div>
              <div className={styles.reviewItem}><span>Type</span><strong>{COMPANY_TYPES.find(t => t.value === form.company_type)?.label}</strong></div>
              <div className={styles.reviewItem}><span>Registration</span><strong>{form.registration_number}</strong></div>
              {form.cbn_license_number && <div className={styles.reviewItem}><span>CBN License</span><strong>{form.cbn_license_number}</strong></div>}
              <div className={styles.reviewItem}><span>HQ</span><strong>{form.headquarters_location}</strong></div>
              <div className={styles.reviewItem}><span>Regions</span><strong>{form.operating_regions.join(', ')}</strong></div>
              <div className={styles.reviewItem}><span>Email</span><strong>{form.contact_email}</strong></div>
              <div className={styles.reviewItem}><span>Phone</span><strong>{form.contact_phone}</strong></div>
            </div>
            <div className={styles.btnRow}>
              <button className="btn btn-secondary" onClick={() => setStep(3)}>Back</button>
              <button className="btn btn-primary btn-large" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
