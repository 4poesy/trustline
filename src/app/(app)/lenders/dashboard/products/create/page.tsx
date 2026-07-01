'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Save, AlertCircle, Calculator } from 'lucide-react'
import styles from './page.module.css'

export default function CreateLoanProductPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [lenderId, setLenderId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({
    name:'', description:'', minimum_amount:'', maximum_amount:'', interest_rate:'', interest_type:'flat',
    minimum_tenure_days:'30', maximum_tenure_days:'180', repayment_frequency:'monthly',
    collateral_required:false, collateral_description:'', minimum_trust_score:'30', minimum_kyc_tier:'1',
    minimum_months_active:'1', target_roles:['trader','service_provider','group_member'] as string[], processing_fee:'0',
  })

  const update = (k:string, v:any) => setForm({...form, [k]:v})
  const toggleRole = (r:string) => { const c=form.target_roles; if(c.includes(r)) update('target_roles',c.filter(x=>x!==r)); else update('target_roles',[...c,r]); }

  useEffect(() => {
    const f = async () => { if(!profile?.id) return; const {data}=await supabase.from('lender_admin_users').select('lender_id').eq('profile_id',profile.id).maybeSingle(); if(data) setLenderId(data.lender_id) }; f()
  }, [profile?.id])

  // Interest calculator helper
  const exampleAmount = 50000
  const rate = parseFloat(form.interest_rate) || 0
  const months = 3
  const exampleInterest = form.interest_type === 'flat' ? exampleAmount * (rate/100) * months : exampleAmount * (Math.pow(1+rate/100, months)-1)
  const exampleTotal = exampleAmount + exampleInterest

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); if(!lenderId||submitting) return; setSubmitting(true); setErrorMsg('')
    try {
      const { error } = await supabase.from('loan_products').insert({
        lender_id:lenderId, name:form.name.trim(), description:form.description.trim(),
        minimum_amount:parseFloat(form.minimum_amount), maximum_amount:parseFloat(form.maximum_amount),
        interest_rate:parseFloat(form.interest_rate), interest_type:form.interest_type,
        minimum_tenure_days:parseInt(form.minimum_tenure_days), maximum_tenure_days:parseInt(form.maximum_tenure_days),
        repayment_frequency:form.repayment_frequency, collateral_required:form.collateral_required,
        collateral_description:form.collateral_required?form.collateral_description.trim():null,
        minimum_trust_score:parseFloat(form.minimum_trust_score), minimum_kyc_tier:parseInt(form.minimum_kyc_tier),
        minimum_months_active:parseInt(form.minimum_months_active), target_user_roles:form.target_roles,
        processing_fee:parseFloat(form.processing_fee)||0, is_active:false,
      })
      if(error) throw error; router.replace('/lenders/dashboard/products')
    } catch(e:any) { setErrorMsg(e.message||'Failed to create product.') }
    finally { setSubmitting(false) }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/lenders/dashboard/products" className={styles.backButton}><ArrowLeft size={20} /></Link>
        <h1 className={styles.title}>New Product</h1><div style={{width:40}} />
      </div></header>
      <main className={styles.main}>
        {errorMsg&&<div className={styles.errorAlert}><AlertCircle size={16}/><span>{errorMsg}</span></div>}
        <form onSubmit={handleSubmit} className={`card ${styles.formCard}`}>
          <div className="form-group"><label className="form-label">Product Name *</label><input className="form-input" value={form.name} onChange={e=>update('name',e.target.value)} placeholder='e.g. Trader Quick Loan' required/></div>
          <div className="form-group" style={{marginTop:12}}><label className="form-label">Description *</label><textarea className="form-input" style={{minHeight:80,padding:10}} value={form.description} onChange={e=>update('description',e.target.value)} placeholder='What is this loan for? Who is it designed for?' required/></div>

          <div className={styles.row2} style={{marginTop:12}}>
            <div className="form-group"><label className="form-label">Min Amount (₦) *</label><input type="number" className="form-input" value={form.minimum_amount} onChange={e=>update('minimum_amount',e.target.value)} required/></div>
            <div className="form-group"><label className="form-label">Max Amount (₦) *</label><input type="number" className="form-input" value={form.maximum_amount} onChange={e=>update('maximum_amount',e.target.value)} required/></div>
          </div>

          <div className={styles.row2} style={{marginTop:12}}>
            <div className="form-group"><label className="form-label">Monthly Interest Rate (%) *</label><input type="number" step="0.1" className="form-input" value={form.interest_rate} onChange={e=>update('interest_rate',e.target.value)} required/></div>
            <div className="form-group"><label className="form-label">Interest Type *</label><select className="form-input" value={form.interest_type} onChange={e=>update('interest_type',e.target.value)}><option value="flat">Flat Rate</option><option value="reducing_balance">Reducing Balance</option></select></div>
          </div>

          {rate > 0 && <div className={styles.calcHelper}><Calculator size={16}/><span>Example: A ₦{exampleAmount.toLocaleString()} loan at {rate}% {form.interest_type} monthly for {months} months = ₦{Math.round(exampleInterest).toLocaleString()} interest, total ₦{Math.round(exampleTotal).toLocaleString()}</span></div>}

          <div className={styles.row2} style={{marginTop:12}}>
            <div className="form-group"><label className="form-label">Min Tenure (days)</label><input type="number" className="form-input" value={form.minimum_tenure_days} onChange={e=>update('minimum_tenure_days',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Max Tenure (days)</label><input type="number" className="form-input" value={form.maximum_tenure_days} onChange={e=>update('maximum_tenure_days',e.target.value)}/></div>
          </div>

          <div className="form-group" style={{marginTop:12}}><label className="form-label">Repayment Frequency</label>
            <select className="form-input" value={form.repayment_frequency} onChange={e=>update('repayment_frequency',e.target.value)}>
              <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="end_of_tenure">End of Tenure</option>
            </select></div>

          <label className={styles.checkRow} style={{marginTop:16}}><input type="checkbox" checked={form.collateral_required} onChange={e=>update('collateral_required',e.target.checked)}/><span>Collateral Required</span></label>
          {form.collateral_required&&<div className="form-group" style={{marginTop:8}}><input className="form-input" value={form.collateral_description} onChange={e=>update('collateral_description',e.target.value)} placeholder="Describe required collateral"/></div>}

          <h4 className={styles.subTitle}>Eligibility Criteria</h4>
          <div className={styles.row2}>
            <div className="form-group"><label className="form-label">Min Trust Score (0-100)</label><input type="range" min="0" max="100" value={form.minimum_trust_score} onChange={e=>update('minimum_trust_score',e.target.value)} className={styles.rangeInput}/><span className={styles.rangeVal}>{form.minimum_trust_score}</span></div>
            <div className="form-group"><label className="form-label">Min KYC Tier</label><select className="form-input" value={form.minimum_kyc_tier} onChange={e=>update('minimum_kyc_tier',e.target.value)}><option value="1">Tier 1</option><option value="2">Tier 2</option><option value="3">Tier 3</option></select></div>
          </div>
          <div className="form-group" style={{marginTop:12}}><label className="form-label">Min Months Active</label><input type="number" className="form-input" value={form.minimum_months_active} onChange={e=>update('minimum_months_active',e.target.value)}/></div>

          <div className="form-group" style={{marginTop:12}}><label className="form-label">Target User Roles</label>
            <div className={styles.chipRow}>
              {['trader','service_provider','group_member'].map(r=>(<label key={r} className={`${styles.chip} ${form.target_roles.includes(r)?styles.chipActive:''}`}><input type="checkbox" checked={form.target_roles.includes(r)} onChange={()=>toggleRole(r)} style={{display:'none'}}/>{r.replace('_',' ')}</label>))}
            </div></div>

          <div className="form-group" style={{marginTop:12}}><label className="form-label">Processing Fee (₦)</label><input type="number" className="form-input" value={form.processing_fee} onChange={e=>update('processing_fee',e.target.value)}/></div>

          <button type="submit" className="btn btn-primary btn-large" style={{marginTop:24}} disabled={submitting}><Save size={18} style={{marginRight:8}}/>{submitting?'Creating...':'Create Product'}</button>
        </form>
      </main>
    </div>
  )
}
