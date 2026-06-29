export interface Profile {
  id: string
  phone_number: string
  name: string
  role: 'trader' | 'service_provider' | 'group_member'
  business_type: string
  location: string
  created_at: string
  updated_at: string
}

export type UserRole = Profile['role']

export interface Transaction {
  id: string
  profile_id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  note?: string
  entry_date: string
  created_at: string
  synced_at?: string | null
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'created_at' | 'synced_at'> & { created_at?: string; synced_at?: string | null }
        Update: Partial<Omit<Transaction, 'id' | 'created_at'>>
      }
    }
  }
}

