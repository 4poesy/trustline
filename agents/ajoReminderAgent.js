const { supabase, isDryRun, logAgentRun } = require('./utils')
const { callOpenRouterAgent } = require('./aiHelper')

/**
 * Ajo Payment Reminder Agent
 * Queries savings groups, detects members who haven't paid their current cycle,
 * generates warm notifications using OpenRouter, and dispatches them.
 */
async function runAjoReminderAgent() {
  try {
    const { data: groups, error: gError } = await supabase
      .from('savings_groups')
      .select('*')

    if (gError) throw gError

    let remindersSent = 0

    for (const group of groups) {
      // Fetch members of this savings group
      const { data: members, error: mError } = await supabase
        .from('group_members')
        .select('*, profiles(id, name, phone_number)')
        .eq('group_id', group.id)

      if (mError) {
        console.error(`[AjoReminderAgent] Error fetching members for group ${group.id}:`, mError)
        continue
      }

      // Fetch contributions logged in current cycle
      const { data: contributions, error: cError } = await supabase
        .from('contributions')
        .select('*')
        .eq('group_id', group.id)
        .eq('cycle_number', group.current_cycle)

      if (cError) {
        console.error(`[AjoReminderAgent] Error fetching contributions for group ${group.id}:`, cError)
        continue
      }

      const paidMemberIds = new Set(contributions.map(c => c.profile_id))

      for (const member of members) {
        const profile = member.profiles
        if (!profile) continue

        // If member hasn't paid, dispatch a reminder
        if (!paidMemberIds.has(profile.id)) {
          const systemPrompt = `You are an operational assistant for Trustline PWA.
Write a warm, non-threatening, encouraging reminder (max 2 sentences, Yoruba-English friendly tone) for a market vendor.
Variables: name, group name, contribution amount.
Output JSON format only:
{
  "message": "Warm reminder message."
}`
          const userPrompt = JSON.stringify({
            name: profile.name,
            group_name: group.name,
            contribution_amount: `₦${Number(group.contribution_amount).toLocaleString()}`
          })

          let messageText = `Hi ${profile.name}, your ajo contribution of ₦${Number(group.contribution_amount).toLocaleString()} for ${group.name} is due. Please log your payment.`
          
          try {
            const aiResponse = await callOpenRouterAgent(systemPrompt, userPrompt)
            if (aiResponse && aiResponse.message) {
              messageText = aiResponse.message
            }
          } catch (aiErr) {
            console.warn('[AjoReminderAgent] AI message generation failed, using fallback:', aiErr)
          }

          if (isDryRun) {
            console.log(`[DRY-RUN] Would dispatch reminder to ${profile.name} (${profile.phone_number}): "${messageText}"`)
          } else {
            // Write to notifications table
            await supabase
              .from('notifications')
              .insert({
                profile_id: profile.id,
                title: 'Ajo Contribution Due ⏰',
                body: messageText
              })

            // Mock external APIs
            console.log(`[OneSignal Push] Dispatched to user ID ${profile.id}`)
            if (profile.phone_number) {
              console.log(`[Africa's Talking WhatsApp] Dispatched to phone ${profile.phone_number}`)
            }
          }
          remindersSent++
        }
      }
    }

    await logAgentRun('ajoReminderAgent', 'success', `Ajo payment reminders agent processed successfully. Reminders sent: ${remindersSent}`)
  } catch (err) {
    await logAgentRun('ajoReminderAgent', 'error', err.message || err.toString())
  }
}

module.exports = {
  runAjoReminderAgent
}
