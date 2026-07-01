'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, BadgeCheck, CheckCircle, AlertTriangle, Calculator, ShieldCheck } from 'lucide-react'
import styles from './page.module.css'

export default function LoanProductDetailPage() {
  const { product_id } = useParams()
  const { profile } = useAuth()
  const [product, setProduct] = useState<any>(null)
  const [kycTier, setKycTier] = useState(0)
  const [trustScore, setTrustScore] = useState(0)
  const [monthsActive, setMonthsActive] = useState(0)
  const [calcAmount, setCalcAmount] = useState('')
  const [calcTenure, setCalcTenure] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const f = async () => { if(!profile?.id||!product_id) return; try {
      const {data:p} = await supabase.from('loan_products').select('*, lenders(id,company_name,company_type,cbn_license_number,status)').eq('id',product_id).single()
      if(p) { setProduct(p); setCalcAmount(String(p.minimum_amount)); setCalcTenure(String(p.minimum_tenure_days)) }
      const {data:kyc} = await supabase.from('kyc_profiles').select('tier').eq('profile_id',profile.id).maybeSingle()
      setKycTier(kyc?.tier||0)
      setTrustScore((profile as any).trust_score||0)
      setMonthsActive(Math.floor((Date.now()-new Date(profile.created_at).getTime())/(30*24*60*60*1000)))
    } catch(e){console.error(e)} finally{setLoading(false)} }; f()
  }, [profile?.id, product_id])

  if(loading||!product) return <div className={styles.loadingContainer}><span className="spinner"/><p>Loading product...</p></div>

  const amt = parseFloat(calcAmount)||product.minimum_amount
  const tenure = parseInt(calcTenure)||product.minimum_tenure_days
  const months = tenure/30
  const rate = Number(product.interest_rate)
  const totalInterest = product.interest_type==='flat' ? amt*(rate/100)*months : amt*(Math.pow(1+rate/100,months)-1)
  const totalRepay = amt+totalInterest
  const apr = product.interest_type==='flat' ? rate*12 : (Math.pow(1+rate/100,12)-1)*100
  const perPeriod = product.repayment_frequency==='monthly'?totalRepay/months : product.repayment_frequency==='weekly'?totalRepay/(tenure/7) : product.repayment_frequency==='daily'?totalRepay/tenure : totalRepay

  const eligChecks = [
    { label: `KYC Tier ${product.minimum_kyc_tier}+`, met: kycTier>=product.minimum_kyc_tier },
    { label: `Trust Score ${product.minimum_trust_score}+`, met: trustScore>=product.minimum_trust_score },
    { label: `${product.minimum_months_active}+ months active`, met: monthsActive>=product.minimum_months_active },
    { label: `Role: ${(product.target_user_roles||[]).join(', ')}`, met: (product.target_user_roles||[]).includes(profile?.role) },
  ]
  const allEligible = eligChecks.every(c=>c.met)

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/loans" className={styles.backButton}><ArrowLeft size={20}/></Link>
        <h1 className={styles.title}>Loan Details</h1><div style={{width:40}}/>
      </div></header>
      <main className={styles.main}>
        <section className={`card ${styles.productCard}`}>
          <h2 className={styles.productName}>{product.name}</h2>
          <p className={styles.productDesc}>{product.description}</p>
          <div className={styles.termsGrid}>
            <div><span>Amount Range</span><strong>₦{Number(product.minimum_amount).toLocaleString()} – ₦{Number(product.maximum_amount).toLocaleString()}</strong></div>
            <div><span>Monthly Rate</span><strong>{product.interest_rate}% ({product.interest_type})</strong></div>
            <div><span>APR</span><strong>{Math.round(apr*100)/100}%</strong></div>
            <div><span>Tenure</span><strong>{product.minimum_tenure_days}–{product.maximum_tenure_days} days</strong></div>
            <div><span>Repayment</span><strong style={{textTransform:'capitalize'}}>{product.repayment_frequency.replace('_',' ')}</strong></div>
            {product.processing_fee>0&&<div><span>Processing Fee</span><strong>₦{Number(product.processing_fee).toLocaleString()}</strong></div>}
            {product.collateral_required&&<div><span>Collateral</span><strong>{product.collateral_description||'Required'}</strong></div>}
          </div>
        </section>

        <section className={`card ${styles.lenderCard}`}>
          <div className={styles.lenderRow}>
            <div className={styles.lenderPlaceholder}>{product.lenders?.company_name?.charAt(0)}</div>
            <div><h3>{product.lenders?.company_name}</h3><span className={styles.lenderType}>{product.lenders?.company_type?.replace('_',' ')}</span></div>
          </div>
          {product.lenders?.cbn_license_number&&<div className={styles.verifiedRow}><BadgeCheck size={16}/> CBN License: {product.lenders.cbn_license_number}</div>}
          {product.lenders?.status==='approved'&&<div className={styles.verifiedRow} style={{color:'#059669'}}><ShieldCheck size={16}/> Verified Lender</div>}
        </section>

        <section className={`card ${styles.calcCard}`}>
          <h3><Calculator size={18}/> Interest Calculator</h3>
          <div className={styles.calcRow}>
            <div className="form-group"><label className="form-label">Amount (₦)</label><input type="number" className="form-input" value={calcAmount} onChange={e=>setCalcAmount(e.target.value)} min={product.minimum_amount} max={product.maximum_amount}/></div>
            <div className="form-group"><label className="form-label">Tenure (days)</label><input type="number" className="form-input" value={calcTenure} onChange={e=>setCalcTenure(e.target.value)} min={product.minimum_tenure_days} max={product.maximum_tenure_days}/></div>
          </div>
          <div className={styles.calcResult}>
            <div><span>Total Interest</span><strong>₦{Math.round(totalInterest).toLocaleString()}</strong></div>
            <div><span>Total Repayment</span><strong>₦{Math.round(totalRepay).toLocaleString()}</strong></div>
            <div><span>Per {product.repayment_frequency==='end_of_tenure'?'Term':product.repayment_frequency.replace('_',' ')}</span><strong>₦{Math.round(perPeriod).toLocaleString()}</strong></div>
          </div>
        </section>

        <section className={`card ${styles.eligCard}`}>
          <h3>Your Eligibility</h3>
          <div className={styles.eligList}>
            {eligChecks.map((c,i)=><div key={i} className={styles.eligItem}>{c.met?<CheckCircle size={18} className={styles.eligPass}/>:<AlertTriangle size={18} className={styles.eligFail}/>}<span>{c.label}</span></div>)}
          </div>
        </section>

        <section className={`card ${styles.consentCard}`}>
          <h3><ShieldCheck size={18}/> Data Sharing Disclosure</h3>
          <p>If you apply, <strong>{product.lenders?.company_name}</strong> will receive:</p>
          <ul>
            <li>Your Trust Score (current: {trustScore})</li>
            <li>Your KYC Tier (Tier {kycTier})</li>
            <li>Your income summary for the last 6 months (totals only, not individual transactions)</li>
            <li>Your Trustline profile name and phone number</li>
          </ul>
          <p className={styles.consentStrong}>They will <strong>NOT</strong> receive your BVN, NIN, or individual transaction details.</p>
          <label className={styles.consentCheck}><input type="checkbox" checked={consentChecked} onChange={e=>setConsentChecked(e.target.checked)}/><span>I understand and consent to sharing this data</span></label>
        </section>

        <Link href={allEligible&&consentChecked?`/loans/apply/${product_id}`:'#'} className={`btn btn-primary btn-large ${styles.applyBtn}`} style={{opacity:allEligible&&consentChecked?1:0.4,pointerEvents:allEligible&&consentChecked?'auto':'none'}}>Apply Now</Link>
      </main>
    </div>
  )
}
