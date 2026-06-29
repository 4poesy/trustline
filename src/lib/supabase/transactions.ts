import { supabase } from './client'
import { offlineDb } from '../offlineSync'

export interface Transaction {
  id: string
  profile_id: string
  type: 'income' | 'expense'
  amount: number
  category: 'Sales' | 'Supplies' | 'Transport' | 'Rent' | 'Other'
  note?: string
  entry_date: string
  created_at?: string
  synced_at?: string | null
}

/**
 * Adds a transaction record locally to IndexedDB first, then uploads to Supabase.
 */
export async function addTransaction(data: Omit<Transaction, 'id' | 'created_at' | 'synced_at'>) {
  const transactionId = crypto.randomUUID()
  const tx: Transaction = {
    ...data,
    id: transactionId,
    synced_at: null,
  }

  // 1. Write to local IndexedDB
  await offlineDb.table('transactions').put(tx)

  try {
    // 2. Try online Supabase insert
    const { error } = await supabase
      .from('transactions')
      .insert({
        id: tx.id,
        profile_id: tx.profile_id,
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        note: tx.note,
        entry_date: tx.entry_date,
      })

    if (error) throw error

    // 3. Mark as synced on success
    const nowStr = new Date().toISOString()
    await offlineDb.table('transactions').update(tx.id, { synced_at: nowStr })
    return { data: { ...tx, synced_at: nowStr }, error: null }
  } catch (err) {
    console.warn('[TransactionAPI] Saved offline, sync pending:', err)
    return { data: tx, error: null }
  }
}

/**
 * Queries transactions from Supabase and syncs details to local cache.
 */
export async function getTransactions(profileId: string, filters: { from?: Date; to?: Date; type?: string } = {}) {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('profile_id', profileId)

  if (filters.from) {
    query = query.gte('entry_date', filters.from.toISOString().split('T')[0])
  }
  if (filters.to) {
    query = query.lte('entry_date', filters.to.toISOString().split('T')[0])
  }
  if (filters.type) {
    query = query.eq('type', filters.type)
  }

  const { data, error } = await query.order('entry_date', { ascending: false })

  if (data) {
    for (const record of data) {
      await offlineDb.table('transactions').put({
        ...record,
        synced_at: new Date().toISOString(),
      })
    }
  }

  return { data, error }
}

/**
 * Computes dashboard aggregates instantly using IndexedDB, while refreshing from server.
 */
export async function getSummary(profileId: string, period: 'week' | 'month' | 'year') {
  const now = new Date()
  const startDate = new Date()

  if (period === 'week') {
    startDate.setDate(now.getDate() - 7)
  } else if (period === 'month') {
    startDate.setMonth(now.getMonth() - 1)
  } else if (period === 'year') {
    startDate.setFullYear(now.getFullYear() - 1)
  }

  const startStr = startDate.toISOString().split('T')[0]

  const localTxs = await offlineDb.table('transactions')
    .where('profile_id')
    .equals(profileId)
    .filter((t) => t.entry_date >= startStr)
    .toArray()

  const summary = computeSummary(localTxs)

  // Background refresh cache
  getTransactions(profileId, { from: startDate }).catch((err) =>
    console.warn('[TransactionAPI] BG summary refresh skipped:', err)
  )

  return summary
}

function computeSummary(txs: any[]) {
  let total_income = 0
  let total_expenses = 0
  const by_category: Record<string, number> = {}
  const dailyEarnings: Record<string, number> = {}

  txs.forEach((t) => {
    const amount = Number(t.amount)
    if (t.type === 'income') {
      total_income += amount
      dailyEarnings[t.entry_date] = (dailyEarnings[t.entry_date] || 0) + amount
    } else {
      total_expenses += amount
    }

    if (t.category) {
      by_category[t.category] = (by_category[t.category] || 0) + amount
    }
  })

  let best_day = 'None'
  let maxEarnings = 0
  Object.keys(dailyEarnings).forEach((day) => {
    if (dailyEarnings[day] > maxEarnings) {
      best_day = day
      maxEarnings = dailyEarnings[day]
    }
  })

  return {
    total_income,
    total_expenses,
    profit: total_income - total_expenses,
    by_category,
    best_day,
  }
}

/**
 * Flush all unsynced local transaction and contribution entries.
 */
export async function syncOfflineEntries() {
  const pendingTxs = await offlineDb.table('transactions')
    .filter((t) => t.synced_at === null || t.synced_at === undefined)
    .toArray()

  const pendingContributions = await offlineDb.table('contributions')
    .filter((c) => c.synced_at === null || c.synced_at === undefined)
    .toArray()

  if (pendingTxs.length === 0 && pendingContributions.length === 0) {
    return { synced: 0, skipped: 0, errors: [] }
  }

  try {
    const { data, error } = await supabase.functions.invoke('sync-offline-entries', {
      body: {
        transactions: pendingTxs,
        contributions: pendingContributions,
      },
    })

    if (error) throw error

    const nowStr = new Date().toISOString()
    const txIds = pendingTxs.map((t) => t.id)
    const conIds = pendingContributions.map((c) => c.id)

    if (txIds.length > 0) {
      await offlineDb.table('transactions').where('id').anyOf(txIds).modify({ synced_at: nowStr })
    }
    if (conIds.length > 0) {
      await offlineDb.table('contributions').where('id').anyOf(conIds).modify({ synced_at: nowStr })
    }

    return {
      synced: data?.synced || 0,
      skipped: data?.skipped || 0,
      errors: data?.errors || [],
    }
  } catch (err: any) {
    console.error('[TransactionAPI] Sync offline flush failed:', err)
    return { synced: 0, skipped: 0, errors: [err.message || err.toString()] }
  }
}
