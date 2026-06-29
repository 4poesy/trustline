import { createClient } from '@/lib/supabase/server'

/**
 * Calculates and caches the user's trust metrics:
 * - Income Consistency: % of last 12 weeks with at least 1 logged transaction.
 * - Savings Discipline: % of contributions logged vs expected across all cycles.
 * - Reputation: Average rating of reviews.
 */
export async function calculateAndCacheTrustMetrics(profileId: string) {
  const supabase = await createClient()

  // 1. Calculate Income Consistency (Last 12 weeks)
  const now = new Date()
  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(now.getDate() - 12 * 7)
  const twelveWeeksAgoStr = twelveWeeksAgo.toISOString().split('T')[0]

  const { data: transactions } = await supabase
    .from('transactions')
    .select('entry_date')
    .eq('profile_id', profileId)
    .gte('entry_date', twelveWeeksAgoStr)

  let incomeConsistency = 0
  if (transactions && transactions.length > 0) {
    const weeksWithLogs = new Set<number>()
    transactions.forEach((tx) => {
      const txDate = new Date(tx.entry_date)
      const diffTime = Math.abs(now.getTime() - txDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const weekIndex = Math.floor(diffDays / 7)
      if (weekIndex >= 0 && weekIndex < 12) {
        weeksWithLogs.add(weekIndex)
      }
    })
    incomeConsistency = Math.round((weeksWithLogs.size / 12) * 100)
  }

  // 2. Calculate Savings Discipline
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('profile_id', profileId)

  let savingsDiscipline = 0
  if (memberships && memberships.length > 0) {
    const groupIds = memberships.map(m => m.group_id)

    const { data: groups } = await supabase
      .from('savings_groups')
      .select('id, current_cycle')
      .in('id', groupIds)

    const { data: contributions } = await supabase
      .from('contributions')
      .select('group_id, cycle_number')
      .eq('profile_id', profileId)
      .in('group_id', groupIds)

    let totalExpected = 0
    let totalPaid = 0

    if (groups) {
      groups.forEach((g) => {
        totalExpected += g.current_cycle
        const paidForGroup = contributions?.filter(c => c.group_id === g.id) || []
        const uniquePaidCycles = new Set(paidForGroup.map(c => c.cycle_number))
        totalPaid += uniquePaidCycles.size
      })
    }

    savingsDiscipline = totalExpected > 0 
      ? Math.min(100, Math.round((totalPaid / totalExpected) * 100))
      : 100
  } else {
    savingsDiscipline = 0 // Default to 0 if not in any group
  }

  // 3. Calculate Reputation
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewed_profile_id', profileId)

  let reputation = 0
  if (reviews && reviews.length > 0) {
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    reputation = Number(avg.toFixed(2))
  }

  // 4. Cache metrics in trust_metrics table
  const { data: cached, error } = await supabase
    .from('trust_metrics')
    .upsert({
      profile_id: profileId,
      income_consistency_score: incomeConsistency,
      savings_discipline_score: savingsDiscipline,
      reputation_score: reputation,
      last_calculated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error caching trust metrics:', error)
  }

  return cached || {
    profile_id: profileId,
    income_consistency_score: incomeConsistency,
    savings_discipline_score: savingsDiscipline,
    reputation_score: reputation,
    last_calculated_at: new Date().toISOString()
  }
}

/**
 * Fetches cached metrics, or calculates them if missing/expired (24 hours cache limit).
 */
export async function getTrustMetrics(profileId: string) {
  const supabase = await createClient()

  const { data: cached } = await supabase
    .from('trust_metrics')
    .select('*')
    .eq('profile_id', profileId)
    .single()

  const cacheAgeLimit = 24 * 60 * 60 * 1000 // 24 hours
  const isExpired = cached && (Date.now() - new Date(cached.last_calculated_at).getTime() > cacheAgeLimit)

  if (!cached || isExpired) {
    return await calculateAndCacheTrustMetrics(profileId)
  }

  return cached
}
