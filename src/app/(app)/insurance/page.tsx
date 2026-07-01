'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Shield, FileText, Search, AlertTriangle, CheckCircle2 } from 'lucide-react'
import styles from './page.module.css'

export default function InsuranceDashboardPage() {
  const { profile } = useAuth()

  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPolicies = async () => {
      if (!profile?.id) return
      try {
        const { data } = await supabase
          .from('insurance_policies')
          .select('*')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false })

        if (data) setPolicies(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchPolicies()
  }, [profile?.id])

  const activePolicies = policies.filter(p => p.status === 'active')
  const expiredPolicies = policies.filter(p => p.status !== 'active')

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return d }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading insurance dashboard...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Back">
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Micro-Insurance</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {/* Quick Action Cards */}
        <section className={styles.actionGrid}>
          <Link href="/insurance/browse" className={`card ${styles.actionCard}`}>
            <Search size={28} className={styles.actionIcon} />
            <h3>Browse Plans</h3>
            <p>Explore affordable coverage options for your business</p>
          </Link>

          <Link href="/insurance/claims" className={`card ${styles.actionCard}`}>
            <FileText size={28} className={styles.actionIcon} />
            <h3>File a Claim</h3>
            <p>Submit a claim for an active policy coverage event</p>
          </Link>
        </section>

        {/* Active Policies */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Shield size={20} /> Active Policies ({activePolicies.length})
          </h2>

          {activePolicies.length === 0 ? (
            <div className={styles.emptyCard}>
              <Shield size={36} className={styles.emptyIcon} />
              <h3>No active policies</h3>
              <p>Browse affordable micro-insurance plans to protect your inventory, health, or device.</p>
              <Link href="/insurance/browse" className="btn btn-primary" style={{ marginTop: '12px' }}>
                Explore Plans
              </Link>
            </div>
          ) : (
            <div className={styles.policyList}>
              {activePolicies.map((p) => (
                <div key={p.id} className={`card ${styles.policyCard}`}>
                  <div className={styles.policyHeader}>
                    <CheckCircle2 size={18} className={styles.activeIcon} />
                    <span className={styles.activeBadge}>ACTIVE</span>
                  </div>
                  <h4>{p.plan_name}</h4>
                  <p className={styles.policyType}>{p.plan_type} Cover</p>
                  <div className={styles.policyMeta}>
                    <span>Premium: {profile?.currency || 'NGN'} {Number(p.premium_amount).toLocaleString()}/{p.premium_frequency}</span>
                    <span>Expires: {formatDate(p.end_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Expired / Inactive */}
        {expiredPolicies.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <AlertTriangle size={18} /> Past / Expired ({expiredPolicies.length})
            </h2>
            <div className={styles.policyList}>
              {expiredPolicies.map((p) => (
                <div key={p.id} className={`card ${styles.policyCard} ${styles.expiredCard}`}>
                  <h4>{p.plan_name}</h4>
                  <p className={styles.policyType}>{p.plan_type} Cover</p>
                  <div className={styles.policyMeta}>
                    <span>Status: {p.status}</span>
                    <span>Ended: {formatDate(p.end_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
