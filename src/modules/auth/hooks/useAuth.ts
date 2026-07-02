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
    // Clear any stale local session to avoid "Auth session missing!" errors during invocation
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (_) {}

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fecvmzybfzumyxcphpmp.supabase.co'
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

      const res = await fetch(`${supabaseUrl}/functions/v1/verify-trustline-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ trustline_code: trustlineCode, pin })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Login failed.')
      }

      if (data?.email && data?.password) {
        // Authenticate natively using Supabase GoTrue
        const { error: sessionErr } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        })

        if (sessionErr) {
          throw sessionErr
        }

        setProfile(data.profile)
        return { success: true }
      }

      throw new Error('No user credentials returned.')
    } catch (err: any) {
      console.error('[useAuth] Login failed:', err.message)
      return { error: typeof err === 'string' ? err : (err.message || 'Login failed. Please try again.') }
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
    // Clear any stale local session to avoid "Auth session missing!" errors during invocation
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (_) {}

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fecvmzybfzumyxcphpmp.supabase.co'
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

      const res = await fetch(`${supabaseUrl}/functions/v1/register-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Registration failed.')
      }

      if (data?.email && data?.password) {
        // Authenticate natively using Supabase GoTrue
        const { error: sessionErr } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
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

      throw new Error('No user credentials returned.')
    } catch (err: any) {
      console.error('[useAuth] Registration failed:', err.message)
      return { error: typeof err === 'string' ? err : (err.message || 'Registration failed. Please try again.') }
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
