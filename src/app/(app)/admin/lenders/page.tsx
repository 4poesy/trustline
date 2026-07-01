'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle, XCircle, Ban, RotateCcw } from 'lucide-react'
import styles from './page.module.css'

const STATUS_COLORS: Record<string,string> = { pending_review:'#f59e0b', approved:'#059669', suspended:'#dc2626', rejected:'#6b7280' }

export default function AdminLendersPage() {
  const [lenders, setLenders] = useState<any[]>([])
  const [filter, setFilter] = useState('pending_review')
  const [loading, setLoading] = useState(true)
  const [rejectId, setRejectId] = useState<string|null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const f = async () => { try {
      const {data} = await supabase.from('lenders').select('*, loan_products(id), loan_applications(id)').order('created_at',{ascending:false})
      if(data) setLenders(data)
    } catch(e){console.error(e)} finally{setLoading(false)} }; f()
  }, [])

  const filtered = lenders.filter(l=>l.status===filter)

  const handleApprove = async (id:string) => {
    await supabase.from('lenders').update({status:'approved',verified_at:new Date().toISOString()}).eq('id',id)
    setLenders(lenders.map(l=>l.id===id?{...l,status:'approved',verified_at:new Date().toISOString()}:l))
  }

  const handleReject = async (id:string) => {
    if(!rejectReason.trim()) return
    await supabase.from('lenders').update({status:'rejected',rejection_reason:rejectReason.trim()}).eq('id',id)
    setLenders(lenders.map(l=>l.id===id?{...l,status:'rejected',rejection_reason:rejectReason}:l))
    setRejectId(null); setRejectReason('')
  }

  const handleSuspend = async (id:string) => {
    await supabase.from('lenders').update({status:'suspended'}).eq('id',id)
    setLenders(lenders.map(l=>l.id===id?{...l,status:'suspended'}:l))
  }

  const handleReinstate = async (id:string) => {
    await supabase.from('lenders').update({status:'approved'}).eq('id',id)
    setLenders(lenders.map(l=>l.id===id?{...l,status:'approved'}:l))
  }

  if(loading) return <div className={styles.loadingContainer}><span className="spinner"/><p>Loading lenders...</p></div>

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/admin" className={styles.backButton}><ArrowLeft size={20}/></Link>
        <h1 className={styles.title}>Manage Lenders</h1><div style={{width:40}}/>
      </div></header>
      <main className={styles.main}>
        <div className={styles.filterRow}>
          {['pending_review','approved','suspended','rejected'].map(s=>(<button key={s} className={`${styles.filterBtn} ${filter===s?styles.filterActive:''}`} onClick={()=>setFilter(s)}>{s.replace('_',' ')} ({lenders.filter(l=>l.status===s).length})</button>))}
        </div>
        {filtered.length===0?<div className={styles.emptyCard}><p>No lenders in this category.</p></div>:
        <div className={styles.lenderList}>{filtered.map(l=>(
          <div key={l.id} className={`card ${styles.lenderCard}`}>
            <div className={styles.lenderHeader}>
              <h3>{l.company_name}</h3>
              <span className={styles.typeBadge}>{l.company_type.replace('_',' ')}</span>
            </div>
            <div className={styles.lenderMeta}>
              <span>📋 {l.registration_number}</span>
              <span>📍 {l.headquarters_location}</span>
              <span>✉️ {l.contact_email}</span>
              <span>Registered: {new Date(l.created_at).toLocaleDateString('en-NG',{month:'short',day:'numeric',year:'numeric'})}</span>
              <span>Products: {l.loan_products?.length||0} · Applications: {l.loan_applications?.length||0}</span>
            </div>

            {l.status==='pending_review'&&<div className={styles.actionRow}>
              <button className={`btn btn-primary ${styles.actionBtn}`} onClick={()=>handleApprove(l.id)}><CheckCircle size={16}/> Approve</button>
              {rejectId===l.id?<div className={styles.rejectForm}>
                <textarea className="form-input" style={{minHeight:60,padding:10}} placeholder="Rejection reason (required)" value={rejectReason} onChange={e=>setRejectReason(e.target.value)}/>
                <div style={{display:'flex',gap:8,marginTop:8}}><button className="btn btn-secondary" onClick={()=>setRejectId(null)}>Cancel</button><button className="btn btn-primary" style={{background:'#dc2626'}} onClick={()=>handleReject(l.id)}>Confirm Reject</button></div>
              </div>:<button className={`btn btn-secondary ${styles.actionBtn}`} style={{color:'#dc2626'}} onClick={()=>setRejectId(l.id)}><XCircle size={16}/> Reject</button>}
            </div>}

            {l.status==='approved'&&<div className={styles.actionRow}><button className={`btn btn-secondary ${styles.actionBtn}`} style={{color:'#dc2626'}} onClick={()=>handleSuspend(l.id)}><Ban size={16}/> Suspend</button></div>}
            {l.status==='suspended'&&<div className={styles.actionRow}><button className={`btn btn-primary ${styles.actionBtn}`} onClick={()=>handleReinstate(l.id)}><RotateCcw size={16}/> Reinstate</button></div>}
          </div>
        ))}</div>}
      </main>
    </div>
  )
}
