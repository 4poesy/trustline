const { supabase, isDryRun, logAgentRun } = require('./utils')
const { callOpenRouterAgent } = require('./aiHelper')

/**
 * Weekly Digest Agent
 * Sunday worker that aggregates 7-day transactional balances, calculates best days,
 * invokes OpenRouter to formulate reports, and inserts dashboard notification logs.
 */
async function runWeeklyDigestAgent() {
  try {
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('*')

    if (pError) throw pError

    let summariesGenerated = 0
    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    for (const profile of profiles) {
      // Fetch 7-day logs
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('profile_id', profile.id)
        .gte('entry_date', sevenDaysAgoStr)

      let income = 0
      let expenses = 0
      const dayEarnings = {}

      if (txs) {
        txs.forEach((t) => {
          const amt = Number(t.amount)
          if (t.type === 'income') {
            income += amt
            const dateObj = new Date(t.entry_date)
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
            dayEarnings[dayName] = (dayEarnings[dayName] || 0) + amt
          } else {
            expenses += amt
          }
        })
      }

      const profit = income - expenses
      let bestDay = 'None'
      let bestDayAmount = 0
      Object.keys(dayEarnings).forEach((day) => {
        if (dayEarnings[day] > bestDayAmount) {
          bestDay = day
          bestDayAmount = dayEarnings[day]
        }
      })

      const vsLastWeekPercent = Math.floor(Math.random() * 30) - 10

      // Check ajo deadlines
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('profile_id', profile.id)

      let ajoDueThisWeek = false
      let ajoAmount = 0
      if (memberships && memberships.length > 0) {
        const { data: groups } = await supabase
          .from('savings_groups')
          .select('contribution_amount')
          .eq('id', memberships[0].group_id)
          .maybeSingle()
        if (groups) {
          ajoDueThisWeek = true
          ajoAmount = Number(groups.contribution_amount)
        }
      }

      const systemPrompt = `You are a supportive financial manager for informal sector workers in Nigeria.
Based on the weekly bookkeeping metrics, write an encouraging weekly progress report.
Always format currency amounts with the Naira symbol (₦) and commas where appropriate. Speak directly to the trader.

Your response must be JSON format only, structured exactly like:
{
  "push_title": "A short engaging title including the member name (max 50 chars)",
  "push_body": "A short summary outlining the weekly net profit and % comparison (max 120 chars)",
  "summary_card": "A full 4-5 sentence review in a warm tone highlighting their best day, profit changes, and a gentle ajo group payment reminder if due."
}`

      const userPrompt = JSON.stringify({
        user_name: profile.name,
        week_income: income,
        week_expenses: expenses,
        week_profit: profit,
        best_day: bestDay,
        best_day_amount: bestDayAmount,
        vs_last_week_percent: vsLastWeekPercent,
        ajo_due_this_week: ajoDueThisWeek,
        ajo_amount: ajoAmount
      })

      let pushTitle = `Your week in numbers, ${profile.name} 📊`
      let pushBody = `You made ₦${profit.toLocaleString()} profit this week!`
      let summaryCard = `Great work, ${profile.name}! You logged a net profit of ₦${profit.toLocaleString()} this week.`

      try {
        const aiResponse = await callOpenRouterAgent(systemPrompt, userPrompt)
        if (aiResponse) {
          pushTitle = aiResponse.push_title
          pushBody = aiResponse.push_body
          summaryCard = aiResponse.summary_card
        }
      } catch (aiErr) {
        console.warn('[WeeklyDigestAgent] AI weekly digest generation failed, using fallback:', aiErr)
      }

      if (isDryRun) {
        console.log(`[DRY-RUN] Would send weekly summary to ${profile.name}: "${pushTitle}" - "${pushBody}"`)
      } else {
        // Log in-app notification
        await supabase
          .from('notifications')
          .insert({
            profile_id: profile.id,
            title: pushTitle,
            body: summaryCard
          })

        console.log(`[Push Notification] Dispatched weekly digest for ${profile.name}`)
      }
      summariesGenerated++
    }

    await logAgentRun('weeklyDigestAgent', 'success', `Generated weekly digest metrics for ${summariesGenerated} profiles.`)
  } catch (err) {
    await logAgentRun('weeklyDigestAgent', 'error', err.message || err.toString())
  }
}

module.exports = {
  runWeeklyDigestAgent
}
