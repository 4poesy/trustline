import Dexie, { type Table } from 'dexie'

export interface LocalContribution {
  id: string // Client-generated UUID
  group_id: string
  profile_id: string
  amount: number
  cycle_number: number
  created_at: string // ISO string
  synced_at: string | null // ISO string or null
}

export class SavingsDatabase extends Dexie {
  contributions!: Table<LocalContribution, string>

  constructor() {
    super('TrustlineSavingsDB')
    this.version(1).stores({
      contributions: 'id, group_id, profile_id, cycle_number, created_at, synced_at'
    })
  }
}

export const savingsDb = new SavingsDatabase()
