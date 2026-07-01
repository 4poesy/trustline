'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Save, CheckCircle } from 'lucide-react'
import styles from './page.module.css'

export default function MarketplaceConfigPage() {
  const [config, setConfig] = useState({origination_fee_percentage:'2.5',featured_product_fee_monthly:'0',minimum_lender_listing_fee_monthly:'0',updated_at:''})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const f = async () => { try {
      const {data} = await supabase.from('marketplace_config').select('*').limit(1).single()
      if(data) setConfig({origination_fee_percentage:String(data.origination_fee_percentage),featured_product_fee_monthly:String(data.featured_product_fee_monthly),minimum_lender_listing_fee_monthly:String(data.minimum_lender_listing_fee_monthly),updated_at:data.updated_at})
    } catch(e){console.error(e)} finally{setLoading(false)} }; f()
  }, [])

  const handleSave = async () => {
    setSaving(true); setSaved(false)
    try {
      const {data:existing} = await supabase.from('marketplace_config').select('id').limit(1).single()
      if(existing) {
        await supabase.from('marketplace_config').update({
          origination_fee_percentage:parseFloat(config.origination_fee_percentage),
          featured_product_fee_monthly:parseFloat(config.featured_product_fee_monthly),
          minimum_lender_listing_fee_monthly:parseFloat(config.minimum_lender_listing_fee_monthly),
          updated_at:new Date().toISOString()
        }).eq('id',existing.id)
      }
      setSaved(true); setTimeout(()=>setSaved(false),3000)
    } catch(e){console.error(e)} finally{setSaving(false)}
  }

  if(loading) return <div className={styles.loadingContainer}><span className="spinner"/><p>Loading config...</p></div>

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/admin" className={styles.backButton}><ArrowLeft size={20}/></Link>
        <h1 className={styles.title}>Marketplace Config</h1><div style={{width:40}}/>
      </div></header>
      <main className={styles.main}>
        <section className={`card ${styles.configCard}`}>
          <div className="form-group"><label className="form-label">Origination Fee (%)</label>
            <input type="number" step="0.1" className="form-input" value={config.origination_fee_percentage} onChange={e=>setConfig({...config,origination_fee_percentage:e.target.value})}/>
            <span className={styles.hint}>% of disbursed loan amount charged to the lender</span>
          </div>
          <div className="form-group" style={{marginTop:16}}><label className="form-label">Featured Product Fee (₦/month)</label>
            <input type="number" className="form-input" value={config.featured_product_fee_monthly} onChange={e=>setConfig({...config,featured_product_fee_monthly:e.target.value})}/>
          </div>
          <div className="form-group" style={{marginTop:16}}><label className="form-label">Minimum Listing Fee (₦/month)</label>
            <input type="number" className="form-input" value={config.minimum_lender_listing_fee_monthly} onChange={e=>setConfig({...config,minimum_lender_listing_fee_monthly:e.target.value})}/>
          </div>

          {config.updated_at && <p className={styles.lastUpdated}>Last updated: {new Date(config.updated_at).toLocaleString('en-NG')}</p>}

          <button className="btn btn-primary btn-large" style={{marginTop:24,width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8}} onClick={handleSave} disabled={saving}>
            {saved?<><CheckCircle size={18}/> Saved!</>:saving?'Saving...':<><Save size={18}/> Save Configuration</>}
          </button>
        </section>
      </main>
    </div>
  )
}
