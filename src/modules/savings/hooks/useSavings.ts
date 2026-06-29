'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { savingsDb, type LocalContribution } from '../db/savings-db'
import { syncSavings, pushLocalContributions } from '../lib/sync-engine'
import { useOnlineStatus } from '@/modules/auth/hooks/useOnlineStatus'

export function useSavings(profileId: string | undefined) {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const isOnline = useOnlineStatus()
  const supabase = createClient()

  // Load savings groups user is currently in
  const loadGroups = useCallback(async () => {
    if (!profileId) return
    setLoading(true)
    try {
      const { data: memberships, error: memError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('profile_id', profileId)

      if (memError) throw memError

      if (!memberships || memberships.length === 0) {
        setGroups([])
        setLoading(false)
        return
      }

      const groupIds = memberships.map(m => m.group_id)

      const { data: groupDetails, error: groupError } = await supabase
        .from('savings_groups')
        .select('*, created_by:created_by_profile_id(name)')
        .in('id', groupIds)

      if (groupError) throw groupError

      setGroups(groupDetails || [])
    } catch (e) {
      console.error('Error loading savings groups:', e)
    } finally {
      setLoading(false)
    }
  }, [profileId, supabase])

  useEffect(() => {
    if (profileId) {
      loadGroups()
    }
  }, [profileId, loadGroups])

  // Sync trigger
  const triggerSync = useCallback(async () => {
    if (!profileId || !isOnline) return
    setIsSyncing(true)
    try {
      await syncSavings(profileId)
    } catch (e) {
      console.error('Savings sync failed:', e)
    } finally {
      setIsSyncing(false)
    }
  }, [profileId, isOnline])

  useEffect(() => {
    if (isOnline && profileId) {
      triggerSync()
    }
  }, [isOnline, profileId, triggerSync])

  // Create a new savings group
  const createGroup = useCallback(async (name: string, amount: number, frequency: 'weekly' | 'monthly') => {
    if (!profileId) throw new Error('Not authenticated')

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // Create the savings group
    const { data: newGroup, error: groupError } = await supabase
      .from('savings_groups')
      .insert({
        name,
        created_by_profile_id: profileId,
        contribution_amount: amount,
        cycle_frequency: frequency,
        payout_order: [profileId], // creator is first in payout order initially
        invite_code: inviteCode
      })
      .select()
      .single()

    if (groupError) throw groupError

    // Add creator as member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: newGroup.id,
        profile_id: profileId
      })

    if (memberError) throw memberError

    await loadGroups()
    return newGroup
  }, [profileId, supabase, loadGroups])

  // Join group via invite code
  const joinGroup = useCallback(async (inviteCode: string) => {
    if (!profileId) throw new Error('Not authenticated')

    // Find the group
    const { data: group, error: findError } = await supabase
      .from('savings_groups')
      .select('*')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single()

    if (findError || !group) throw new Error('Group not found. Please check the code.')

    // Add member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        profile_id: profileId
      })

    if (memberError) {
      // If already joined, just return the group details
      if (memberError.code === '23505') {
        return group
      }
      throw memberError
    }

    // Append member to payout order (join order = payout order)
    const updatedPayoutOrder = [...(group.payout_order || []), profileId]
    await supabase
      .from('savings_groups')
      .update({ payout_order: updatedPayoutOrder })
      .eq('id', group.id)

    await loadGroups()
    return group
  }, [profileId, supabase, loadGroups])

  // Log contribution offline-first
  const logContribution = useCallback(async (groupId: string, amount: number, cycleNumber: number) => {
    if (!profileId) throw new Error('Not authenticated')

    const newContribution: LocalContribution = {
      id: crypto.randomUUID(),
      group_id: groupId,
      profile_id: profileId,
      amount,
      cycle_number: cycleNumber,
      created_at: new Date().toISOString(),
      synced_at: null
    }

    // Save to IndexedDB instantly
    await savingsDb.contributions.add(newContribution)

    // Trigger sync in background without blocking
    if (isOnline) {
      pushLocalContributions(profileId)
        .catch(e => console.warn('Background contribution sync failed:', e))
    }
  }, [profileId, isOnline])

  return {
    groups,
    loading,
    isSyncing,
    createGroup,
    joinGroup,
    logContribution,
    refreshGroups: loadGroups
  }
}
