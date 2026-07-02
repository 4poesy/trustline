'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { db, type LocalPosTransaction, type LocalPosFloat } from '@/modules/cashflow/db/cashflow-db'

export function usePos() {
  const { profile } = useAuth()
  const [floatTracker, setFloatTracker] = useState<LocalPosFloat | null>(null)
  const [loading, setLoading] = useState(true)

  // 1. Fetch/Sync Float Tracker
  const fetchFloatTracker = useCallback(async () => {
    if (!profile?.id) return
    try {
      // Load local float tracker first
      const localFloat = await db.pos_float_tracker.get(profile.id)
      if (localFloat) {
        setFloatTracker(localFloat)
      }

      // Load remote float tracker
      const { data, error } = await supabase
        .from('pos_float_tracker')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        const floatData: LocalPosFloat = {
          profile_id: data.profile_id,
          cash_on_hand: Number(data.cash_on_hand),
          bank_balance: Number(data.bank_balance),
          minimum_float_needed: data.minimum_float_needed ? Number(data.minimum_float_needed) : null,
          last_updated_at: data.last_updated_at,
          currency: data.currency
        }
        await db.pos_float_tracker.put(floatData)
        setFloatTracker(floatData)
      } else if (!localFloat) {
        // Initialize default float tracker
        const defaultFloat: LocalPosFloat = {
          profile_id: profile.id,
          cash_on_hand: 0,
          bank_balance: 0,
          minimum_float_needed: null,
          last_updated_at: new Date().toISOString(),
          currency: profile.currency_code || 'NGN'
        }
        await db.pos_float_tracker.put(defaultFloat)
        setFloatTracker(defaultFloat)
      }
    } catch (e) {
      console.error('Error fetching POS float tracker:', e)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.currency_code])

  useEffect(() => {
    if (profile?.id && profile?.pos_operator) {
      fetchFloatTracker()
    }
  }, [profile?.id, profile?.pos_operator, fetchFloatTracker])

  // 2. Update Float Tracker (Offline-First)
  const updateFloatTracker = useCallback(async (updates: Partial<Omit<LocalPosFloat, 'profile_id'>>) => {
    if (!profile?.id) return { error: 'Not authenticated' }
    try {
      const nowStr = new Date().toISOString()
      const currentFloat = floatTracker || {
        profile_id: profile.id,
        cash_on_hand: 0,
        bank_balance: 0,
        minimum_float_needed: null,
        last_updated_at: nowStr,
        currency: profile.currency_code || 'NGN'
      }

      const updatedFloat: LocalPosFloat = {
        ...currentFloat,
        ...updates,
        last_updated_at: nowStr
      }

      // 1. Write to local database
      await db.pos_float_tracker.put(updatedFloat)
      setFloatTracker(updatedFloat)

      // 2. Push to Supabase in background
      supabase
        .from('pos_float_tracker')
        .upsert({
          profile_id: profile.id,
          cash_on_hand: updatedFloat.cash_on_hand,
          bank_balance: updatedFloat.bank_balance,
          minimum_float_needed: updatedFloat.minimum_float_needed,
          last_updated_at: nowStr,
          currency: updatedFloat.currency
        }, { onConflict: 'profile_id' })
        .then(({ error }) => {
          if (error) console.warn('Background sync float tracker failed:', error)
        })

      return { success: true, data: updatedFloat }
    } catch (e: any) {
      console.error('Error updating float tracker:', e)
      return { error: e.message || e.toString() }
    }
  }, [profile?.id, profile?.currency_code, floatTracker])

  // 3. Log POS Transaction (Offline-First)
  const logPosTransaction = useCallback(async (tx: Omit<LocalPosTransaction, 'id' | 'profile_id' | 'created_at' | 'synced_at'>) => {
    if (!profile?.id) return { error: 'Not authenticated' }
    try {
      const txId = crypto.randomUUID()
      const nowStr = new Date().toISOString()

      const newTx: LocalPosTransaction = {
        ...tx,
        id: txId,
        profile_id: profile.id,
        created_at: nowStr,
        synced_at: null
      }

      // 1. Write POS transaction locally
      await db.pos_transactions.put(newTx)

      // 2. Local Trigger: If fee_charged > 0, write corresponding income row to main transactions table
      if (tx.fee_charged > 0 && !tx.fee_waived) {
        await db.transactions.put({
          id: txId, // share same UUID for easy offline identification
          profile_id: profile.id,
          type: 'income',
          amount: tx.fee_charged,
          category: 'POS Fee',
          entry_date: tx.entry_date,
          note: `POS fee — ₦${Number(tx.customer_amount).toLocaleString()} ${tx.transaction_type.replace('_', ' ')}`,
          created_at: nowStr,
          synced_at: null
        })
      }

      // 3. Adjust float tracker values automatically (withdrawal removes cash, transfer adds cash)
      if (tx.transaction_type === 'cash_withdrawal') {
        const totalDebit = tx.customer_amount + (tx.fee_waived ? 0 : tx.fee_charged)
        // Customer withdraws cash (cash goes down, bank settlement balance goes up)
        await updateFloatTracker({
          cash_on_hand: Math.max(0, (floatTracker?.cash_on_hand || 0) - tx.customer_amount),
          bank_balance: (floatTracker?.bank_balance || 0) + totalDebit
        })
      } else if (tx.transaction_type === 'bank_transfer') {
        const totalDebit = tx.customer_amount + (tx.fee_waived ? 0 : tx.fee_charged)
        // Operator sends transfer from bank (bank balance goes down, cash on hand goes up)
        await updateFloatTracker({
          cash_on_hand: (floatTracker?.cash_on_hand || 0) + totalDebit,
          bank_balance: Math.max(0, (floatTracker?.bank_balance || 0) - tx.customer_amount)
        })
      }

      // 4. Background Sync: push to Supabase
      supabase
        .from('pos_transactions')
        .insert({
          id: txId,
          profile_id: profile.id,
          transaction_type: tx.transaction_type,
          customer_amount: tx.customer_amount,
          fee_charged: tx.fee_charged,
          fee_waived: tx.fee_waived,
          terminal_id: tx.terminal_id,
          note: tx.note,
          entry_date: tx.entry_date,
          created_at: nowStr
        })
        .then(async ({ error }) => {
          if (error) {
            console.warn('Background sync POS transaction failed:', error)
          } else {
            // Update synced_at timestamp locally
            await db.pos_transactions.update(txId, { synced_at: new Date().toISOString() })
            if (tx.fee_charged > 0 && !tx.fee_waived) {
              await db.transactions.update(txId, { synced_at: new Date().toISOString() })
            }
          }
        })

      return { success: true, data: newTx }
    } catch (e: any) {
      console.error('Error logging POS transaction:', e)
      return { error: e.message || e.toString() }
    }
  }, [profile?.id, floatTracker, updateFloatTracker])

  // 4. Fetch POS Transactions for Date
  const fetchPosTransactions = useCallback(async (dateStr: string) => {
    if (!profile?.id) return []
    try {
      // Query local Dexie table for offline-first speed
      const txs = await db.pos_transactions
        .where('profile_id')
        .equals(profile.id)
        .and(t => t.entry_date === dateStr)
        .reverse()
        .sortBy('created_at')

      return txs as LocalPosTransaction[]
    } catch (e) {
      console.error('Error fetching local POS transactions:', e)
      return []
    }
  }, [profile?.id])

  // 5. Load POS Analytics
  const loadPosAnalytics = useCallback(async (daysLimit: number = 30) => {
    if (!profile?.id) return null
    try {
      const txs = await db.pos_transactions
        .where('profile_id')
        .equals(profile.id)
        .toArray()

      // filter last X days
      const limitDate = new Date()
      limitDate.setDate(limitDate.getDate() - daysLimit)
      const filteredTxs = txs.filter(t => new Date(t.entry_date) >= limitDate)

      const totalCount = filteredTxs.length
      const totalVolume = filteredTxs.reduce((sum, t) => sum + Number(t.customer_amount), 0)
      const totalFees = filteredTxs.reduce((sum, t) => sum + (t.fee_waived ? 0 : Number(t.fee_charged)), 0)

      // breakdown by type
      const typeBreakdown = filteredTxs.reduce((acc: any, t) => {
        acc[t.transaction_type] = (acc[t.transaction_type] || 0) + 1
        return acc
      }, {})

      // calculate busiest day of the week
      const dayCounts = [0, 0, 0, 0, 0, 0, 0] // Sun-Sat
      filteredTxs.forEach(t => {
        const d = new Date(t.entry_date).getDay()
        dayCounts[d]++
      })

      const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      let busiestDayIdx = 0
      let maxCount = 0
      dayCounts.forEach((cnt, idx) => {
        if (cnt > maxCount) {
          maxCount = cnt
          busiestDayIdx = idx
        }
      })

      // calculate peak hours
      const hourCounts: Record<number, number> = {}
      filteredTxs.forEach(t => {
        const hr = new Date(t.created_at).getHours()
        hourCounts[hr] = (hourCounts[hr] || 0) + 1
      })

      let peakHour = 12
      let peakCount = 0
      Object.entries(hourCounts).forEach(([hr, cnt]) => {
        if (cnt > peakCount) {
          peakCount = cnt
          peakHour = parseInt(hr, 10)
        }
      })

      return {
        totalCount,
        totalVolume,
        totalFees,
        typeBreakdown,
        busiestDay: maxCount > 0 ? weekDays[busiestDayIdx] : 'N/A',
        peakHour: peakCount > 0 ? `${peakHour}:00` : 'N/A',
        averageFee: totalCount > 0 ? Math.round(totalFees / totalCount) : 0
      }

    } catch (e) {
      console.error('Error generating POS analytics:', e)
      return null
    }
  }, [profile?.id])

  return {
    floatTracker,
    loading,
    updateFloatTracker,
    logPosTransaction,
    fetchPosTransactions,
    loadPosAnalytics,
    refreshFloatTracker: fetchFloatTracker
  }
}
