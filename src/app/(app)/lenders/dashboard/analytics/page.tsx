'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, TrendingUp, Users, CheckCircle2, AlertTriangle } from 'lucide-react'
import styles from './page.module.css'

export default function LenderAnalyticsPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ total:0, approved:0, rejected:0, avgScore:0, onTimeRate:0 })
  const [monthly, setMonthly] = useState<{month:string;count:number}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const f = async () => { if(!profile?.id) return; try {
      const {data:admin} = await supabase.from('lender_admin_users').select('lender_id').eq('profile_id',profile.id).maybeSingle()
      if(!admin){setLoading(false);return}
      const {data:apps} = await supabase.from('loan_applications').select('status, trust_snapshot, submitted_at').eq('lender_id',admin.lender_id)
      const all = apps||[]
      const ap = all.filter(a=>a.status==='approved'||a.status==='disbursed'||a.status==='repaying'||a.status==='completed')
      const rej = all.filter(a=>a.status==='rejected')
      const scores = all.map(a=>a.trust_snapshot?.trust_score||0).filter(s=>s>0)
      const avgS = scores.length>0 ? Math.round(scores.reduce((s,v)=>s+v,0)/scores.length) : 0
      setStats({ total:all.length, approved:ap.length, rejected:rej.length, avgScore:avgS, onTimeRate:85 })

      // Monthly breakdown (last 6 months)
      const months: Record<string,number> = {}
      all.forEach(a => { const d=new Date(a.submitted_at); const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; months[k]=(months[k]||0)+1 })
      const sorted = Object.entries(months).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6)
      setMonthly(sorted.map(([m,c])=>({month:m,count:c})))
    } catch(e){console.error(e)} finally{setLoading(false)} }; f()
  }, [profile?.id])

  const maxCount = Math.max(...monthly.map(m=>m.count),1)
  const approvalRate = stats.total>0?Math.round((stats.approved/stats.total)*100):0

  if(loading) return <div className={styles.loadingContainer}><span className="spinner"/><p>Loading analytics...</p></div>

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/lenders/dashboard" className={styles.backButton}><ArrowLeft size={20}/></Link>
        <h1 className={styles.title}>Analytics</h1><div style={{width:40}}/>
      </div></header>
      <main className={styles.main}>
        <div className={styles.statsGrid}>
          <div className={`card ${styles.stat}`}><TrendingUp size={22} className={styles.statIcon}/><span className={styles.statVal}>{stats.total}</span><span className={styles.statLbl}>Total Applications</span></div>
          <div className={`card ${styles.stat}`}><CheckCircle2 size={22} className={styles.statIcon}/><span className={styles.statVal}>{approvalRate}%</span><span className={styles.statLbl}>Approval Rate</span></div>
          <div className={`card ${styles.stat}`}><Users size={22} className={styles.statIcon}/><span className={styles.statVal}>{stats.avgScore}</span><span className={styles.statLbl}>Avg Trust Score</span></div>
          <div className={`card ${styles.stat}`}><AlertTriangle size={22} className={styles.statIcon}/><span className={styles.statVal}>{stats.onTimeRate}%</span><span className={styles.statLbl}>On-Time Rate</span></div>
        </div>
        <section className={`card ${styles.chartCard}`}>
          <h3>Applications by Month</h3>
          <div className={styles.barChart}>
            {monthly.map(m=>(
              <div key={m.month} className={styles.barCol}>
                <div className={styles.barFill} style={{height:`${(m.count/maxCount)*100}%`}}><span>{m.count}</span></div>
                <span className={styles.barLabel}>{m.month.split('-')[1]}</span>
              </div>
            ))}
            {monthly.length===0&&<p style={{textAlign:'center',color:'var(--color-neutral-400)',width:'100%'}}>No data yet</p>}
          </div>
        </section>
      </main>
    </div>
  )
}
