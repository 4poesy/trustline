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

export interface LocalPosTransaction {
  id: string
  profile_id: string
  transaction_type: 'cash_withdrawal' | 'bank_transfer' | 'airtime_purchase' | 'bill_payment' | 'account_opening' | 'balance_enquiry' | 'other'
  customer_amount: number
  fee_charged: number
  fee_waived: boolean
  terminal_id?: string | null
  note?: string
  entry_date: string
  created_at: string
  synced_at: string | null
}

export interface LocalPosFloat {
  profile_id: string
  cash_on_hand: number
  bank_balance: number
  minimum_float_needed?: number | null
  last_updated_at: string
  currency: string
}

export class CashflowDatabase extends Dexie {
  transactions!: Table<LocalTransaction, string>
  pos_transactions!: Table<LocalPosTransaction, string>
  pos_float_tracker!: Table<LocalPosFloat, string>

  constructor() {
    super('TrustlineCashflowDB')
    this.version(1).stores({
      transactions: 'id, profile_id, type, category, entry_date, created_at, synced_at'
    })
    this.version(2).stores({
      transactions: 'id, profile_id, type, category, entry_date, created_at, synced_at',
      pos_transactions: 'id, profile_id, transaction_type, entry_date, created_at, synced_at',
      pos_float_tracker: 'profile_id'
    })
  }
}

export const db = new CashflowDatabase()
