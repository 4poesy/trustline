'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react'
import styles from './page.module.css'

const PURPOSES = ['Working Capital','Stock Purchase','Equipment','Emergency','Education','Other']

export default function LoanApplyPage() {
  const { product_id } = useParams()
  const { profile } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lenderName, setLenderName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [amount, setAmount] = useState('')
  const [tenure, setTenure] = useState('')
  const [purpose, setPurpose] = useState('Working Capital')
  const [otherPurpose, setOtherPurpose] = useState('')

  useEffect(() => {
    const f = async () => { if(!product_id) return; try {
      const {data:p} = await supabase.from('loan_products').select('*, lenders(id,company_name)').eq('id',product_id).single()
      if(p) { setProduct(p); setAmount(String(p.minimum_amount)); setTenure(String(p.minimum_tenure_days)); setLenderName(p.lenders?.company_name||'') }
    } catch(e){console.error(e)} finally{setLoading(false)} }; f()
  }, [product_id])

  if(loading||!product) return <div className={styles.loadingContainer}><span className="spinner"/><p>Loading...</p></div>

  const amt = parseFloat(amount)||0; const ten = parseInt(tenure)||0
  const months = ten/30; const rate = Number(product.interest_rate)
  const interest = product.interest_type==='flat'?amt*(rate/100)*months:amt*(Math.pow(1+rate/100,months)-1)
  const totalRepay = amt+interest
  const amountValid = amt>=product.minimum_amount && amt<=product.maximum_amount
  const tenureValid = ten>=product.minimum_tenure_days && ten<=product.maximum_tenure_days

  const handleSubmit = async () => {
    if(submitting||!profile?.id) return
    if(!amountValid||!tenureValid) { setErrorMsg('Amount or tenure is out of range.'); return }
    setSubmitting(true); setErrorMsg('')
    try {
      const {data:kyc} = await supabase.from('kyc_profiles').select('tier').eq('profile_id',profile.id).maybeSingle()
      const trustSnapshot = { trust_score:(profile as any).trust_score||0, kyc_tier:kyc?.tier||0, profile_name:profile.name, snapshot_at:new Date().toISOString() }

      const {error} = await supabase.from('loan_applications').insert({
        loan_product_id:product_id, lender_id:product.lender_id, applicant_profile_id:profile.id,
        requested_amount:amt, requested_tenure_days:ten,
        purpose: purpose==='Other'?otherPurpose.trim():purpose,
        status:'submitted', trust_snapshot:trustSnapshot, kyc_tier_at_application:kyc?.tier||0,
        trustline_fee_amount:amt*0.025, trustline_fee_status:'pending',
      })
      if(error) throw error; setSuccess(true)
    } catch(e:any) { setErrorMsg(e.message||'Submission failed.') }
    finally{setSubmitting(false)}
  }

  if(success) return (
    <div className={styles.page}><main className={styles.successContainer}>
      <CheckCircle size={56} style={{color:'#059669'}}/>
      <h2>Application Submitted!</h2>
      <p>{lenderName} will review your application and respond within 2-3 business days. We&apos;ll notify you when there&apos;s an update.</p>
      <Link href="/loans/my-applications" className="btn btn-primary" style={{marginTop:16}}>View My Applications</Link>
    </main></div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href={`/loans/${product_id}`} className={styles.backButton}><ArrowLeft size={20}/></Link>
        <h1 className={styles.title}>Apply</h1><div style={{width:40}}/>
      </div></header>
      <main className={styles.main}>
        <h2 className={styles.productLabel}>{product.name} <span>by {lenderName}</span></h2>
        {errorMsg&&<div className={styles.errorAlert}><AlertCircle size={16}/><span>{errorMsg}</span></div>}

        <section className={`card ${styles.formCard}`}>
          <div className="form-group"><label className="form-label">Requested Amount (₦) *</label>
            <input type="number" className="form-input" value={amount} onChange={e=>setAmount(e.target.value)} min={product.minimum_amount} max={product.maximum_amount}/>
            {!amountValid&&amt>0&&<span className={styles.fieldError}>Must be between ₦{Number(product.minimum_amount).toLocaleString()} and ₦{Number(product.maximum_amount).toLocaleString()}</span>}
          </div>
          <div className="form-group" style={{marginTop:12}}><label className="form-label">Requested Tenure (days) *</label>
            <input type="number" className="form-input" value={tenure} onChange={e=>setTenure(e.target.value)} min={product.minimum_tenure_days} max={product.maximum_tenure_days}/>
            {!tenureValid&&ten>0&&<span className={styles.fieldError}>Must be between {product.minimum_tenure_days} and {product.maximum_tenure_days} days</span>}
          </div>
          <div className="form-group" style={{marginTop:12}}><label className="form-label">Purpose *</label>
            <select className="form-input" value={purpose} onChange={e=>setPurpose(e.target.value)}>{PURPOSES.map(p=><option key={p} value={p}>{p}</option>)}</select>
            {purpose==='Other'&&<input className="form-input" style={{marginTop:8}} value={otherPurpose} onChange={e=>setOtherPurpose(e.target.value)} placeholder="Describe your purpose"/>}
          </div>
        </section>

        <section className={`card ${styles.previewCard}`}>
          <h3>Repayment Preview</h3>
          <div className={styles.previewGrid}>
            <div><span>Interest</span><strong>₦{Math.round(interest).toLocaleString()}</strong></div>
            <div><span>Total Repayment</span><strong>₦{Math.round(totalRepay).toLocaleString()}</strong></div>
            <div><span>Rate Type</span><strong>{product.interest_type}</strong></div>
          </div>
        </section>

        <div className={styles.consentNote}>
          <p>By submitting, you authorize sharing your Trust Score and financial summary with <strong>{lenderName}</strong>.</p>
        </div>

        <button className="btn btn-primary btn-large" style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8}} onClick={handleSubmit} disabled={submitting||!amountValid||!tenureValid}>
          <Send size={18}/>{submitting?'Submitting...':'Submit Application'}
        </button>
      </main>
    </div>
  )
}
