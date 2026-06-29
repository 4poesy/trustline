const { supabase, isDryRun, logAgentRun } = require('./utils')

function getBand(score) {
  if (score >= 80) return 'Trusted'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Growing'
  return 'Building'
}

/**
 * Trust Score Calculator Agent
 * Nightly cron worker that executes numerical scoring, saves histories,
 * updates metric caches, and triggers congratulations notifications when levels lift.
 */
async function runTrustScoreAgent() {
  try {
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('*')

    if (pError) throw pError

    let usersProcessed = 0
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(now.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    for (const profile of profiles) {
      // 1. Income Consistency (30 pts)
      const { data: txs } = await supabase
        .from('transactions')
        .select('entry_date')
        .eq('profile_id', profile.id)
        .eq('type', 'income')
        .gte('entry_date', thirtyDaysAgoStr)

      const uniqueDays = new Set(txs?.map(t => t.entry_date) || [])
      const incomeConsistencyPoints = Math.min(30, (uniqueDays.size / 30) * 30)

      // 2. Customer Reviews (25 pts)
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_profile_id', profile.id)

      let reviewPoints = 0
      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        const count = reviews.length
        reviewPoints = (avgRating / 5) * (Math.min(count, 50) / 50) * 25
      }

      // 3. Ajo Reliability (20 pts)
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('profile_id', profile.id)

      let ajoPoints = 20 // Default to 20 if they are not in any group
      if (memberships && memberships.length > 0) {
        const groupIds = memberships.map(m => m.group_id)
        const { data: groups } = await supabase
          .from('savings_groups')
          .select('id, current_cycle')
          .in('id', groupIds)

        const { data: contributions } = await supabase
          .from('contributions')
          .select('group_id, cycle_number')
          .eq('profile_id', profile.id)
          .in('group_id', groupIds)

        let expected = 0
        let paid = 0
        if (groups) {
          groups.forEach((g) => {
            expected += g.current_cycle
            const paidForGroup = contributions?.filter(c => c.group_id === g.id) || []
            const uniqueCycles = new Set(paidForGroup.map(c => c.cycle_number))
            paid += uniqueCycles.size
          })
        }
        ajoPoints = expected > 0 ? (paid / expected) * 20 : 20
      }

      // 4. Profile Completeness (15 pts)
      let completenessPoints = 0
      if (profile.phone_number) completenessPoints += 3.75
      if (profile.name) completenessPoints += 3.75
      if (profile.business_type) completenessPoints += 3.75
      if (profile.location) completenessPoints += 3.75

      // 5. Account Age (10 pts)
      const createdDate = new Date(profile.created_at || now)
      const diffTime = Math.abs(now.getTime() - createdDate.getTime())
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4))
      const agePoints = Math.min(10, diffMonths)

      // Total Calculation
      const totalScore = Math.round(incomeConsistencyPoints + reviewPoints + ajoPoints + completenessPoints + agePoints)
      const band = getBand(totalScore)

      if (isDryRun) {
        console.log(`[DRY-RUN] Score for ${profile.name}: ${totalScore} (${band})`)
      } else {
        const { data: lastScoreRecord } = await supabase
          .from('trust_scores')
          .select('band')
          .eq('profile_id', profile.id)
          .order('calculated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Insert score log
        await supabase
          .from('trust_scores')
          .insert({
            profile_id: profile.id,
            score: totalScore,
            band: band
          })

        // Upsert metric cache
        await supabase
          .from('trust_metrics')
          .upsert({
            profile_id: profile.id,
            income_consistency_score: Math.round((incomeConsistencyPoints / 30) * 100),
            savings_discipline_score: Math.round((ajoPoints / 20) * 100),
            reputation_score: reviews && reviews.length > 0 ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)) : 0,
            last_calculated_at: now.toISOString()
          })

        // Band upgrade triggers push alert
        if (lastScoreRecord && lastScoreRecord.band !== band) {
          const bandsList = ['Building', 'Growing', 'Good', 'Trusted']
          const oldIndex = bandsList.indexOf(lastScoreRecord.band)
          const newIndex = bandsList.indexOf(band)

          if (newIndex > oldIndex) {
            const congratsMsg = `Congratulations ${profile.name}! Your Trust Score reached a new level: ${band} (${totalScore}/100) 🎉`
            await supabase
              .from('notifications')
              .insert({
                profile_id: profile.id,
                title: 'New Trust Level Unlocked! 🌟',
                body: congratsMsg
              })

            console.log(`[OneSignal push] Dispatched congrats message to ${profile.name}`)
          }
        }
      }
      usersProcessed++
    }

    await logAgentRun('trustScoreAgent', 'success', `Recalculated trust score parameters for ${usersProcessed} profiles.`)
  } catch (err) {
    await logAgentRun('trustScoreAgent', 'error', err.message || err.toString())
  }
}

module.exports = {
  runTrustScoreAgent
}
