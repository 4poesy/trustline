'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Load session on mount
  const checkSession = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Fetch custom profile using the session user ID (which is the profile ID)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        
        if (data) {
          setProfile(data)
        } else {
          // If profile doesn't exist, sign out to clear stale auth sessions
          await supabase.auth.signOut()
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
    } catch (e) {
      console.error('Error checking auth session:', e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          setProfile(data)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, checkSession])

  // Custom login using verify-trustline-login Edge Function
  const login = useCallback(async (trustlineCode: string, pin: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-trustline-login', {
        body: { trustline_code: trustlineCode, pin }
      })

      if (error) {
        throw new Error(error.message || 'Login failed.')
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      if (data?.session_token) {
        // Set the custom JWT session on the supabase client
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: data.session_token,
          refresh_token: ''
        })

        if (sessionErr) {
          throw sessionErr
        }

        setProfile(data.profile)
        return { success: true }
      }

      throw new Error('No session token returned.')
    } catch (err: any) {
      console.error('Login error:', err)
      return { error: err }
    }
  }, [supabase])

  // Custom signup using register-user Edge Function
  const signup = useCallback(async (formData: {
    trustline_code: string
    pin: string
    name: string
    role: 'trader' | 'service_provider' | 'group_member'
    business_type?: string
    location?: string
    phone_last4?: string
    public_username?: string
    recovery_question: string
    recovery_answer: string
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('register-user', {
        body: formData
      })

      if (error) {
        throw new Error(error.message || 'Registration failed.')
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      if (data?.session_token) {
        // Set the custom JWT session on the supabase client
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: data.session_token,
          refresh_token: ''
        })

        if (sessionErr) {
          throw sessionErr
        }

        // Fetch profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.profile_id)
          .single()

        setProfile(prof)
        return { success: true }
      }

      throw new Error('No session token returned.')
    } catch (err: any) {
      console.error('Signup error:', err)
      return { error: err }
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [supabase])

  return {
    user: profile ? { id: profile.id } : null, // Mock standard user object for compatibility
    profile,
    loading,
    login,
    signup,
    signOut,
    isAuthenticated: !!profile,
    hasProfile: !!profile,
  }
}
