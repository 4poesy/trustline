'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Users, ShoppingBag, Calendar, CheckCircle2 } from 'lucide-react'
import styles from './page.module.css'

export default function GroupCommerceListPage() {
  const { profile } = useAuth()

  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGroupPurchases = async () => {
      if (!profile?.id) return
      try {
        // Query active group purchases
        const { data, error } = await supabase
          .from('group_purchases')
          .select('*')
          .order('created_at', { ascending: false })

        if (data) setPurchases(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchGroupPurchases()
  }, [profile?.id])

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading group purchases...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Back to dashboard">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Group Commerce</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.actionHeader}>
          <h2>Collective Purchasing</h2>
          <Link href="/group-commerce/create" className="btn btn-primary" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Plus size={16} /> Start Group Buy
          </Link>
        </section>

        <section className={styles.listSection}>
          {purchases.length === 0 ? (
            <div className={styles.emptyCard}>
              <ShoppingBag size={40} className={styles.emptyIcon} />
              <h3>No active bulk orders</h3>
              <p>Pool funds together with savings group members to secure discount pricing from suppliers.</p>
              <Link href="/group-commerce/create" className="btn btn-secondary" style={{ marginTop: '12px' }}>
                Create First Group Buy
              </Link>
            </div>
          ) : (
            <div className={styles.purchasesList}>
              {purchases.map((p) => {
                const percent = Math.min(100, Math.round((Number(p.amount_contributed || 0) / Number(p.target_amount)) * 100))
                return (
                  <Link key={p.id} href={`/group-commerce/${p.id}`} className={`card ${styles.itemCard}`}>
                    <div className={styles.cardHeader}>
                      <ShoppingBag size={20} className={styles.icon} />
                      <span className={`${styles.statusBadge} ${p.status === 'open' ? styles.statusOpen : styles.statusFunded}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 className={styles.itemTitle}>{p.title}</h3>
                    <p className={styles.itemDesc}>{p.description}</p>

                    <div className={styles.progressSection}>
                      <div className={styles.progressLabelRow}>
                        <span>{percent}% Raised</span>
                        <span>{profile?.currency || 'NGN'} {Number(p.amount_contributed || 0).toLocaleString()} / {Number(p.target_amount).toLocaleString()}</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                    <div className={styles.footerRow}>
                      <span className={styles.deadline}>
                        <Calendar size={12} style={{ marginRight: '4px' }} />
                        Deadline: {formatDate(p.deadline)}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
