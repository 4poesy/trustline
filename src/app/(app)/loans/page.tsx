'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Shield, Star, Search, BadgeCheck } from 'lucide-react'
import styles from './page.module.css'

export default function LoanDiscoveryPage() {
  const { profile } = useAuth()
  const [kycTier, setKycTier] = useState<number|null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const f = async () => { if(!profile?.id) return; try {
      const {data:kyc} = await supabase.from('kyc_profiles').select('tier').eq('profile_id',profile.id).maybeSingle()
      const tier = kyc?.tier || 0; setKycTier(tier)
      if(tier < 1) { setLoading(false); return }

      const {data:prods} = await supabase.from('loan_products').select('*, lenders!inner(id,company_name,company_type,logo_url,status,operating_regions,cbn_license_number)').eq('is_active',true).eq('lenders.status','approved').order('is_featured',{ascending:false}).order('interest_rate',{ascending:true})

      const months = Math.floor((Date.now() - new Date(profile.created_at).getTime())/(30*24*60*60*1000))
      const score = (profile as any).trust_score || 0

      const matched = (prods||[]).filter(p=>{
        if(tier < p.minimum_kyc_tier) return false
        if(score < p.minimum_trust_score) return false
        if(months < p.minimum_months_active) return false
        const roles = p.target_user_roles||[]
        if(Array.isArray(roles) && !roles.includes(profile.role)) return false
        return true
      }).map(p=>{
        const rate = Number(p.interest_rate)
        const apr = p.interest_type==='flat' ? rate*12 : (Math.pow(1+rate/100,12)-1)*100
        return { ...p, apr: Math.round(apr*100)/100 }
      })
      setProducts(matched)
    } catch(e){console.error(e)} finally{setLoading(false)} }; f()
  }, [profile?.id])

  if(loading) return <div className={styles.loadingContainer}><span className="spinner"/><p>Finding loans for you...</p></div>

  if(kycTier !== null && kycTier < 1) return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/dashboard" className={styles.backButton}><ArrowLeft size={20}/></Link>
        <h1 className={styles.title}>Loan Offers</h1><div style={{width:40}}/>
      </div></header>
      <main className={styles.gateContainer}>
        <div className={styles.gateCard}>
          <Shield size={56} className={styles.gateIcon}/>
          <h2>Verify Your Identity</h2>
          <p>Complete identity verification to access loan offers from licensed lenders. It takes just 2 minutes.</p>
          <Link href="/verify-identity" className="btn btn-primary btn-large" style={{marginTop:16}}>Verify Now</Link>
        </div>
      </main>
    </div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/dashboard" className={styles.backButton}><ArrowLeft size={20}/></Link>
        <h1 className={styles.title}>Loan Offers</h1><div style={{width:40}}/>
      </div></header>
      <main className={styles.main}>
        <div className={styles.topBar}>
          <span className={styles.resultCount}>{products.length} loan{products.length!==1?'s':''} matched to your profile</span>
          <Link href="/loans/my-applications" className={styles.myAppsLink}>My Applications</Link>
        </div>
        {products.length===0?<div className={styles.emptyCard}><Search size={40} style={{color:'var(--color-neutral-300)'}}/><p>No matching loan products found right now. Check back soon as lenders add new products.</p></div>:
        <div className={styles.productList}>{products.map(p=>(
          <div key={p.id} className={`card ${styles.productCard}`}>
            {p.is_featured && <span className={styles.featuredBadge}><Star size={12}/> Featured</span>}
            <div className={styles.productTop}>
              <div className={styles.lenderInfo}>
                {p.lenders?.logo_url?<img src={p.lenders.logo_url} alt="" className={styles.lenderLogo}/>:<div className={styles.lenderLogoPlaceholder}>{p.lenders?.company_name?.charAt(0)}</div>}
                <div><span className={styles.lenderName}>{p.lenders?.company_name}</span>{p.lenders?.cbn_license_number&&<BadgeCheck size={14} className={styles.verifiedIcon}/>}</div>
              </div>
            </div>
            <h3 className={styles.productName}>{p.name}</h3>
            <div className={styles.productMeta}>
              <div><span className={styles.metaLabel}>Amount</span><span className={styles.metaValue}>₦{Number(p.minimum_amount).toLocaleString()} – ₦{Number(p.maximum_amount).toLocaleString()}</span></div>
              <div><span className={styles.metaLabel}>Rate</span><span className={styles.metaValue}>{p.interest_rate}%/mo <small>({p.interest_type})</small></span></div>
              <div><span className={styles.metaLabel}>APR</span><span className={styles.metaValue}>{p.apr}%</span></div>
              <div><span className={styles.metaLabel}>Tenure</span><span className={styles.metaValue}>{p.minimum_tenure_days}–{p.maximum_tenure_days} days</span></div>
            </div>
            <div className={styles.eligBadges}>
              <span className={styles.eligBadge}>Tier {p.minimum_kyc_tier}+ KYC</span>
              {p.minimum_months_active>0&&<span className={styles.eligBadge}>{p.minimum_months_active}+ months</span>}
              {p.collateral_required&&<span className={styles.eligBadge}>Collateral</span>}
            </div>
            <Link href={`/loans/${p.id}`} className="btn btn-primary" style={{marginTop:12,width:'100%',textAlign:'center'}}>View & Apply</Link>
          </div>
        ))}</div>}
      </main>
    </div>
  )
}
