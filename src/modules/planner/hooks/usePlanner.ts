'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { PlannerPreferences, PlannerTask, DailyBriefing } from '../types'
import { db } from '@/modules/cashflow/db/cashflow-db'

export function usePlanner() {
  const { profile } = useAuth()
  const [preferences, setPreferences] = useState<PlannerPreferences | null>(null)
  const [loading, setLoading] = useState(true)

  // 1. Fetch/Initialize Planner Preferences
  const fetchPreferences = useCallback(async () => {
    if (!profile?.id) return
    try {
      const { data, error } = await supabase
        .from('planner_preferences')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setPreferences(data as PlannerPreferences)
      } else {
        // Create default preferences
        const defaults: PlannerPreferences = {
          profile_id: profile.id,
          wake_up_time: '06:00',
          sleep_time: '22:00',
          morning_briefing_enabled: true,
          evening_summary_enabled: true,
          prayer_times_enabled: false,
          prayer_location: null,
          daily_income_target: null,
          currency: profile.currency || 'NGN',
          weekly_market_days: [],
          weather_alerts_enabled: false,
          location_for_weather: profile.location || null
        }
        const { data: inserted, error: insertError } = await supabase
          .from('planner_preferences')
          .insert(defaults)
          .select()
          .single()

        if (insertError) throw insertError
        setPreferences(inserted as PlannerPreferences)
      }
    } catch (e) {
      console.error('Error fetching planner preferences:', e)
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    if (profile?.id) {
      fetchPreferences()
    }
  }, [profile?.id, fetchPreferences])

  // 2. Update Preferences
  const updatePreferences = useCallback(async (updates: Partial<PlannerPreferences>) => {
    if (!profile?.id) return { error: 'Not authenticated' }
    try {
      const { data, error } = await supabase
        .from('planner_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('profile_id', profile.id)
        .select()
        .single()

      if (error) throw error
      setPreferences(data as PlannerPreferences)
      return { success: true, data }
    } catch (e: any) {
      console.error('Error updating planner preferences:', e)
      return { error: e.message || e.toString() }
    }
  }, [profile?.id])

  // 3. Fetch Tasks for a specific date
  const fetchTasksForDate = useCallback(async (dateStr: string) => {
    if (!profile?.id) return []
    try {
      const { data, error } = await supabase
        .from('planner_tasks')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('scheduled_date', dateStr)
        .order('scheduled_time', { ascending: true, nullsFirst: true })

      if (error) throw error
      return data as PlannerTask[]
    } catch (e) {
      console.error('Error fetching planner tasks:', e)
      return []
    }
  }, [profile?.id])

  // 4. Fetch Overdue Tasks (missed/pending tasks before today)
  const fetchOverdueTasks = useCallback(async (todayStr: string) => {
    if (!profile?.id) return []
    try {
      const { data, error } = await supabase
        .from('planner_tasks')
        .select('*')
        .eq('profile_id', profile.id)
        .lt('scheduled_date', todayStr)
        .in('status', ['pending', 'snoozed'])
        .order('scheduled_date', { ascending: true })

      if (error) throw error
      return data as PlannerTask[]
    } catch (e) {
      console.error('Error fetching overdue tasks:', e)
      return []
    }
  }, [profile?.id])

  // 5. Add Task
  const addTask = useCallback(async (task: Omit<PlannerTask, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    if (!profile?.id) return { error: 'Not authenticated' }
    try {
      // Create task
      const { data, error } = await supabase
        .from('planner_tasks')
        .insert({
          ...task,
          profile_id: profile.id
        })
        .select()
        .single()

      if (error) throw error

      // Call Edge Function to schedule notifications
      if (task.scheduled_time && task.reminder_profile !== 'none') {
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fecvmzybfzumyxcphpmp.supabase.co'}/functions/v1/schedule-task-notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
          },
          body: JSON.stringify({ task_id: data.id })
        }).catch(err => console.warn('Could not trigger notification scheduler edge function:', err))
      }

      return { success: true, data: data as PlannerTask }
    } catch (e: any) {
      console.error('Error adding task:', e)
      return { error: e.message || e.toString() }
    }
  }, [profile?.id])

  // 6. Update Task
  const updateTask = useCallback(async (taskId: string, updates: Partial<PlannerTask>) => {
    if (!profile?.id) return { error: 'Not authenticated' }
    try {
      const { data, error } = await supabase
        .from('planner_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('profile_id', profile.id)
        .select()
        .single()

      if (error) throw error

      // Re-trigger notification scheduler if time or reminder changed
      if (updates.scheduled_time !== undefined || updates.reminder_profile !== undefined || updates.scheduled_date !== undefined) {
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fecvmzybfzumyxcphpmp.supabase.co'}/functions/v1/schedule-task-notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
          },
          body: JSON.stringify({ task_id: taskId })
        }).catch(err => console.warn('Could not trigger notification scheduler edge function:', err))
      }

      return { success: true, data: data as PlannerTask }
    } catch (e: any) {
      console.error('Error updating task:', e)
      return { error: e.message || e.toString() }
    }
  }, [profile?.id])

  // 7. Delete Task
  const deleteTask = useCallback(async (taskId: string) => {
    if (!profile?.id) return { error: 'Not authenticated' }
    try {
      const { error } = await supabase
        .from('planner_tasks')
        .delete()
        .eq('id', taskId)
        .eq('profile_id', profile.id)

      if (error) throw error
      return { success: true }
    } catch (e: any) {
      console.error('Error deleting task:', e)
      return { error: e.message || e.toString() }
    }
  }, [profile?.id])

  // 8. Fetch Daily Briefing
  const fetchBriefing = useCallback(async (dateStr: string) => {
    if (!profile?.id) return null
    try {
      const { data, error } = await supabase
        .from('daily_briefings')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('briefing_date', dateStr)
        .maybeSingle()

      if (error) throw error
      return data as DailyBriefing | null
    } catch (e) {
      console.error('Error fetching briefing:', e)
      return null
    }
  }, [profile?.id])

  // 9. Fetch Daily Income Progress (offline first + online check)
  const getDailyIncomeProgress = useCallback(async (dateStr: string) => {
    if (!profile?.id) return 0
    try {
      // First check local Dexie DB for offline speed
      const txs = await db.table('transactions')
        .where('profile_id')
        .equals(profile.id)
        .and(t => t.type === 'income' && t.entry_date === dateStr)
        .toArray()

      const localTotal = txs.reduce((sum, t) => sum + t.amount, 0)
      return localTotal
    } catch (e) {
      console.error('Error calculating offline cashflow progress:', e)
      return 0
    }
  }, [profile?.id])

  return {
    preferences,
    loading,
    updatePreferences,
    fetchTasksForDate,
    fetchOverdueTasks,
    addTask,
    updateTask,
    deleteTask,
    fetchBriefing,
    getDailyIncomeProgress,
    refreshPreferences: fetchPreferences
  }
}
