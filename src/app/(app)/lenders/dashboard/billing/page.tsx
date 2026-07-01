'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Receipt } from 'lucide-react'
import styles from './page.module.css'

const STATUS_COLORS: Record<string,string> = { draft:'#f59e0b', sent:'#3b82f6', paid:'#059669' }

export default function LenderBillingPage() {
  const { profile } = useAuth()
  const [invoices, setInvoices] = useState<any[]>([])
  const [summary, setSummary] = useState({totalOwed:0, totalPaid:0})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const f = async () => { if(!profile?.id) return; try {
      const {data:admin} = await supabase.from('lender_admin_users').select('lender_id').eq('profile_id',profile.id).maybeSingle()
      if(!admin){setLoading(false);return}
      const {data} = await supabase.from('lender_invoices').select('*').eq('lender_id',admin.lender_id).order('created_at',{ascending:false})
      const inv = data||[]
      setInvoices(inv)
      setSummary({ totalOwed:inv.filter(i=>i.status!=='paid').reduce((s,i)=>s+Number(i.total_amount),0), totalPaid:inv.filter(i=>i.status==='paid').reduce((s,i)=>s+Number(i.total_amount),0) })
    } catch(e){console.error(e)} finally{setLoading(false)} }; f()
  }, [profile?.id])

  if(loading) return <div className={styles.loadingContainer}><span className="spinner"/><p>Loading billing...</p></div>

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/lenders/dashboard" className={styles.backButton}><ArrowLeft size={20}/></Link>
        <h1 className={styles.title}>Billing</h1><div style={{width:40}}/>
      </div></header>
      <main className={styles.main}>
        <div className={styles.sumGrid}>
          <div className={`card ${styles.sumCard}`}><span className={styles.sumLabel}>Outstanding</span><span className={styles.sumVal} style={{color:'#f59e0b'}}>₦{summary.totalOwed.toLocaleString()}</span></div>
          <div className={`card ${styles.sumCard}`}><span className={styles.sumLabel}>Total Paid</span><span className={styles.sumVal} style={{color:'#059669'}}>₦{summary.totalPaid.toLocaleString()}</span></div>
        </div>
        <h2 className={styles.subHead}>Invoice History</h2>
        {invoices.length===0?<div className={styles.emptyCard}><Receipt size={32} style={{color:'var(--color-neutral-300)'}}/><p>No invoices yet. Fees are invoiced monthly after loan disbursements.</p></div>:
        <div className={styles.invoiceList}>{invoices.map(inv=>(
          <div key={inv.id} className={`card ${styles.invoiceCard}`}>
            <div className={styles.invHeader}><h3>{inv.invoice_number}</h3><span className={styles.invBadge} style={{background:`${STATUS_COLORS[inv.status]}22`,color:STATUS_COLORS[inv.status]}}>{inv.status}</span></div>
            <div className={styles.invMeta}>
              <span>Period: {new Date(inv.period_start).toLocaleDateString('en-NG',{month:'short',day:'numeric'})} – {new Date(inv.period_end).toLocaleDateString('en-NG',{month:'short',day:'numeric',year:'numeric'})}</span>
              <span>Due: {new Date(inv.due_date).toLocaleDateString('en-NG',{month:'short',day:'numeric',year:'numeric'})}</span>
            </div>
            <div className={styles.invAmount}>₦{Number(inv.total_amount).toLocaleString()}</div>
          </div>
        ))}</div>}
      </main>
    </div>
  )
}
