'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import styles from './page.module.css'

const STATUS_COLORS: Record<string,string> = { submitted:'#3b82f6', under_review:'#f59e0b', approved:'#059669', rejected:'#dc2626', disbursed:'#7c3aed', repaying:'#d97706', completed:'#047857', defaulted:'#991b1b' }

export default function LenderApplicationsPage() {
  const { profile } = useAuth()
  const [apps, setApps] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [actionData, setActionData] = useState<any>({})

  useEffect(() => {
    const f = async () => { if(!profile?.id) return; try {
      const {data:admin} = await supabase.from('lender_admin_users').select('lender_id').eq('profile_id',profile.id).maybeSingle()
      if(!admin){setLoading(false);return}
      const {data} = await supabase.from('loan_applications').select('*, loan_products(name)').eq('lender_id',admin.lender_id).order('submitted_at',{ascending:false})
      if(data) setApps(data)
    } catch(e){console.error(e)} finally{setLoading(false)} }; f()
  }, [profile?.id])

  const filtered = filter==='all' ? apps : apps.filter(a=>a.status===filter)

  const handleApprove = async (id:string) => {
    const d = actionData[id] || {}
    if(!d.approved_amount) return
    await supabase.from('loan_applications').update({ status:'approved', approved_amount:parseFloat(d.approved_amount), approved_tenure_days:parseInt(d.approved_tenure_days||'0'), approved_interest_rate:parseFloat(d.approved_interest_rate||'0'), updated_at:new Date().toISOString() }).eq('id',id)
    setApps(apps.map(a=>a.id===id?{...a,status:'approved',approved_amount:d.approved_amount}:a))
    setExpandedId(null)
  }

  const handleReject = async (id:string) => {
    const d = actionData[id] || {}
    if(!d.rejection_reason) return
    await supabase.from('loan_applications').update({ status:'rejected', rejection_reason:d.rejection_reason, updated_at:new Date().toISOString() }).eq('id',id)
    setApps(apps.map(a=>a.id===id?{...a,status:'rejected'}:a))
    setExpandedId(null)
  }

  const updateAction = (id:string,key:string,val:string) => setActionData({...actionData,[id]:{...actionData[id],[key]:val}})

  if(loading) return <div className={styles.loadingContainer}><span className="spinner"/><p>Loading applications...</p></div>

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/lenders/dashboard" className={styles.backButton}><ArrowLeft size={20}/></Link>
        <h1 className={styles.title}>Applications</h1><div style={{width:40}}/>
      </div></header>
      <main className={styles.main}>
        <div className={styles.filterRow}>
          {['all','submitted','approved','rejected','disbursed'].map(s=>(<button key={s} className={`${styles.filterBtn} ${filter===s?styles.filterActive:''}`} onClick={()=>setFilter(s)}>{s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)}</button>))}
        </div>
        {filtered.length===0?<div className={styles.emptyCard}><p>No applications found.</p></div>:
        <div className={styles.appList}>{filtered.map(a=>{
          const snap = a.trust_snapshot||{}; const isOpen=expandedId===a.id
          return (<div key={a.id} className={`card ${styles.appCard}`}>
            <button className={styles.appHeader} onClick={()=>setExpandedId(isOpen?null:a.id)}>
              <div className={styles.appInfo}>
                <h3>{a.loan_products?.name||'Loan'}</h3>
                <p>₦{Number(a.requested_amount).toLocaleString()} · {new Date(a.submitted_at).toLocaleDateString('en-NG',{month:'short',day:'numeric'})}</p>
              </div>
              <div className={styles.appRight}>
                <span className={styles.statusBadge} style={{background:`${STATUS_COLORS[a.status]||'#999'}22`,color:STATUS_COLORS[a.status]||'#999'}}>{a.status.replace('_',' ')}</span>
                {isOpen?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
              </div>
            </button>
            {isOpen&&<div className={styles.appBody}>
              <div className={styles.snapGrid}>
                <div><span>Trust Score</span><strong>{snap.trust_score||'--'}</strong></div>
                <div><span>KYC Tier</span><strong>{a.kyc_tier_at_application||'--'}</strong></div>
                <div><span>6mo Income</span><strong>₦{Number(snap.income_summary_6m?.total||0).toLocaleString()}</strong></div>
                <div><span>Months Active</span><strong>{snap.months_active||'--'}</strong></div>
              </div>
              <p className={styles.purpose}><strong>Purpose:</strong> {a.purpose}</p>

              {a.status==='submitted'&&<div className={styles.actionSection}>
                <h4 style={{color:'#059669'}}>Approve</h4>
                <div className={styles.row2}>
                  <input className="form-input" placeholder="Approved Amount" type="number" value={actionData[a.id]?.approved_amount||''} onChange={e=>updateAction(a.id,'approved_amount',e.target.value)}/>
                  <input className="form-input" placeholder="Tenure (days)" type="number" value={actionData[a.id]?.approved_tenure_days||''} onChange={e=>updateAction(a.id,'approved_tenure_days',e.target.value)}/>
                </div>
                <input className="form-input" placeholder="Final Interest Rate (%)" type="number" step="0.1" value={actionData[a.id]?.approved_interest_rate||''} onChange={e=>updateAction(a.id,'approved_interest_rate',e.target.value)} style={{marginTop:8}}/>
                <button className="btn btn-primary" style={{marginTop:8}} onClick={()=>handleApprove(a.id)}><CheckCircle size={16} style={{marginRight:4}}/> Approve</button>

                <h4 style={{color:'#dc2626',marginTop:16}}>Reject</h4>
                <textarea className="form-input" style={{minHeight:60,padding:10}} placeholder="Rejection reason (required, shown to applicant)" value={actionData[a.id]?.rejection_reason||''} onChange={e=>updateAction(a.id,'rejection_reason',e.target.value)}/>
                <button className="btn btn-secondary" style={{marginTop:8,color:'#dc2626'}} onClick={()=>handleReject(a.id)}><XCircle size={16} style={{marginRight:4}}/> Reject</button>
              </div>}

              {a.status==='rejected'&&a.rejection_reason&&<p className={styles.rejectionNote}><strong>Rejection Reason:</strong> {a.rejection_reason}</p>}
            </div>}
          </div>)
        })}</div>}
      </main>
    </div>
  )
}
