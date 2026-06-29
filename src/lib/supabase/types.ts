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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
    }
  }
}
