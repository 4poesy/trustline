'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Plus, CheckCircle, CreditCard } from 'lucide-react'
import styles from './page.module.css'

export default function LoanRepaymentsPage() {
  const { profile } = useAuth()
  const [loans, setLoans] = useState<any[]>([])
  const [repayments, setRepayments] = useState<Record<string,any[]>>({})
  const [showForm, setShowForm] = useState<string|null>(null)
  const [formData, setFormData] = useState({amount:'',payment_date:'',payment_method:'bank_transfer',provider_reference:''})
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const f = async () => { if(!profile?.id) return; try {
      const {data} = await supabase.from('loan_applications').select('*, loan_products(name,repayment_frequency), lenders(company_name)').eq('applicant_profile_id',profile.id).in('status',['disbursed','repaying']).order('disbursed_at',{ascending:false})
      const active = data||[]; setLoans(active)
      const repMap: Record<string,any[]> = {}
      for(const l of active) {
        const {data:reps} = await supabase.from('loan_repayments').select('*').eq('loan_application_id',l.id).order('payment_date',{ascending:false})
        repMap[l.id] = reps||[]
      }
      setRepayments(repMap)
    } catch(e){console.error(e)} finally{setLoading(false)} }; f()
  }, [profile?.id])

  const handleLogRepayment = async (appId:string) => {
    if(submitting) return; setSubmitting(true)
    try {
      const {error} = await supabase.from('loan_repayments').insert({
        loan_application_id:appId, amount:parseFloat(formData.amount),
        payment_date:formData.payment_date, payment_method:formData.payment_method,
        provider_reference:formData.provider_reference||null, recorded_by:'user',
      })
      if(error) throw error
      const {data:reps} = await supabase.from('loan_repayments').select('*').eq('loan_application_id',appId).order('payment_date',{ascending:false})
      setRepayments({...repayments,[appId]:reps||[]})
      setShowForm(null); setFormData({amount:'',payment_date:'',payment_method:'bank_transfer',provider_reference:''})
    } catch(e){console.error(e)} finally{setSubmitting(false)}
  }

  if(loading) return <div className={styles.loadingContainer}><span className="spinner"/><p>Loading repayments...</p></div>

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/loans/my-applications" className={styles.backButton}><ArrowLeft size={20}/></Link>
        <h1 className={styles.title}>Repayments</h1><div style={{width:40}}/>
      </div></header>
      <main className={styles.main}>
        {loans.length===0?<div className={styles.emptyCard}><CreditCard size={40} style={{color:'var(--color-neutral-300)'}}/><p>No active loans to repay.</p></div>:
        <div className={styles.loanList}>{loans.map(l=>(
          <div key={l.id} className={`card ${styles.loanCard}`}>
            <div className={styles.loanTop}>
              <div><h3>{l.loan_products?.name}</h3><span className={styles.lenderName}>{l.lenders?.company_name}</span></div>
              <div className={styles.loanAmount}>₦{Number(l.approved_amount||l.requested_amount).toLocaleString()}</div>
            </div>
            <div className={styles.loanMeta}>
              <span>Disbursed: {l.disbursed_at?new Date(l.disbursed_at).toLocaleDateString('en-NG',{month:'short',day:'numeric'}):'-'}</span>
              {l.expected_repayment_date&&<span>Due: {new Date(l.expected_repayment_date).toLocaleDateString('en-NG',{month:'short',day:'numeric',year:'numeric'})}</span>}
            </div>

            {(repayments[l.id]||[]).length>0&&<div className={styles.repHistory}>
              <h4>Repayment History</h4>
              {(repayments[l.id]).map(r=>(
                <div key={r.id} className={styles.repRow}>
                  <div><CheckCircle size={14} style={{color:'#059669'}}/><span>₦{Number(r.amount).toLocaleString()}</span></div>
                  <span className={styles.repDate}>{new Date(r.payment_date).toLocaleDateString('en-NG',{month:'short',day:'numeric'})} · {r.payment_method.replace('_',' ')}</span>
                </div>
              ))}
            </div>}

            {showForm===l.id?<div className={styles.repForm}>
              <h4>Log a Repayment</h4>
              <div className={styles.row2}>
                <div className="form-group"><label className="form-label">Amount (₦)</label><input type="number" className="form-input" value={formData.amount} onChange={e=>setFormData({...formData,amount:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={formData.payment_date} onChange={e=>setFormData({...formData,payment_date:e.target.value})}/></div>
              </div>
              <div className="form-group" style={{marginTop:8}}><label className="form-label">Method</label>
                <select className="form-input" value={formData.payment_method} onChange={e=>setFormData({...formData,payment_method:e.target.value})}>
                  <option value="bank_transfer">Bank Transfer</option><option value="ussd">USSD</option><option value="cash">Cash</option><option value="trustline_p2p">Trustline P2P</option>
                </select></div>
              <div className="form-group" style={{marginTop:8}}><label className="form-label">Reference (optional)</label><input className="form-input" value={formData.provider_reference} onChange={e=>setFormData({...formData,provider_reference:e.target.value})}/></div>
              <div className={styles.formActions}>
                <button className="btn btn-secondary" onClick={()=>setShowForm(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={()=>handleLogRepayment(l.id)} disabled={submitting||!formData.amount||!formData.payment_date}>{submitting?'Saving...':'Log Repayment'}</button>
              </div>
            </div>:
            <button className={styles.logBtn} onClick={()=>setShowForm(l.id)}><Plus size={16}/> Log a Repayment</button>}
          </div>
        ))}</div>}
      </main>
    </div>
  )
}
