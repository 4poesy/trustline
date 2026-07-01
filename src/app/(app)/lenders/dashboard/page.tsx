'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Package, FileText, BarChart3, CreditCard, AlertCircle } from 'lucide-react'
import styles from './page.module.css'

export default function LenderDashboardPage() {
  const { profile } = useAuth()
  const [lender, setLender] = useState<any>(null)
  const [stats, setStats] = useState({ products: 0, applications: 0, pending: 0, approved: 0, disbursed: 0, feesOwed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      if (!profile?.id) return
      try {
        const { data: admin } = await supabase.from('lender_admin_users').select('lender_id, role').eq('profile_id', profile.id).maybeSingle()
        if (!admin) { setLoading(false); return }
        const { data: l } = await supabase.from('lenders').select('*').eq('id', admin.lender_id).single()
        if (l) setLender(l)

        const { count: pCount } = await supabase.from('loan_products').select('id', { count: 'exact', head: true }).eq('lender_id', admin.lender_id)
        const { data: apps } = await supabase.from('loan_applications').select('status, trustline_fee_amount, trustline_fee_status').eq('lender_id', admin.lender_id)
        const allApps = apps || []
        setStats({
          products: pCount || 0, applications: allApps.length,
          pending: allApps.filter(a => a.status === 'submitted' || a.status === 'under_review').length,
          approved: allApps.filter(a => a.status === 'approved').length,
          disbursed: allApps.filter(a => ['disbursed','repaying','completed'].includes(a.status)).length,
          feesOwed: allApps.filter(a => a.trustline_fee_status === 'pending' || a.trustline_fee_status === 'invoiced').reduce((s, a) => s + Number(a.trustline_fee_amount || 0), 0),
        })
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetch()
  }, [profile?.id])

  if (loading) return <div className={styles.loadingContainer}><span className="spinner" /><p>Loading dashboard...</p></div>

  if (!lender) return (
    <div className={styles.page}><main className={styles.emptyMain}>
      <AlertCircle size={48} style={{color:'var(--color-neutral-400)'}} />
      <h2>No Lender Account Found</h2>
      <p>Register your organization to start listing loan products.</p>
      <Link href="/lenders/register" className="btn btn-primary" style={{marginTop:16}}>Register Now</Link>
    </main></div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/dashboard" className={styles.backButton}><ArrowLeft size={20} /></Link>
        <h1 className={styles.title}>Lender Hub</h1>
        <div style={{width:40}} />
      </div></header>

      <main className={styles.main}>
        <div className={styles.lenderInfo}>
          <h2>{lender.company_name}</h2>
          <span className={`${styles.statusBadge} ${lender.status === 'approved' ? styles.approved : styles.pending}`}>{lender.status.replace('_',' ').toUpperCase()}</span>
        </div>

        <div className={styles.statsGrid}>
          <div className={`card ${styles.statCard}`}><span className={styles.statValue}>{stats.products}</span><span className={styles.statLabel}>Products</span></div>
          <div className={`card ${styles.statCard}`}><span className={styles.statValue}>{stats.applications}</span><span className={styles.statLabel}>Applications</span></div>
          <div className={`card ${styles.statCard}`}><span className={styles.statValue}>{stats.disbursed}</span><span className={styles.statLabel}>Disbursed</span></div>
          <div className={`card ${styles.statCard}`}><span className={styles.statValue}>₦{stats.feesOwed.toLocaleString()}</span><span className={styles.statLabel}>Fees Owed</span></div>
        </div>

        <div className={styles.linksGrid}>
          <Link href="/lenders/dashboard/products" className={`card ${styles.linkCard}`}><Package size={28} className={styles.linkIcon} /><h3>Products</h3><p>Manage loan listings</p></Link>
          <Link href="/lenders/dashboard/applications" className={`card ${styles.linkCard}`}><FileText size={28} className={styles.linkIcon} /><h3>Applications</h3><p>Review borrower requests</p></Link>
          <Link href="/lenders/dashboard/analytics" className={`card ${styles.linkCard}`}><BarChart3 size={28} className={styles.linkIcon} /><h3>Analytics</h3><p>Performance insights</p></Link>
          <Link href="/lenders/dashboard/billing" className={`card ${styles.linkCard}`}><CreditCard size={28} className={styles.linkIcon} /><h3>Billing</h3><p>Invoices & fees</p></Link>
        </div>
      </main>
    </div>
  )
}
