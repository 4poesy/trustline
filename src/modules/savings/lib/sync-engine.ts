import { savingsDb } from '../db/savings-db'
import { createClient } from '@/lib/supabase/client'

/**
 * Pushes unsynced contributions to Supabase using an insert-or-ignore strategy.
 */
export async function pushLocalContributions(profileId: string) {
  const supabase = createClient()
  
  const unsynced = await savingsDb.contributions
    .where('profile_id')
    .equals(profileId)
    .filter(c => c.synced_at === null)
    .toArray()

  if (unsynced.length === 0) return 0

  const recordsToUpload = unsynced.map(c => ({
    id: c.id,
    group_id: c.group_id,
    profile_id: c.profile_id,
    amount: c.amount,
    cycle_number: c.cycle_number,
    created_at: c.created_at
  }))

  const { error } = await supabase
    .from('contributions')
    .upsert(recordsToUpload, { onConflict: 'id', ignoreDuplicates: true })

  if (error) {
    console.error('Error pushing contributions:', error)
    throw error
  }

  const nowStr = new Date().toISOString()
  await savingsDb.transaction('rw', savingsDb.contributions, async () => {
    for (const contribution of unsynced) {
      await savingsDb.contributions.update(contribution.id, { synced_at: nowStr })
    }
  })

  return unsynced.length
}

/**
 * Pulls group contributions from Supabase for all groups the user belongs to.
 */
export async function pullRemoteContributions(profileId: string) {
  const supabase = createClient()

  // First fetch the user's groups
  const { data: memberGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('profile_id', profileId)

  if (!memberGroups || memberGroups.length === 0) return 0
  const groupIds = memberGroups.map(mg => mg.group_id)

  const { data: remoteContributions, error } = await supabase
    .from('contributions')
    .select('*')
    .in('group_id', groupIds)

  if (error) {
    console.error('Error pulling contributions:', error)
    throw error
  }

  if (!remoteContributions || remoteContributions.length === 0) return 0

  let insertedCount = 0
  await savingsDb.transaction('rw', savingsDb.contributions, async () => {
    for (const remote of remoteContributions) {
      const existing = await savingsDb.contributions.get(remote.id)
      
      if (!existing) {
        await savingsDb.contributions.add({
          id: remote.id,
          group_id: remote.group_id,
          profile_id: remote.profile_id,
          amount: Number(remote.amount),
          cycle_number: remote.cycle_number,
          created_at: remote.created_at,
          synced_at: remote.synced_at || new Date().toISOString()
        })
        insertedCount++
      } else if (existing.synced_at === null) {
        await savingsDb.contributions.update(remote.id, {
          synced_at: remote.synced_at || new Date().toISOString()
        })
      }
    }
  })

  return insertedCount
}

/**
 * Syncs both ways: pushes unsynced local data, pulls new remote contributions.
 */
export async function syncSavings(profileId: string) {
  let pushed = 0
  let pulled = 0

  try {
    pushed = await pushLocalContributions(profileId)
  } catch (e) {
    console.warn('Push contributions skipped (probably offline):', e)
  }

  try {
    pulled = await pullRemoteContributions(profileId)
  } catch (e) {
    console.warn('Pull contributions skipped (probably offline):', e)
  }

  return { pushed, pulled }
}
