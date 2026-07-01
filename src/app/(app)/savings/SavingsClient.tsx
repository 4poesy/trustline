'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSavings } from '@/modules/savings/hooks/useSavings'
import type { Profile } from '@/lib/supabase/types'
import { ArrowLeft, RefreshCw, Users, Plus, TrendingUp } from 'lucide-react'
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
  const [isRotating, setIsRotating] = useState(false)
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

  const handleRefresh = async () => {
    setIsRotating(true)
    await refreshGroups()
    setTimeout(() => setIsRotating(false), 800)
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
            <ArrowLeft size={20} />
          </Link>
          <h1 className={styles.title}>Savings Groups</h1>
          <button 
            className={`${styles.refreshButton} ${isRotating ? styles.rotating : ''}`} 
            onClick={handleRefresh} 
            aria-label="Refresh list"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Join Group with invite code */}
        <section className={`card ${styles.joinCard}`}>
          <div className={styles.joinHeader}>
            <h2 className={styles.sectionTitle}>Join a Savings Group</h2>
            <p className={styles.sectionDesc}>Enter an invite code shared by your saving group leader</p>
          </div>
          <form onSubmit={handleJoin} className={styles.joinForm}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. AB49EF"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase())
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
            <Link href="/savings/create" className="btn btn-secondary btn-sm" id="create-group-button" style={{ minHeight: '38px', padding: '0 var(--space-4)' }}>
              <Plus size={16} /> New Group
            </Link>
          </div>

          {groups.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconContainer}>
                <svg viewBox="0 0 100 100" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="2" className={styles.svgDraw}>
                  <circle cx="50" cy="50" r="30" strokeDasharray="6 4" stroke="var(--color-primary-200)" />
                  <circle cx="35" cy="40" r="12" fill="var(--color-secondary-50)" stroke="var(--color-secondary-500)" strokeWidth="2.5" />
                  <circle cx="65" cy="40" r="12" fill="var(--color-primary-50)" stroke="var(--color-primary-500)" strokeWidth="2.5" />
                  <circle cx="50" cy="70" r="14" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="2.5" />
                </svg>
              </div>
              <p className={styles.emptyText}>No active savings groups</p>
              <p className={styles.emptyHint}>Create your own or ask your coordinator for an invite code to start saving together.</p>
            </div>
          ) : (
            <div className={styles.groupsList}>
              {groups.map((group) => {
                const membersCount = group.payout_order?.length || 1;
                // Mock a clean visual percentage based on cycle or general progress
                const progressPct = Math.min((group.current_cycle / Math.max(membersCount, 1)) * 100, 100) || 10;
                
                return (
                  <Link key={group.id} href={`/savings/${group.id}`} className={`card ${styles.groupCard}`}>
                    <div className={styles.groupHeaderRow}>
                      <div className={styles.groupInfoLeft}>
                        <h3 className={styles.groupName}>{group.name}</h3>
                        <span className={styles.coordinator}>Led by {group.created_by?.name || 'Coordinator'}</span>
                      </div>
                      <div className={styles.groupInfoRight}>
                        <span className={styles.groupAmount}>
                          ₦{Number(group.contribution_amount).toLocaleString()}
                        </span>
                        <span className={styles.groupFrequency}>
                          per {group.cycle_frequency === 'weekly' ? 'week' : 'month'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.progressSection}>
                      <div className={styles.progressLabelRow}>
                        <span className={styles.badge}>Cycle {group.current_cycle}</span>
                        <span className={styles.membersCountPill}>
                          <Users size={12} style={{ marginRight: '4px' }} />
                          {membersCount} {membersCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                      <div className={styles.progressBarBg}>
                        <div className={styles.progressBarFill} style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
