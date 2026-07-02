export interface Profile {
  id: string
  phone_number?: string | null
  name: string
  role: 'trader' | 'service_provider' | 'group_member'
  business_type: string
  location: string
  wallet_balance: number
  currency: string
  created_at: string
  updated_at: string
  trustline_code: string
  pin_hash: string
  phone_last4?: string | null
  public_username?: string | null
  recovery_answer_hash?: string | null
  recovery_question?: string | null
  country_code?: string
  pos_operator?: boolean
  pos_terminal_count?: number
  pos_bank_provider?: string | null
  pos_location_description?: string | null
  language_code?: string
  currency_code?: string
  timezone?: string
}

export interface WalletTransaction {
  id: string
  profile_id: string
  type: 'deposit' | 'withdrawal' | 'bill_payment' | 'transfer'
  amount: number
  currency: string
  description?: string
  payment_method: 'card' | 'bank_transfer' | 'wallet'
  reference: string
  status: 'pending' | 'successful' | 'failed'
  created_at: string
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

export interface Listing {
  id: string
  profile_id: string
  slug: string
  display_name: string
  category: string
  location: string
  bio?: string
  is_public: boolean
  created_at: string
}

export interface Review {
  id: string
  reviewed_profile_id: string
  reviewer_profile_id?: string | null
  rating: number
  comment?: string
  verified_transaction: boolean
  created_at: string
}

export interface SavingsGroup {
  id: string
  name: string
  created_by_profile_id: string
  contribution_amount: number
  cycle_frequency: 'weekly' | 'monthly'
  payout_order: string[] // profile_ids array
  current_cycle: number
  invite_code: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  profile_id: string
  joined_at: string
}

export interface Contribution {
  id: string
  group_id: string
  profile_id: string
  amount: number
  cycle_number: number
  created_at: string
  synced_at?: string | null
}

export interface TrustMetrics {
  profile_id: string
  income_consistency_score: number
  savings_discipline_score: number
  reputation_score: number
  last_calculated_at: string
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
      listings: {
        Row: Listing
        Insert: Omit<Listing, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Listing, 'id' | 'created_at'>>
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Review, 'id' | 'created_at'>>
      }
      savings_groups: {
        Row: SavingsGroup
        Insert: Omit<SavingsGroup, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<SavingsGroup, 'id' | 'created_at'>>
      }
      group_members: {
        Row: GroupMember
        Insert: Omit<GroupMember, 'joined_at'> & { joined_at?: string }
        Update: Partial<Omit<GroupMember, 'id' | 'joined_at'>>
      }
      contributions: {
        Row: Contribution
        Insert: Omit<Contribution, 'created_at' | 'synced_at'> & { created_at?: string; synced_at?: string | null }
        Update: Partial<Omit<Contribution, 'id' | 'created_at'>>
      }
      trust_metrics: {
        Row: TrustMetrics
        Insert: TrustMetrics
        Update: Partial<Omit<TrustMetrics, 'profile_id'>>
      }
    }
  }
}



