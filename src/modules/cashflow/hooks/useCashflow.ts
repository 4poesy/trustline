'use client'

import { useEffect, useState, useCallback } from 'react'
import { db, type LocalTransaction } from '../db/cashflow-db'
import { syncAll, pushLocalTransactions } from '../lib/sync-engine'
import { createClient } from '@/lib/supabase/client'
import { useOnlineStatus } from '@/modules/auth/hooks/useOnlineStatus'

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
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `profile_id=eq.${profileId}`,
        },
        async (payload) => {
          const newRemote = payload.new
          
          try {
            // Check if already in local DB
            const existing = await db.transactions.get(newRemote.id)
            if (!existing) {
              await db.transactions.add({
                id: newRemote.id,
                profile_id: newRemote.profile_id,
                type: newRemote.type as 'income' | 'expense',
                amount: Number(newRemote.amount),
                category: newRemote.category,
                note: newRemote.note || undefined,
                entry_date: newRemote.entry_date,
                created_at: newRemote.created_at,
                synced_at: newRemote.synced_at || new Date().toISOString()
              })
              await loadLocalTransactions()
            }
          } catch (e) {
            console.error('Realtime sync insert failed:', e)
          }
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
    category: string
    note?: string
    entry_date: string
  }) => {
    if (!profileId) throw new Error('No profile loaded')

    const newTx: LocalTransaction = {
      id: crypto.randomUUID(),
      profile_id: profileId,
      type: data.type,
      amount: data.amount,
      category: data.category,
      note: data.note,
      entry_date: data.entry_date,
      created_at: new Date().toISOString(),
      synced_at: null,
    }

    // Save to IndexedDB instantly
    await db.transactions.add(newTx)
    
    // Refresh local state instantly
    await loadLocalTransactions()

    // Trigger sync in background without blocking UI
    if (isOnline) {
      pushLocalTransactions(profileId)
        .then(() => loadLocalTransactions())
        .catch(err => console.warn('Background sync failed:', err))
    }
  }, [profileId, isOnline, loadLocalTransactions])

  return {
    transactions,
    loading,
    isSyncing,
    hasUnsynced,
    triggerSync,
    addTransaction,
  }
}
