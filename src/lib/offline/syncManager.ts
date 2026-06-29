import {
  getPendingTransactions,
  getPendingContributions,
  markTransactionSynced,
  markContributionSynced,
} from './db'
import { syncOfflineEntries } from '../supabase/transactions'

let isSyncing = false

/**
 * Triggers flush of offline IndexedDB records to Supabase.
 */
export async function runSync() {
  if (typeof window === 'undefined') return
  if (!navigator.onLine) return
  if (isSyncing) return

  const pendingTxs = await getPendingTransactions()
  const pendingContribs = await getPendingContributions()

  if (pendingTxs.length === 0 && pendingContribs.length === 0) {
    return
  }

  isSyncing = true
  console.log(`[SyncManager] Flashing ${pendingTxs.length} transactions and ${pendingContribs.length} contributions...`)

  try {
    const result = await syncOfflineEntries()

    if (result && result.synced > 0) {
      const now = new Date()
      
      // Update local storage status
      for (const tx of pendingTxs) {
        await markTransactionSynced(tx.id, now)
      }
      for (const con of pendingContribs) {
        await markContributionSynced(con.id, now)
      }

      // Dispatch event to show a non-intrusive sync toast in UI
      const count = result.synced
      window.dispatchEvent(new CustomEvent('trustline-sync-complete', { detail: { count } }))
      console.log(`[SyncManager] Sync completed successfully: ${count} records synced.`)
    }
  } catch (err) {
    console.warn('[SyncManager] Background sync attempt failed (will retry next trigger):', err)
  } finally {
    isSyncing = false
  }
}

/**
 * Attaches browser network and visibility triggers to run sync automatically.
 */
export function registerSyncTriggers() {
  if (typeof window === 'undefined') return

  // 1. App visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      runSync().catch((err) => console.error('[SyncManager] Visibility sync error:', err))
    }
  })

  // 2. Online/offline connection change
  window.addEventListener('online', () => {
    runSync().catch((err) => console.error('[SyncManager] Online reconnect sync error:', err))
  })

  // 3. Service Worker background sync manager registrations
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration: any) => {
        if (registration && 'sync' in registration) {
          registration.sync
            .register('trustline-data-sync')
            .then(() => console.log('[SyncManager] Registered SW tag: trustline-data-sync'))
            .catch((err: any) => console.error('[SyncManager] SW sync registration failed:', err))
        }
      })
      .catch((err) => console.warn('[SyncManager] SW not ready for sync triggers:', err))
  }

  // Initial trigger run on startup
  runSync().catch((err) => console.error('[SyncManager] Startup sync error:', err))
}
