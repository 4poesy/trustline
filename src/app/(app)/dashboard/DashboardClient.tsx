'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'
import styles from './page.module.css'

interface Props {
  profile: Profile
}

export function DashboardClient({ profile }: Props) {
  const router = useRouter()
  const supabase = createClient()

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
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <p className={styles.greeting}>{getGreeting()},</p>
            <h1 className={styles.userName}>{profile.name}</h1>
          </div>
          <button
            className={styles.avatarButton}
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            id="sign-out-button"
          >
            <span className={styles.avatarInitial}>
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </button>
        </div>
        <div className={styles.roleBadge}>
          {getRoleLabel(profile.role)}
          {profile.business_type && ` · ${profile.business_type}`}
        </div>
      </header>

      <main className={styles.main}>
        {/* Quick Stats - placeholders for future modules */}
        <section className={styles.statsGrid}>
          <div className={`card ${styles.statCard}`}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>₦0</span>
              <span className={styles.statLabel}>This month&apos;s income</span>
            </div>
          </div>

          <div className={`card ${styles.statCard}`}>
            <div className={`${styles.statIcon} ${styles.statIconSecondary}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>--</span>
              <span className={styles.statLabel}>Trust score</span>
            </div>
          </div>
        </section>

        {/* Module action cards - placeholders */}
        <section className={styles.actionCards}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>

          <div className={`card ${styles.actionCard}`} id="cashflow-action-card">
            <div className={`${styles.actionIcon} ${styles.actionIconCashflow}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div className={styles.actionContent}>
              <h3 className={styles.actionTitle}>Track your cashflow</h3>
              <p className={styles.actionDescription}>Log daily income and expenses to build your financial record</p>
            </div>
            <span className={styles.comingSoon}>Coming soon</span>
          </div>

          <div className={`card ${styles.actionCard}`} id="directory-action-card">
            <div className={`${styles.actionIcon} ${styles.actionIconDirectory}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className={styles.actionContent}>
              <h3 className={styles.actionTitle}>Your public profile</h3>
              <p className={styles.actionDescription}>Get found by customers and build your reputation with reviews</p>
            </div>
            <span className={styles.comingSoon}>Coming soon</span>
          </div>

          <div className={`card ${styles.actionCard}`} id="savings-action-card">
            <div className={`${styles.actionIcon} ${styles.actionIconSavings}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className={styles.actionContent}>
              <h3 className={styles.actionTitle}>Savings groups</h3>
              <p className={styles.actionDescription}>Join or create an ajo/esusu group and save together</p>
            </div>
            <span className={styles.comingSoon}>Coming soon</span>
          </div>
        </section>

        {/* Location indicator */}
        <div className={styles.locationBar}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{profile.location}</span>
        </div>
      </main>
    </div>
  )
}
