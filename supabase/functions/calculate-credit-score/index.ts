import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { profile_id } = await req.json()
    if (!profile_id) {
      return new Response(JSON.stringify({ error: 'Missing profile_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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

    const distinctDays = new Set(incomeTx?.map((t) => t.entry_date) || [])
    const incomeConsistency = Math.min(30, (distinctDays.size / 90) * 30)

    // 2. INCOME VOLUME (20 pts)
    const totalVolume = (incomeTx || []).reduce((sum, t) => sum + Number(t.amount), 0)
    let incomeVolume = 5
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

    // Get all groups the user is a member of
    const { data: memberships, error: memError } = await supabaseClient
      .from('group_members')
      .select('group_id, joined_at, savings_groups(cycle_frequency)')
      .eq('profile_id', profile_id)

    if (memError) throw memError

    let totalExpected = 0
    let totalActual = 0

    if (memberships && memberships.length > 0) {
      const groupIds = memberships.map((m) => m.group_id)
      const { data: contributions, error: conError } = await supabaseClient
        .from('contributions')
        .select('group_id')
        .eq('profile_id', profile_id)
        .gte('created_at', sixMonthsAgo.toISOString())

      if (conError) throw conError

      memberships.forEach((mem) => {
        const joinedDate = new Date(mem.joined_at)
        const activeSince = joinedDate > sixMonthsAgo ? joinedDate : sixMonthsAgo
        const diffMs = now.getTime() - activeSince.getTime()

        let expectedCycles = 0
        const freq = mem.savings_groups?.cycle_frequency

        if (freq === 'weekly') {
          // weeks active
          expectedCycles = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)))
        } else if (freq === 'monthly') {
          // months active
          expectedCycles = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4)))
        }

        totalExpected += expectedCycles
        totalActual += contributions?.filter((c) => c.group_id === mem.group_id).length || 0
      })
    }

    let savingsDiscipline = 25 // Default to 25 if not in any savings group
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
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
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

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
