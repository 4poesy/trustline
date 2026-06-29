'use client'

import { useEffect, useState, useCallback } from 'react'
import { db, type LocalTransaction } from '../db/cashflow-db'
import { syncAll } from '../lib/sync-engine'
import { createClient } from '@/lib/supabase/client'
import { useOnlineStatus } from '@/modules/auth/hooks/useOnlineStatus'
import { addTransaction as apiAddTransaction } from '@/lib/supabase/transactions'

export function useCashflow(profileId: string | undefined) {
  const [transactions, setTransactions] = useState<LocalTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [hasUnsynced, setHasUnsynced] = useState(false)
  const isOnline = useOnlineStatus()
  const supabase = createClient()

  // Load transactions from IndexedDB
  const loadLocalTransactions = useCallback(async () => {
    if (!profileId) return
    
    try {
      const local = await db.transactions
        .where('profile_id')
        .equals(profileId)
        .reverse()
        .sortBy('created_at')
      
      setTransactions(local)

      const unsyncedCount = await db.transactions
        .where('profile_id')
        .equals(profileId)
        .filter(t => t.synced_at === null)
        .count()
        
      setHasUnsynced(unsyncedCount > 0)
    } catch (e) {
      console.error('Error loading local transactions:', e)
    } finally {
      setLoading(false)
    }
  }, [profileId])

  // Initial load
  useEffect(() => {
    if (profileId) {
      loadLocalTransactions()
    }
  }, [profileId, loadLocalTransactions])

  // Sync trigger
  const triggerSync = useCallback(async () => {
    if (!profileId || !isOnline) return
    setIsSyncing(true)
    try {
      await syncAll(profileId)
      await loadLocalTransactions()
    } catch (e) {
      console.error('Sync failed:', e)
    } finally {
      setIsSyncing(false)
    }
  }, [profileId, isOnline, loadLocalTransactions])

  // Sync automatically on reconnect
  useEffect(() => {
    if (isOnline && profileId) {
      triggerSync()
    }
  }, [isOnline, profileId, triggerSync])

  // Realtime listener for cross-device updates
  useEffect(() => {
    if (!profileId) return

    const channel = supabase
      .channel(`public:transactions:profile_id=eq.${profileId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `profile_id=eq.${profileId}` },
        async () => {
          console.log('[Realtime] Transaction updated on server, triggering pull')
          await syncAll(profileId)
          await loadLocalTransactions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profileId, supabase, loadLocalTransactions])

  // Add transaction function
  const addTransaction = useCallback(async (data: {
    type: 'income' | 'expense'
    amount: number
    category: any
    note?: string
    entry_date: string
  }) => {
    if (!profileId) throw new Error('No profile loaded')

    await apiAddTransaction({
      profile_id: profileId,
      type: data.type,
      amount: data.amount,
      category: data.category,
      note: data.note,
      entry_date: data.entry_date
    })
    
    // Refresh local state instantly
    await loadLocalTransactions()
  }, [profileId, loadLocalTransactions])

  return {
    transactions,
    loading,
    isSyncing,
    hasUnsynced,
    triggerSync,
    addTransaction,
  }
}
