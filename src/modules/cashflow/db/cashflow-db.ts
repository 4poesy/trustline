import Dexie, { type Table } from 'dexie'

export interface LocalTransaction {
  id: string // Client-generated UUID
  profile_id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  note?: string
  entry_date: string // YYYY-MM-DD format
  created_at: string // ISO string
  synced_at: string | null // ISO string or null
}

export class CashflowDatabase extends Dexie {
  transactions!: Table<LocalTransaction, string>

  constructor() {
    super('TrustlineCashflowDB')
    this.version(1).stores({
      // Primary key: id
      // Index fields we want to query by
      transactions: 'id, profile_id, type, category, entry_date, created_at, synced_at'
    })
  }
}

export const db = new CashflowDatabase()
