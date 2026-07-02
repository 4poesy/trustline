import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to calculate and save credit score for a single profile
async function calculateAndSaveScore(supabaseClient: any, profile_id: string): Promise<any> {
  const now = new Date()

  // 1. INCOME CONSISTENCY (30 pts)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(now.getDate() - 90)
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0]

  const { data: incomeTx, error: txError } = await supabaseClient
    .from('transactions')
    .select('entry_date, amount')
    .eq('profile_id', profile_id)
    .eq('type', 'income')
    .gte('entry_date', ninetyDaysAgoStr)

  if (txError) throw txError

  const distinctDays = new Set(incomeTx?.map((t: any) => t.entry_date) || [])
  const incomeConsistency = Math.min(30, (distinctDays.size / 90) * 30)

  // 2. INCOME VOLUME (20 pts)
  const totalVolume = (incomeTx || []).reduce((sum: number, t: any) => sum + Number(t.amount), 0)
  let incomeVolume = 0
  if (totalVolume >= 500000) {
    incomeVolume = 20
  } else if (totalVolume >= 200000) {
    incomeVolume = 15
  } else if (totalVolume >= 50000) {
    incomeVolume = 10
  }

  // 3. SAVINGS DISCIPLINE (25 pts)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(now.getMonth() - 6)

  const { data: memberships, error: memError } = await supabaseClient
    .from('group_members')
    .select('group_id, joined_at, savings_groups(cycle_frequency)')
    .eq('profile_id', profile_id)

  if (memError) throw memError

  let totalExpected = 0
  let totalActual = 0

  if (memberships && memberships.length > 0) {
    const groupIds = memberships.map((m: any) => m.group_id)
    const { data: contributions, error: conError } = await supabaseClient
      .from('contributions')
      .select('group_id')
      .eq('profile_id', profile_id)
      .gte('created_at', sixMonthsAgo.toISOString())

    if (conError) throw conError

    memberships.forEach((mem: any) => {
      const joinedDate = new Date(mem.joined_at)
      const activeSince = joinedDate > sixMonthsAgo ? joinedDate : sixMonthsAgo
      const diffMs = now.getTime() - activeSince.getTime()

      let expectedCycles = 0
      const freq = mem.savings_groups?.cycle_frequency

      if (freq === 'weekly') {
        expectedCycles = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)))
      } else if (freq === 'monthly') {
        expectedCycles = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4)))
      }

      totalExpected += expectedCycles
      totalActual += contributions?.filter((c: any) => c.group_id === mem.group_id).length || 0
    })
  }

  let savingsDiscipline = 0
  if (totalExpected > 0) {
    savingsDiscipline = Math.min(25, (totalActual / totalExpected) * 25)
  }

  // 4. REPUTATION (25 pts)
  const { data: reviews, error: revError } = await supabaseClient
    .from('reviews')
    .select('rating')
    .eq('reviewed_profile_id', profile_id)

  if (revError) throw revError

  let reputation = 0
  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    reputation = (avgRating / 5) * (Math.min(reviews.length, 50) / 50) * 25
  }

  // TOTAL & BAND
  const totalScore = Math.min(100, Math.round(incomeConsistency + incomeVolume + savingsDiscipline + reputation))
  let band = 'Building'
  if (totalScore >= 80) {
    band = 'Trusted'
  } else if (totalScore >= 60) {
    band = 'Good'
  } else if (totalScore >= 40) {
    band = 'Growing'
  }

  const payload = {
    score: totalScore,
    band,
    breakdown: {
      income_consistency: Number(incomeConsistency.toFixed(2)),
      income_volume: incomeVolume,
      savings_discipline: Number(savingsDiscipline.toFixed(2)),
      reputation: Number(reputation.toFixed(2)),
    },
  }

  // Save the result to the trust_metrics table
  const { error: upsertError } = await supabaseClient
    .from('trust_metrics')
    .upsert({
      profile_id,
      income_consistency_score: Number(incomeConsistency.toFixed(2)),
      income_consistency_label: incomeConsistency >= 24 ? 'High' : incomeConsistency >= 12 ? 'Medium' : 'Low',
      savings_discipline_score: Number(savingsDiscipline.toFixed(2)),
      savings_discipline_label: savingsDiscipline >= 20 ? 'High' : savingsDiscipline >= 10 ? 'Medium' : 'Low',
      reputation_score: Number(reputation.toFixed(2)),
      reputation_review_count: reviews?.length || 0,
      last_calculated_at: now.toISOString(),
    }, { onConflict: 'profile_id' })

  if (upsertError) throw upsertError

  return payload
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let profile_id: string | null = null
    try {
      const body = await req.json()
      profile_id = body.profile_id
    } catch {
      // Body is empty or not JSON, which is expected for direct cron calls
    }

    if (profile_id) {
      // Single user calculation
      const payload = await calculateAndSaveScore(supabaseClient, profile_id)
      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      // Daily cron mode: calculate and update scores for ALL profiles
      console.log('[Daily Cron] Running trust metrics calculation loop for all profiles...')
      const { data: profiles, error: profError } = await supabaseClient
        .from('profiles')
        .select('id')

      if (profError) throw profError

      let successCount = 0
      let errorCount = 0

      for (const prof of (profiles || [])) {
        try {
          await calculateAndSaveScore(supabaseClient, prof.id)
          successCount++
        } catch (err) {
          console.error(`[Daily Cron] Failed score calculation for profile ${prof.id}:`, err)
          errorCount++
        }
      }

      const summary = {
        status: 'completed',
        processed: successCount + errorCount,
        success: successCount,
        errors: errorCount,
      }

      console.log('[Daily Cron] Finished run:', summary)
      return new Response(JSON.stringify(summary), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (err: any) {
    console.error('Error executing calculate-credit-score:', err)
    return new Response(JSON.stringify({ error: err.message || err.toString() }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
