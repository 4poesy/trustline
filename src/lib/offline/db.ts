import { openDB, type IDBPDatabase } from 'idb'

let dbPromise: Promise<IDBPDatabase> | null = null

/**
 * Initializes the IndexedDB database structure with schema version 1.
 */
export function initDB() {
  if (typeof window === 'undefined') return null

  if (!dbPromise) {
    dbPromise = openDB('trustline-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' })
          txStore.createIndex('profile_id', 'profile_id', { unique: false })
          txStore.createIndex('synced_at', 'synced_at', { unique: false })
          txStore.createIndex('entry_date', 'entry_date', { unique: false })
        }

        if (!db.objectStoreNames.contains('contributions')) {
          const conStore = db.createObjectStore('contributions', { keyPath: 'id' })
          conStore.createIndex('group_id', 'group_id', { unique: false })
          conStore.createIndex('profile_id', 'profile_id', { unique: false })
          conStore.createIndex('synced_at', 'synced_at', { unique: false })
        }
      },
    })
  }

  return dbPromise
}

/**
 * Saves a transaction to the offline object store.
 */
export async function saveTransaction(tx: any) {
  const db = await initDB()
  if (!db) return
  await db.put('transactions', tx)
}

/**
 * Scans transactions store to get all entries not yet uploaded to server.
 */
export async function getPendingTransactions() {
  const db = await initDB()
  if (!db) return []
  const txs = await db.getAll('transactions')
  return txs.filter((t: any) => t.synced_at === null || t.synced_at === undefined)
}

/**
 * Marks an offline transaction as successfully synchronized.
 */
export async function markTransactionSynced(id: string, syncedAt: Date) {
  const db = await initDB()
  if (!db) return
  const tx = await db.get('transactions', id)
  if (tx) {
    tx.synced_at = syncedAt.toISOString()
    await db.put('transactions', tx)
  }
}

/**
 * Saves a contribution to the offline object store.
 */
export async function saveContribution(contrib: any) {
  const db = await initDB()
  if (!db) return
  await db.put('contributions', contrib)
}

/**
 * Scans contributions store to get all entries not yet uploaded to server.
 */
export async function getPendingContributions() {
  const db = await initDB()
  if (!db) return []
  const contribs = await db.getAll('contributions')
  return contribs.filter((c: any) => c.synced_at === null || c.synced_at === undefined)
}

/**
 * Marks an offline contribution as successfully synchronized.
 */
export async function markContributionSynced(id: string, syncedAt: Date) {
  const db = await initDB()
  if (!db) return
  const contrib = await db.get('contributions', id)
  if (contrib) {
    contrib.synced_at = syncedAt.toISOString()
    await db.put('contributions', contrib)
  }
}
