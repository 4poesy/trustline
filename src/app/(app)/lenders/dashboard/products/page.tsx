'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import styles from './page.module.css'

export default function LenderProductsPage() {
  const { profile } = useAuth()
  const [lenderId, setLenderId] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      if (!profile?.id) return
      try {
        const { data: admin } = await supabase.from('lender_admin_users').select('lender_id').eq('profile_id', profile.id).maybeSingle()
        if (!admin) { setLoading(false); return }
        setLenderId(admin.lender_id)
        const { data } = await supabase.from('loan_products').select('*').eq('lender_id', admin.lender_id).order('created_at', { ascending: false })
        if (data) setProducts(data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetch()
  }, [profile?.id])

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('loan_products').update({ is_active: !current, updated_at: new Date().toISOString() }).eq('id', id)
    setProducts(products.map(p => p.id === id ? { ...p, is_active: !current } : p))
  }

  if (loading) return <div className={styles.loadingContainer}><span className="spinner" /><p>Loading products...</p></div>

  return (
    <div className={styles.page}>
      <header className={styles.header}><div className={styles.headerInner}>
        <Link href="/lenders/dashboard" className={styles.backButton}><ArrowLeft size={20} /></Link>
        <h1 className={styles.title}>Loan Products</h1>
        <div style={{width:40}} />
      </div></header>
      <main className={styles.main}>
        <div className={styles.topRow}>
          <h2>Your Products ({products.length})</h2>
          <Link href="/lenders/dashboard/products/create" className="btn btn-primary" style={{display:'flex',gap:6,alignItems:'center'}}><Plus size={16} /> Add Product</Link>
        </div>
        {products.length === 0 ? (
          <div className={styles.emptyCard}><p>No loan products listed yet. Create your first product to start receiving applications.</p></div>
        ) : (
          <div className={styles.productList}>
            {products.map(p => (
              <div key={p.id} className={`card ${styles.productCard}`}>
                <div className={styles.productHeader}>
                  <h3>{p.name}</h3>
                  <button className={styles.toggleBtn} onClick={() => toggleActive(p.id, p.is_active)} aria-label="Toggle active">
                    {p.is_active ? <ToggleRight size={28} style={{color:'var(--color-primary-500)'}} /> : <ToggleLeft size={28} style={{color:'var(--color-neutral-400)'}} />}
                  </button>
                </div>
                <p className={styles.productDesc}>{p.description?.substring(0, 100)}...</p>
                <div className={styles.productMeta}>
                  <span>₦{Number(p.minimum_amount).toLocaleString()} – ₦{Number(p.maximum_amount).toLocaleString()}</span>
                  <span>{p.interest_rate}% {p.interest_type}/mo</span>
                  <span className={`${styles.statusPill} ${p.is_active ? styles.activePill : styles.inactivePill}`}>{p.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
