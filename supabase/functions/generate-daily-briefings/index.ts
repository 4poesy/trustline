import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MOTIVATIONAL_TIPS = [
  "An organized stock room leads to organized sales. Restock early to capture morning buyers.",
  "A trader's reputation is their greatest credit score. Follow up on collections today.",
  "Consistent small savings protect your business during slow market weeks. Keep group contributions active.",
  "Trust is built in drop-by-drop transactions, but lost in buckets. Deliver on your P2P payments on time.",
  "A healthy trader builds a wealthy business. Rest well and hydrate during peak afternoon sun."
]

async function generateBriefingForProfile(supabaseClient: any, profileId: string, dateStr: string): Promise<any> {
  const now = new Date()
  
  // 1. Fetch Today's Tasks
  const { data: tasks, error: tasksErr } = await supabaseClient
    .from('planner_tasks')
    .select('id, title, task_type, urgency_level')
    .eq('profile_id', profileId)
    .eq('scheduled_date', dateStr)

  if (tasksErr) throw tasksErr

  const tasksCount = tasks?.length || 0
  const tasksBreakdown = (tasks || []).reduce((acc: any, t: any) => {
    acc[t.task_type] = (acc[t.task_type] || 0) + 1
    return acc
  }, {})

  // 2. Fetch Yesterday's Income
  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const { data: incomeTx, error: txErr } = await supabaseClient
    .from('transactions')
    .select('amount')
    .eq('profile_id', profileId)
    .eq('type', 'income')
    .eq('entry_date', yesterdayStr)

  if (txErr) throw txErr
  const yesterdayIncome = (incomeTx || []).reduce((sum: number, tx: any) => sum + Number(tx.amount), 0)

  // 3. Fetch Upcoming Financial Deadlines (due in next 3 days)
  const threeDaysLater = new Date()
  threeDaysLater.setDate(now.getDate() + 3)
  const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0]

  const { data: invoices, error: invErr } = await supabaseClient
    .from('invoices')
    .select('invoice_number, customer_name, amount, due_date')
    .eq('profile_id', profileId)
    .eq('status', 'sent')
    .lte('due_date', threeDaysLaterStr)

  if (invErr) throw invErr

  const financialDeadlines = (invoices || []).map((inv: any) => ({
    title: `Invoice ${inv.invoice_number} due from ${inv.customer_name}`,
    amount: Number(inv.amount),
    due_date: inv.due_date,
    module: 'invoices'
  }))

  // 4. Fetch Weather Preferences & Location
  const { data: pref, error: prefErr } = await supabaseClient
    .from('planner_preferences')
    .select('weather_alerts_enabled, location_for_weather, daily_income_target')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (prefErr) throw prefErr

  let weather = null
  if (pref?.weather_alerts_enabled && pref?.location_for_weather) {
    // Generate dummy forecast for location
    weather = {
      temp_max: 32,
      precip_sum: 0,
      alert_msg: `Dry and hot weather in ${pref.location_for_weather}. Stay hydrated and shade your storefront.`
    }
  }

  // 5. Pick Motivational Quote
  const hash = dateStr.split('-').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
  const motivationalTip = MOTIVATIONAL_TIPS[hash % MOTIVATIONAL_TIPS.length]

  // Compile Briefing Content
  const briefingContent = {
    tasks_today_count: tasksCount,
    tasks_breakdown: tasksBreakdown,
    yesterday_income: yesterdayIncome,
    yesterday_target_percent: pref?.daily_income_target ? Math.round((yesterdayIncome / Number(pref.daily_income_target)) * 100) : undefined,
    weather,
    financial_deadlines: financialDeadlines,
    motivational_tip: motivationalTip
  }

  // Upsert into daily_briefings
  const { data: briefing, error: upsertErr } = await supabaseClient
    .from('daily_briefings')
    .upsert({
      profile_id: profileId,
      briefing_date: dateStr,
      briefing_content: briefingContent,
      delivered_at: now.toISOString()
    }, { onConflict: 'profile_id, briefing_date' })
    .select()
    .single()

  if (upsertErr) throw upsertErr
  return briefing
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
    let dateStr = new Date().toISOString().split('T')[0]

    try {
      const body = await req.json()
      profile_id = body.profile_id
      if (body.date) dateStr = body.date
    } catch {
      // Empty or non-JSON body is expected for cron calls
    }

    if (profile_id) {
      // Single profile mode
      const briefing = await generateBriefingForProfile(supabaseClient, profile_id, dateStr)
      return new Response(JSON.stringify({ success: true, briefing }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      // Cron mode: run for all profiles
      console.log('[Cron] Generating briefings for all active profiles...')
      const { data: profiles, error: profError } = await supabaseClient
        .from('profiles')
        .select('id')

      if (profError) throw profError

      let successCount = 0
      for (const p of (profiles || [])) {
        try {
          await generateBriefingForProfile(supabaseClient, p.id, dateStr)
          successCount++
        } catch (err) {
          console.error(`Failed to generate briefing for profile ${p.id}:`, err)
        }
      }

      return new Response(JSON.stringify({ success: true, count: successCount }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (err: any) {
    console.error('Error generating daily briefings:', err)
    return new Response(JSON.stringify({ error: err.message || err.toString() }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
