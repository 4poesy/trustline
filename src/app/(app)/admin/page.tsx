'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { Shield, Building2, FileText, DollarSign, Settings } from 'lucide-react'
import styles from './page.module.css'

export default function AdminPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({lenders:0, pending:0, totalApps:0, totalDisbursed:0, totalFees:0})
  const [recentApps, setRecentApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const f = async () => { try {
      const {count:lCount} = await supabase.from('lenders').select('id',{count:'exact',head:true})
      const {count:pCount} = await supabase.from('lenders').select('id',{count:'exact',head:true}).eq('status','pending_review')
      const {data:apps} = await supabase.from('loan_applications').select('status, requested_amount, approved_amount, trustline_fee_amount, trustline_fee_status')
      const allApps = apps||[]
      const disbursed = allApps.filter(a=>['disbursed','repaying','completed'].includes(a.status))
      const totalDis = disbursed.reduce((s,a)=>s+Number(a.approved_amount||a.requested_amount),0)
      const totalF = allApps.filter(a=>a.trustline_fee_status&&a.trustline_fee_status!=='pending').reduce((s,a)=>s+Number(a.trustline_fee_amount||0),0)

      setStats({lenders:lCount||0,pending:pCount||0,totalApps:allApps.length,totalDisbursed:totalDis,totalFees:totalF})

      const {data:recent} = await supabase.from('loan_applications').select('id,requested_amount,status,submitted_at,loan_products(name)').order('submitted_at',{ascending:false}).limit(5)
      setRecentApps(recent||[])
    } catch(e){console.error(e)} finally{setLoading(false)} }; f()
  }, [])

  if(loading) return <div className={styles.loadingContainer}><span className="spinner"/><p>Loading admin...</p></div>

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Shield size={22}/>
        <h1 className={styles.title}>Trustline Admin</h1><div style={{width:40}}/>
      </div></header>
      <main className={styles.main}>
        <div className={styles.statsGrid}>
          <div className={`card ${styles.stat}`}><Building2 size={20} className={styles.statIcon}/><span className={styles.statVal}>{stats.lenders}</span><span className={styles.statLbl}>Total Lenders</span></div>
          <div className={`card ${styles.stat}`} style={{borderColor:stats.pending>0?'#f59e0b':'var(--color-neutral-200)'}}><span className={styles.statVal} style={{color:stats.pending>0?'#f59e0b':'var(--color-neutral-900)'}}>{stats.pending}</span><span className={styles.statLbl}>Pending Review</span></div>
          <div className={`card ${styles.stat}`}><FileText size={20} className={styles.statIcon}/><span className={styles.statVal}>{stats.totalApps}</span><span className={styles.statLbl}>Loan Apps</span></div>
          <div className={`card ${styles.stat}`}><DollarSign size={20} className={styles.statIcon}/><span className={styles.statVal}>₦{stats.totalFees.toLocaleString()}</span><span className={styles.statLbl}>Fees Earned</span></div>
        </div>

        <div className={styles.linksRow}>
          <Link href="/admin/lenders" className={`card ${styles.linkCard}`}><Building2 size={24} className={styles.lIcon}/><span>Manage Lenders</span></Link>
          <Link href="/admin/marketplace-config" className={`card ${styles.linkCard}`}><Settings size={24} className={styles.lIcon}/><span>Marketplace Config</span></Link>
        </div>

        <section className={`card ${styles.recentCard}`}>
          <h3>Recent Applications</h3>
          {recentApps.length===0?<p style={{color:'var(--color-neutral-400)',fontSize:'var(--font-size-sm)'}}>No applications yet.</p>:
          <div className={styles.recentList}>{recentApps.map(a=>(
            <div key={a.id} className={styles.recentRow}>
              <div><span className={styles.recentProd}>{a.loan_products?.name||'Loan'}</span><span className={styles.recentDate}>{new Date(a.submitted_at).toLocaleDateString('en-NG',{month:'short',day:'numeric'})}</span></div>
              <div className={styles.recentRight}><span>₦{Number(a.requested_amount).toLocaleString()}</span><span className={styles.recentStatus} style={{color:a.status==='submitted'?'#3b82f6':a.status==='approved'?'#059669':'var(--color-neutral-500)'}}>{a.status}</span></div>
            </div>
          ))}</div>}
        </section>
      </main>
    </div>
  )
}
