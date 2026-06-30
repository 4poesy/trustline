'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface BillPayment {
  id: string
  profile_id: string
  type: 'airtime' | 'data' | 'electricity' | 'tv_subscription'
  provider_reference: string | null
  recipient_number: string
  network_or_provider: string
  amount: number
  status: 'pending' | 'successful' | 'failed'
  created_at: string
  completed_at: string | null
}

export function useBillPayments(profileId: string | undefined) {
  const [payments, setPayments] = useState<BillPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    if (!profileId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('bill_payments')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr
      setPayments(data || [])
    } catch (err: any) {
      console.error('Error fetching bill payments:', err)
      setError(err.message || 'Failed to load transaction history.')
    } finally {
      setLoading(false)
    }
  }, [profileId])

  useEffect(() => {
    if (profileId) {
      fetchPayments()
    }
  }, [profileId, fetchPayments])

  const processPayment = useCallback(
    async (params: {
      type: 'airtime' | 'data' | 'electricity' | 'tv_subscription'
      recipient_number: string
      network_or_provider: string
      amount: number
    }) => {
      if (!profileId) return { success: false, error: 'User is not logged in.' }

      setProcessing(true)
      setError(null)

      try {
        const { data, error: invokeErr } = await supabase.functions.invoke('process-bill-payment', {
          body: {
            profile_id: profileId,
            ...params
          }
        })

        if (invokeErr) {
          // Check for structured backend error
          let msg = invokeErr.message || 'Payment processing failed.'
          try {
            const context = JSON.parse(invokeErr.message)
            if (context.error) msg = context.error
          } catch {}
          throw new Error(msg)
        }

        if (data?.error) {
          throw new Error(data.error)
        }

        // Refresh list
        await fetchPayments()
        return { success: true, payment: data?.payment }
      } catch (err: any) {
        console.error('Payment execution error:', err)
        setError(err.message || 'Payment execution failed.')
        // Refresh list to show failed/pending log
        await fetchPayments()
        return { success: false, error: err.message || 'Payment execution failed.' }
      } finally {
        setProcessing(false)
      }
    },
    [profileId, fetchPayments]
  )

  return {
    payments,
    loading,
    processing,
    error,
    refresh: fetchPayments,
    processPayment
  }
}
