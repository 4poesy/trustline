'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSavings } from '@/modules/savings/hooks/useSavings'
import { savingsDb } from '@/modules/savings/db/savings-db'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'
import styles from './page.module.css'

interface Props {
  profile: Profile
  groupId: string
}

export function GroupDetailClient({ profile, groupId }: Props) {
  const { logContribution } = useSavings(profile.id)
  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [contributions, setContributions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Load group info, roster lists, and local/remote payment logs
  const loadGroupDetails = useCallback(async () => {
    try {
      const { data: gData, error: gErr } = await supabase
        .from('savings_groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (gErr) throw gErr
      setGroup(gData)

      const { data: mData, error: mErr } = await supabase
        .from('group_members')
        .select('*, profiles(id, name, role)')
        .eq('group_id', groupId)

      if (mErr) throw mErr
      setMembers(mData || [])

      // Fetch local IndexedDB payment contributions
      const local = await savingsDb.contributions
        .where('group_id')
        .equals(groupId)
        .toArray()

      // Fetch remote server payment contributions
      const { data: remote, error: cErr } = await supabase
        .from('contributions')
        .select('*')
        .eq('group_id', groupId)

      if (cErr) throw cErr

      const mergedMap = new Map<string, any>()
      remote?.forEach(c => mergedMap.set(c.id, c))
      local.forEach(c => mergedMap.set(c.id, c))
      setContributions(Array.from(mergedMap.values()))
    } catch (e) {
      console.error('Error fetching group details:', e)
    } finally {
      setLoading(false)
    }
  }, [groupId, supabase])

  useEffect(() => {
    loadGroupDetails()
  }, [loadGroupDetails])

  // Subscribe to changes in real-time
  useEffect(() => {
    const channel = supabase
      .channel(`group-details:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contributions', filter: `group_id=eq.${groupId}` },
        () => loadGroupDetails()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` },
        () => loadGroupDetails()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, supabase, loadGroupDetails])

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className="spinner" />
        <p>Loading group details...</p>
      </div>
    )
  }

  if (!group) {
    return (
      <div className={styles.loadingContainer}>
        <p>Group not found</p>
        <button className="btn btn-secondary" onClick={() => router.replace('/savings')}>
          Back to Savings
        </button>
      </div>
    )
  }

  const payoutOrder = group.payout_order || []
  const currentRecipientId = payoutOrder[(group.current_cycle - 1) % payoutOrder.length]
  const currentRecipientName = members.find(m => m.profiles?.id === currentRecipientId)?.profiles?.name || 'Coordinator'

  const userHasPaid = contributions.some(c => c.profile_id === profile.id && c.cycle_number === group.current_cycle)

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLogPayment = async () => {
    try {
      await logContribution(group.id, Number(group.contribution_amount), group.current_cycle)
      await loadGroupDetails()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/savings" className={styles.backButton} aria-label="Back to groups">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 className={styles.title}>{group.name}</h1>
          <div style={{ width: 40 }} />
        </div>
      </header>

      <main className={styles.main}>
        {/* Cycle Tracker */}
        <section className={`card ${styles.trackerCard}`}>
          <div className={styles.trackerTop}>
            <span className={styles.cycleLabel}>Current Cycle: Round {group.current_cycle}</span>
            <span className={styles.cycleFreq}>
              {group.cycle_frequency === 'weekly' ? 'Weekly' : 'Monthly'}
            </span>
          </div>
          <div className={styles.trackerRecipient}>
            <div className={styles.recipientIcon}>🎁</div>
            <div className={styles.recipientContent}>
              <span className={styles.recipientTitle}>Payout Recipient</span>
              <span className={styles.recipientName}>{currentRecipientName}</span>
            </div>
          </div>
        </section>

        {/* Pay log card */}
        <section className={`card ${styles.actionCard}`}>
          <div className={styles.actionHeader}>
            <h3 className={styles.actionTitle}>Your Contribution</h3>
            <span className={userHasPaid ? styles.paidText : styles.unpaidText}>
              {userHasPaid ? '✓ Logged' : 'Pending'}
            </span>
          </div>
          <p className={styles.actionDesc}>
            Log your contribution of <strong>₦{Number(group.contribution_amount).toLocaleString()}</strong> for cycle {group.current_cycle}.
          </p>
          <button
            className={`btn btn-primary btn-large ${styles.payButton}`}
            disabled={userHasPaid}
            onClick={handleLogPayment}
            id="log-savings-payment-button"
          >
            {userHasPaid ? 'Contribution Logged' : `Log Contribution (₦${Number(group.contribution_amount).toLocaleString()})`}
          </button>
        </section>

        {/* Invite Code */}
        <section className={`card ${styles.inviteCard}`}>
          <h3 className={styles.cardTitle}>Invite Link / Code</h3>
          <p className={styles.cardDesc}>Share this code so friends can join this savings group:</p>
          <div className={styles.inviteRow}>
            <span className={styles.inviteCode}>{group.invite_code}</span>
            <button className="btn btn-secondary btn-sm" onClick={handleCopyInvite}>
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </section>

        {/* roster list */}
        <section className={styles.membersSection}>
          <h2 className={styles.sectionTitle}>Group Roster ({members.length} members)</h2>
          <div className={styles.rosterList}>
            {members.map((member) => {
              const mId = member.profiles?.id
              const hasPaidCurrent = contributions.some(c => c.profile_id === mId && c.cycle_number === group.current_cycle)
              const isHisTurn = mId === currentRecipientId

              return (
                <div key={member.id} className={`card ${styles.memberRow}`}>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberAvatar}>
                      {member.profiles?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className={styles.memberName}>
                        {member.profiles?.name} {mId === profile.id ? '(You)' : ''}
                      </span>
                      {isHisTurn && <span className={styles.turnBadge}>Receiving payout</span>}
                    </div>
                  </div>
                  <div className={styles.memberStatus}>
                    <span className={hasPaidCurrent ? styles.paidBadge : styles.pendingBadge}>
                      {hasPaidCurrent ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
