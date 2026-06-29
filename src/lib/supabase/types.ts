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
    }
  }
}


