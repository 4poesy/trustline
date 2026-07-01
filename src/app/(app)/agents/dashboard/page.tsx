'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Users, Landmark, Copy, Check, Share2, Award, Calendar } from 'lucide-react'
import styles from './page.module.css'

export default function AgentDashboardPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [agent, setAgent] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchAgentDashboard = async () => {
      if (!profile?.id) return
      try {
        // 1. Fetch Agent details
        const { data: agentData, error: agentErr } = await supabase
          .from('agents')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle()

        if (!agentData) {
          router.replace('/agents/apply')
          return
        }
        setAgent(agentData)

        // 2. Fetch Referrals list
        const { data: refs } = await supabase
          .from('agent_referrals')
          .select(`
            id,
            commission_amount,
            commission_status,
            created_at,
            profiles:referred_profile_id (name, phone_number, business_type)
          `)
          .eq('agent_id', agentData.id)
          .order('created_at', { ascending: false })

        setReferrals(refs || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAgentDashboard()
  }, [profile?.id, router])

  const handleCopyCode = () => {
    if (!agent?.agent_code) return
    navigator.clipboard.writeText(agent.agent_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    if (!agent?.agent_code) return
    const text = encodeURIComponent(`Join Trustline using my Agent Code: ${agent.agent_code} and build your financial reputation! Link: https://trustline365.vercel.app`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

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
        <p>Loading Agent Dashboard...</p>
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
          <h1 className={styles.title}>Agent Portal</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {/* Stats Grid */}
        <section className={styles.statsSection}>
          <div className={`card ${styles.statCard}`}>
            <Users className={styles.statIcon} size={24} />
            <span className={styles.statLabel}>TOTAL REFERRALS</span>
            <h2 className={styles.statVal}>{agent?.total_referrals || 0}</h2>
          </div>
          
          <div className={`card ${styles.statCard}`}>
            <Landmark className={styles.statIcon} size={24} style={{ color: 'var(--color-secondary-500)' }} />
            <span className={styles.statLabel}>EARNED COMMISSION</span>
            <h2 className={styles.statVal}>
              {profile?.currency || 'NGN'} {Number(agent?.total_commission_earned || 0).toLocaleString()}
            </h2>
          </div>
        </section>

        {/* Code Box */}
        <section className={`card ${styles.codeCard}`}>
          <div className={styles.codeHeader}>
            <Award size={20} className={styles.awardIcon} />
            <h4>YOUR UNIQUE REFERRAL CODE</h4>
          </div>

          <div className={styles.codeRow}>
            <span className={styles.code}>{agent?.agent_code}</span>
            <div className={styles.codeActions}>
              <button onClick={handleCopyCode} className={styles.actionBtn} aria-label="Copy code">
                {copied ? <Check size={18} style={{ color: 'var(--color-primary-500)' }} /> : <Copy size={18} />}
              </button>
              <button onClick={handleShareWhatsApp} className={styles.actionBtn} aria-label="Share via WhatsApp">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Referrals list */}
        <section className={styles.listSection}>
          <h3 className={styles.listTitle}>Onboarded Referrals</h3>

          {referrals.length === 0 ? (
            <div className={styles.emptyCard}>
              <Users size={36} className={styles.emptyIcon} />
              <p>No referrals registered yet. Share your code to start onboarding users!</p>
            </div>
          ) : (
            <div className={styles.referralsList}>
              {referrals.map((ref) => (
                <div key={ref.id} className={`card ${styles.refItem}`}>
                  <div className={styles.itemLeft}>
                    <h4>{ref.profiles?.name || 'New User'}</h4>
                    <p>{ref.profiles?.business_type || 'Trader'} · {ref.profiles?.phone_number}</p>
                    <span className={styles.refDate}>
                      <Calendar size={12} style={{ marginRight: '4px' }} />
                      Joined {formatDate(ref.created_at)}
                    </span>
                  </div>

                  <div className={styles.itemRight}>
                    <span className={styles.refAmount}>
                      +{profile?.currency || 'NGN'} {Number(ref.commission_amount || 0).toLocaleString()}
                    </span>
                    <span className={`${styles.statusBadge} ${ref.commission_status === 'paid' ? styles.statusPaid : styles.statusPending}`}>
                      {ref.commission_status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
