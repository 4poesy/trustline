import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    // Connect to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString()

    // 1. Signups today
    const { count: signupsToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', yesterdayStr)

    // 2. Failed logins & rate
    const { data: attempts } = await supabase
      .from('login_attempts')
      .select('success')
      .gt('attempted_at', yesterdayStr)

    const totalAttempts = attempts?.length ?? 0
    const failedAttempts = attempts?.filter(a => !a.success).length ?? 0
    const failedLoginRate = totalAttempts > 0 ? (failedAttempts / totalAttempts) * 100 : 0

    // 3. Locked accounts
    const { count: currentlyLocked } = await supabase
      .from('account_locks')
      .select('*', { count: 'exact', head: true })
      .gt('locked_until', new Date().toISOString())

    // 4. Active sessions
    const { count: activeSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gt('expires_at', new Date().toISOString())

    // Threshold checks
    const alertBreached = failedLoginRate > 30 || (currentlyLocked ?? 0) > 50

    if (alertBreached) {
      const adminAlertContact = Deno.env.get('ADMIN_ALERT_CONTACT')
      const msg = `Trustline365 Alert:\n` +
        `- Failed login rate is ${failedLoginRate.toFixed(1)}% (Threshold: 30%)\n` +
        `- Currently locked accounts: ${currentlyLocked}\n` +
        `- Signups today: ${signupsToday}\n` +
        `- Active sessions: ${activeSessions}\n` +
        `Please check the authentication flow immediately.`

      console.warn('System Health Alert Breached!', msg)

      // Send via email or message if configured
      if (adminAlertContact) {
        // Send a request to Resend, Postmark, or Twilio WhatsApp API
        // E.g. console.log('Sending alert to:', adminAlertContact)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      stats: {
        signups_today: signupsToday,
        failed_login_rate_percent: failedLoginRate,
        currently_locked_accounts: currentlyLocked,
        active_sessions: activeSessions,
        alert_triggered: alertBreached
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
