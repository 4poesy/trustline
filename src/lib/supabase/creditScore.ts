import { supabase } from './client'

const CACHE_KEY_PREFIX = 'trustline_credit_score_cache'

interface ScoreCacheEntry {
  timestamp: number
  data: {
    score: number
    band: string
    breakdown: {
      income_consistency: number
      income_volume: number
      savings_discipline: number
      reputation: number
    }
  }
}

/**
 * Retrieves computed user credit score from Supabase Deno Edge Function.
 * Caches results in sessionStorage for 5 minutes.
 */
export async function getCreditScore(profileId: string) {
  if (typeof window !== 'undefined') {
    try {
      const cached = sessionStorage.getItem(`${CACHE_KEY_PREFIX}_${profileId}`)
      if (cached) {
        const entry: ScoreCacheEntry = JSON.parse(cached)
        const fiveMinutes = 5 * 60 * 1000
        if (Date.now() - entry.timestamp < fiveMinutes) {
          return { data: entry.data, error: null }
        }
      }
    } catch (err) {
      console.warn('[CreditScoreAPI] Error reading sessionStorage cache:', err)
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke('calculate-credit-score', {
      body: { profile_id: profileId },
    })

    if (error) throw error

    if (data && typeof window !== 'undefined') {
      try {
        const entry: ScoreCacheEntry = {
          timestamp: Date.now(),
          data,
        }
        sessionStorage.setItem(`${CACHE_KEY_PREFIX}_${profileId}`, JSON.stringify(entry))
      } catch (err) {
        console.warn('[CreditScoreAPI] Error writing sessionStorage cache:', err)
      }
    }

    return { data, error: null }
  } catch (err: any) {
    console.error('[CreditScoreAPI] Edge function call failed, using baseline fallback:', err)
    return {
      data: {
        score: 0,
        band: 'Building',
        breakdown: {
          income_consistency: 0,
          income_volume: 0,
          savings_discipline: 0,
          reputation: 0,
        },
      },
      error: err.message || err.toString(),
    }
  }
}
