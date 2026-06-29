'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setProfile(data)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const sendOtp = useCallback(async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone })
    return { error }
  }, [supabase])

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
    return { data, error }
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [supabase])

  const createProfile = useCallback(async (profileData: {
    name: string
    role: 'trader' | 'service_provider' | 'group_member'
    business_type: string
    location: string
  }) => {
    if (!user) return { error: new Error('Not authenticated') }
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        phone_number: user.phone || '',
        ...profileData,
      })
      .select()
      .single()

    if (data) setProfile(data)
    return { data, error }
  }, [user, supabase])

  return {
    user,
    profile,
    loading,
    sendOtp,
    verifyOtp,
    signOut,
    createProfile,
    isAuthenticated: !!user,
    hasProfile: !!profile,
  }
}
