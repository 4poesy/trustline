'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSavings } from '@/modules/savings/hooks/useSavings'
import type { Profile } from '@/lib/supabase/types'
import styles from './page.module.css'

interface Props {
  profile: Profile
}

export function SavingsClient({ profile }: Props) {
  const { groups, loading, joinGroup, refreshGroups } = useSavings(profile.id)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState(false)
  const router = useRouter()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return

    setJoining(true)
    setJoinError('')
    setJoinSuccess(false)

    try {
      const joined = await joinGroup(inviteCode.trim())
      setJoinSuccess(true)
      setInviteCode('')
      setTimeout(() => {
        router.push(`/savings/${joined.id}`)
      }, 1000)
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join group')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading savings groups...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Back to dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 className={styles.title}>Savings Groups</h1>
          <button className={styles.refreshButton} onClick={refreshGroups} aria-label="Refresh list">
            🔄
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Join Group with invite code */}
        <section className={`card ${styles.joinCard}`}>
          <h2 className={styles.sectionTitle}>Join a Group</h2>
          <p className={styles.sectionDesc}>Enter an invite code shared by your saving group leader</p>
          <form onSubmit={handleJoin} className={styles.joinForm}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. AB49EF"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value)
                setJoinError('')
              }}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={joining || !inviteCode.trim()}>
              {joining ? 'Joining...' : 'Join'}
            </button>
          </form>
          {joinError && <p className="form-error" role="alert">{joinError}</p>}
          {joinSuccess && <p className={styles.successText} role="alert">Successfully joined! Redirecting...</p>}
        </section>

        {/* Groups List */}
        <section className={styles.groupsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Groups</h2>
            <Link href="/savings/create" className="btn btn-secondary btn-sm" id="create-group-button">
              + New Group
            </Link>
          </div>

          {groups.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👥</div>
              <p className={styles.emptyText}>You haven&apos;t joined any savings groups yet</p>
              <p className={styles.emptyHint}>Create your own or ask your coordinator for an invite code.</p>
            </div>
          ) : (
            <div className={styles.groupsList}>
              {groups.map((group) => (
                <Link key={group.id} href={`/savings/${group.id}`} className={`card ${styles.groupCard}`}>
                  <div className={styles.groupMain}>
                    <h3 className={styles.groupName}>{group.name}</h3>
                    <span className={styles.groupAmount}>
                      ₦{Number(group.contribution_amount).toLocaleString()} / {group.cycle_frequency === 'weekly' ? 'week' : 'month'}
                    </span>
                  </div>
                  <div className={styles.groupMeta}>
                    <span className={styles.badge}>Cycle {group.current_cycle}</span>
                    <span className={styles.coordinator}>Led by {group.created_by?.name || 'Coordinator'}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
