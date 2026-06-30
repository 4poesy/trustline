'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  Award, 
  ArrowRight, 
  BookOpen, 
  Users, 
  MapPin, 
  LogOut, 
  DollarSign, 
  Activity,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'
import { getCreditScore } from '@/lib/supabase/creditScore'
import { supabase } from '@/lib/supabase/client'
import { db } from '@/modules/cashflow/db/cashflow-db'
import type { Profile } from '@/lib/supabase/types'
import styles from './page.module.css'

interface Props {
  profile: Profile
}

export function DashboardClient({ profile }: Props) {
  const router = useRouter()
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [trustScore, setTrustScore] = useState<number | null>(null)
  const [creditBand, setCreditBand] = useState('Building')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMonthlyIncome = async () => {
      try {
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        
        const txs = await db.table('transactions')
          .where('profile_id')
          .equals(profile.id)
          .and(t => t.type === 'income' && t.entry_date >= firstDayOfMonth)
          .toArray()
          
        const total = txs.reduce((sum, t) => sum + t.amount, 0)
        setMonthlyIncome(total)
      } catch (e) {
        console.error('Error fetching monthly income for dashboard:', e)
      }
    }
    
    fetchMonthlyIncome()
  }, [profile.id])

  useEffect(() => {
    const fetchTrustScore = async () => {
      try {
        const { data } = await getCreditScore(profile.id)
        if (data) {
          setTrustScore(data.score)
          setCreditBand(data.band)
        }
      } catch (e) {
        console.error('Error fetching trust score:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchTrustScore()
  }, [profile.id])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'trader': return 'Trader'
      case 'service_provider': return 'Service Provider'
      case 'group_member': return 'Savings Group Member'
      default: return role
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={styles.page}
    >
      {/* Header section with stagnant solid green background and gold wavy divider */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <Link href="/" className={styles.backArrowLink} title="Back to main website">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <span className={styles.greeting}>{getGreeting()},</span>
              <h1 className={styles.userName}>{profile.name}</h1>
            </div>
          </div>
          <button
            className={styles.avatarButton}
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            id="sign-out-button"
          >
            <LogOut size={16} className={styles.logoutIcon} />
          </button>
        </div>
        <div className={styles.roleBadgeContainer}>
          <span className={styles.roleBadge}>
            <span className={styles.roleBadgeDot} />
            {getRoleLabel(profile.role)}
            {profile.business_type && ` · ${profile.business_type}`}
          </span>
        </div>

        {/* Replicated Gold Wavy Divider at bottom of header */}
        <div className={styles.headerBorderBottom}>
          <svg className={styles.waveSvg} viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,60 C150,90 350,90 500,60 C650,30 850,30 1000,60 C1150,90 1250,90 1200,60 L1200,120 L0,120 Z" fill="var(--color-background)"></path>
            <path d="M0,60 C150,90 350,90 500,60 C650,30 850,30 1000,60 C1150,90 1250,90 1200,60" fill="none" stroke="var(--color-secondary-500)" strokeWidth="3"></path>
          </svg>
        </div>
      </header>

      <main className={styles.main}>
        {/* Quick Stats Grid */}
        <section className={styles.statsGrid}>
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`card ${styles.statCard}`}
          >
            <div className={styles.statIcon}>
              <DollarSign size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>
                ₦{monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
              <span className={styles.statLabel}>This month&apos;s income</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Link href="/credit-profile" className={`card ${styles.statCard} ${styles.statCardLink}`}>
              <div className={`${styles.statIcon} ${styles.statIconSecondary}`}>
                <Award size={20} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>
                  {loading ? '--' : `${trustScore} (${creditBand})`}
                </span>
                <span className={styles.statLabel}>Trust score &rarr;</span>
              </div>
            </Link>
          </motion.div>
        </section>

        {/* Dynamic score progress indicator on dashboard */}
        <AnimatePresence>
          {!loading && trustScore !== null && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`card ${styles.scoreBarCard}`}
            >
              <div className={styles.scoreHeader}>
                <span className={styles.scoreTitle}>CREDIT HEALTH</span>
                <span className={styles.scorePercent}>{trustScore}/100</span>
              </div>
              <div className={styles.progressBarBg}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${trustScore}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  className={styles.progressBarFill}
                />
              </div>
              <p className={styles.scoreTip}>
                Grow your credit score by recording transactions and saving weekly.
              </p>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Module action cards */}
        <section className={styles.actionCards}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>

          <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.99 }}>
            <Link href="/cashflow" className={`card ${styles.actionCard}`} id="cashflow-action-card">
              <div className={`${styles.actionIcon} ${styles.actionIconCashflow}`}>
                <Activity size={22} />
              </div>
              <div className={styles.actionContent}>
                <h3 className={styles.actionTitle}>Track your cashflow</h3>
                <p className={styles.actionDescription}>Log daily income and expenses to build your financial record</p>
              </div>
              <ChevronRight size={18} className={styles.chevron} />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.99 }}>
            <Link href="/directory" className={`card ${styles.actionCard}`} id="directory-action-card">
              <div className={`${styles.actionIcon} ${styles.actionIconDirectory}`}>
                <BookOpen size={22} />
              </div>
              <div className={styles.actionContent}>
                <h3 className={styles.actionTitle}>Your public profile</h3>
                <p className={styles.actionDescription}>Get found by customers and build your reputation with reviews</p>
              </div>
              <ChevronRight size={18} className={styles.chevron} />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.99 }}>
            <Link href="/savings" className={`card ${styles.actionCard}`} id="savings-action-card">
              <div className={`${styles.actionIcon} ${styles.actionIconSavings}`}>
                <Users size={22} />
              </div>
              <div className={styles.actionContent}>
                <h3 className={styles.actionTitle}>Savings groups</h3>
                <p className={styles.actionDescription}>Join or create an ajo/esusu group and save together</p>
              </div>
              <ChevronRight size={18} className={styles.chevron} />
            </Link>
          </motion.div>
        </section>

        {/* Location indicator */}
        <div className={styles.locationBar}>
          <MapPin size={16} className={styles.locationIcon} />
          <span>Active in {profile.location}</span>
        </div>
      </main>
    </motion.div>
  )
}
