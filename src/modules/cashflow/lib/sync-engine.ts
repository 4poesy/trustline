import { db } from '../db/cashflow-db'
import { createClient } from '@/lib/supabase/client'

/**
 * Pushes unsynced local transactions to Supabase using an insert-or-ignore strategy (upsert).
 */
export async function pushLocalTransactions(profileId: string) {
  const supabase = createClient()
  
  // Find all local transactions for this profile that are unsynced
  const unsynced = await db.transactions
    .where('profile_id')
    .equals(profileId)
    .filter(t => t.synced_at === null)
    .toArray()

  if (unsynced.length === 0) return 0

  const recordsToUpload = unsynced.map(t => ({
    id: t.id,
    profile_id: t.profile_id,
    type: t.type,
    amount: t.amount,
    category: t.category,
    note: t.note || null,
    entry_date: t.entry_date,
    created_at: t.created_at
  }))

  // Perform insert-or-ignore upsert by ID. Duplicate IDs will be ignored, preventing overwriting.
  const { error } = await supabase
    .from('transactions')
    .upsert(recordsToUpload, { onConflict: 'id', ignoreDuplicates: true })

  if (error) {
    console.error('Error pushing transactions:', error)
    throw error
  }

  // Mark them as synced locally
  const nowStr = new Date().toISOString()
  await db.transaction('rw', db.transactions, async () => {
    for (const transaction of unsynced) {
      await db.transactions.update(transaction.id, { synced_at: nowStr })
    }
  })

  return unsynced.length
}

/**
 * Pulls remote transactions from Supabase and populates IndexedDB.
 */
export async function pullRemoteTransactions(profileId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('profile_id', profileId)

  if (error) {
    console.error('Error pulling transactions:', error)
    throw error
  }

  if (!data || data.length === 0) return 0

  let insertedCount = 0
  await db.transaction('rw', db.transactions, async () => {
    for (const remote of data) {
      const existing = await db.transactions.get(remote.id)
      
      if (!existing) {
        // Insert new remote records
        await db.transactions.add({
          id: remote.id,
          profile_id: remote.profile_id,
          type: remote.type as 'income' | 'expense',
          amount: Number(remote.amount),
          category: remote.category,
          note: remote.note || undefined,
          entry_date: remote.entry_date,
          created_at: remote.created_at,
          synced_at: remote.synced_at || new Date().toISOString()
        })
        insertedCount++
      } else if (existing.synced_at === null) {
        // If it exists locally but is marked unsynced, update synced_at since it exists on the server
        await db.transactions.update(remote.id, {
          synced_at: remote.synced_at || new Date().toISOString()
        })
      }
    }
  })

  return insertedCount
}

/**
 * Executes a full sync sequence: pushes local edits, then pulls remote updates.
 */
export async function syncAll(profileId: string) {
  let pushed = 0
  let pulled = 0

  try {
    pushed = await pushLocalTransactions(profileId)
  } catch (e) {
    console.warn('Push sync skipped (probably offline):', e)
  }

  try {
    pulled = await pullRemoteTransactions(profileId)
  } catch (e) {
    console.warn('Pull sync skipped (probably offline):', e)
  }

  return { pushed, pulled }
}
