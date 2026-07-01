'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import styles from './page.module.css'

const SC: Record<string,string> = { submitted:'#3b82f6', under_review:'#f59e0b', approved:'#059669', rejected:'#dc2626', disbursed:'#7c3aed', repaying:'#d97706', completed:'#047857', defaulted:'#991b1b' }

export default function MyApplicationsPage() {
  const { profile } = useAuth()
  const [apps, setApps] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const f = async () => { if(!profile?.id) return; try {
      const {data} = await supabase.from('loan_applications').select('*, loan_products(name,interest_rate,interest_type,repayment_frequency), lenders(company_name)').eq('applicant_profile_id',profile.id).order('submitted_at',{ascending:false})
      if(data) setApps(data)
    } catch(e){console.error(e)} finally{setLoading(false)} }; f()
  }, [profile?.id])

  const handleAccept = async (id:string) => {
    await supabase.from('loan_applications').update({status:'disbursed',disbursed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id)
    setApps(apps.map(a=>a.id===id?{...a,status:'disbursed',disbursed_at:new Date().toISOString()}:a))
  }

  if(loading) return <div className={styles.loadingContainer}><span className="spinner"/><p>Loading applications...</p></div>

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/loans" className={styles.backButton}><ArrowLeft size={20}/></Link>
        <h1 className={styles.title}>My Applications</h1><div style={{width:40}}/>
      </div></header>
      <main className={styles.main}>
        {apps.length===0?<div className={styles.emptyCard}><p>No loan applications yet. <Link href="/loans" style={{color:'var(--color-primary-500)',fontWeight:700}}>Browse loan offers</Link></p></div>:
        <div className={styles.appList}>{apps.map(a=>{
          const isOpen=expandedId===a.id; const snap=a.trust_snapshot||{}
          return (<div key={a.id} className={`card ${styles.appCard}`}>
            <button className={styles.appHeader} onClick={()=>setExpandedId(isOpen?null:a.id)}>
              <div className={styles.appLeft}>
                <h3>{a.loan_products?.name||'Loan'}</h3>
                <span className={styles.appLender}>{a.lenders?.company_name}</span>
                <span className={styles.appDate}>₦{Number(a.requested_amount).toLocaleString()} · {new Date(a.submitted_at).toLocaleDateString('en-NG',{month:'short',day:'numeric',year:'numeric'})}</span>
              </div>
              <div className={styles.appRight}>
                <span className={styles.statusBadge} style={{background:`${SC[a.status]||'#999'}22`,color:SC[a.status]||'#999'}}>{a.status.replace('_',' ')}</span>
                {isOpen?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
              </div>
            </button>
            {isOpen&&<div className={styles.appBody}>
              <div className={styles.detailGrid}>
                <div><span>Requested</span><strong>₦{Number(a.requested_amount).toLocaleString()}</strong></div>
                <div><span>Tenure</span><strong>{a.requested_tenure_days} days</strong></div>
                <div><span>Trust Score</span><strong>{snap.trust_score||'--'}</strong></div>
                <div><span>KYC Tier</span><strong>{a.kyc_tier_at_application||'--'}</strong></div>
              </div>
              <p className={styles.purposeText}><strong>Purpose:</strong> {a.purpose}</p>

              {a.status==='rejected'&&a.rejection_reason&&<div className={styles.rejectionBox}><strong>Rejection reason:</strong> {a.rejection_reason}</div>}

              {a.status==='approved'&&<div className={styles.approvedBox}>
                <h4>Offer from {a.lenders?.company_name}</h4>
                <div className={styles.offerGrid}>
                  <div><span>Approved Amount</span><strong>₦{Number(a.approved_amount||0).toLocaleString()}</strong></div>
                  <div><span>Tenure</span><strong>{a.approved_tenure_days||'--'} days</strong></div>
                  <div><span>Final Rate</span><strong>{a.approved_interest_rate||'--'}%/mo</strong></div>
                </div>
                <button className="btn btn-primary" style={{marginTop:12,width:'100%'}} onClick={()=>handleAccept(a.id)}><CheckCircle size={16} style={{marginRight:6}}/> Accept Offer</button>
              </div>}

              {['disbursed','repaying'].includes(a.status)&&<div className={styles.disbursedBox}>
                <p>Loan active since {a.disbursed_at?new Date(a.disbursed_at).toLocaleDateString('en-NG',{month:'long',day:'numeric',year:'numeric'}):'--'}</p>
                <Link href="/loans/repayments" className="btn btn-secondary" style={{marginTop:8}}>Manage Repayments</Link>
              </div>}
            </div>}
          </div>)
        })}</div>}
      </main>
    </div>
  )
}
