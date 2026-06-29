import Dexie from 'dexie'
import { supabase } from './supabase/client'

// Initialize a shared offline store for custom synchronization tracking
export const offlineDb = new Dexie('TrustlineOfflineCache')
offlineDb.version(2).stores({
  syncQueue: 'id, table, action, payload, timestamp',
  transactions: 'id, profile_id, type, amount, category, entry_date, synced_at',
  contributions: 'id, group_id, profile_id, amount, cycle_number, synced_at'
})

/**
 * Adds an item to the background synchronization queue.
 * Registers a service worker background sync tag if supported.
 */
export async function queueForSync(table, action, payload) {
  const syncItem = {
    id: payload.id || crypto.randomUUID(),
    table,
    action,
    payload,
    timestamp: Date.now()
  }

  await offlineDb.syncQueue.put(syncItem)

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register(`sync-${table}`)
      console.log(`[OfflineSync] Background sync registered for tag: sync-${table}`)
    } catch (err) {
      console.warn('[OfflineSync] Background sync registration failed. Executing fallback sync...', err)
      triggerSync(table).catch(syncErr => console.error('[OfflineSync] Fallback sync error:', syncErr))
    }
  } else {
    // Non-browser or unsupported environments fallback to instant execution
    triggerSync(table).catch(syncErr => console.error('[OfflineSync] Instantsync error:', syncErr))
  }
}

/**
 * Processes queued items for a table and resolves conflicts.
 * Conflict resolution strategy: Last-Write-Wins based on timestamps.
 */
export async function triggerSync(tableName) {
  const queuedItems = await offlineDb.syncQueue
    .where('table')
    .equals(tableName)
    .toArray()

  if (queuedItems.length === 0) return

  console.log(`[OfflineSync] Commencing sync for ${queuedItems.length} items in: ${tableName}`)

  for (const item of queuedItems) {
    const { table, action, payload } = item

    try {
      if (action === 'insert' || action === 'update' || action === 'upsert') {
        const { data: remoteRecord } = await supabase
          .from(table)
          .select('updated_at')
          .eq('id', payload.id)
          .maybeSingle()

        // Evaluate Last-Write-Wins conflict resolution rule
        if (remoteRecord && remoteRecord.updated_at) {
          const remoteTime = new Date(remoteRecord.updated_at).getTime()
          const localTime = item.timestamp

          // If the remote version is newer, skip saving local payload (Remote Wins)
          if (remoteTime > localTime) {
            console.log(`[OfflineSync] Conflict resolved (Remote Wins) for ${table}:${payload.id}`)
            await offlineDb.syncQueue.delete(item.id)
            continue
          }
        }

        // Push local changes to Supabase
        const { error } = await supabase
          .from(table)
          .upsert({
            ...payload,
            updated_at: new Date(item.timestamp).toISOString()
          })

        if (error) throw error
      }

      await offlineDb.syncQueue.delete(item.id)
    } catch (err) {
      console.error(`[OfflineSync] Sync failed for queue ID ${item.id}:`, err)
      throw err; // Propagation ensures background sync retries
    }
  }
}
