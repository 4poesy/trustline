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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { profile_id, title, body, data } = await req.json()

    if (!profile_id || !title || !body) {
      return new Response(JSON.stringify({ error: 'Missing profile_id, title, or body.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // 1. Fetch registered tokens for profile
    const { data: tokensList, error: tokensErr } = await supabaseClient
      .from('device_tokens')
      .select('token, platform')
      .eq('profile_id', profile_id)

    if (tokensErr) throw tokensErr

    if (!tokensList || tokensList.length === 0) {
      console.log(`[Push Notification] No device tokens registered for profile_id: ${profile_id}. Notification skipped.`);
      return new Response(JSON.stringify({ success: true, message: 'No registered tokens. Notification skipped.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 2. Dispatch push notification (mock FCM integration or real push)
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')
    const results = []

    for (const dt of tokensList) {
      if (!fcmServerKey) {
        // Mock FCM Broadcast
        console.log(`[FCM Mock Broadcast] To: ${dt.token} (${dt.platform}) | Title: ${title} | Body: ${body}`)
        results.push({ token: dt.token, status: 'success', provider: 'mock' })
      } else {
        // Real FCM Legacy API invocation
        try {
          const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Authorization': `key=${fcmServerKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              to: dt.token,
              notification: {
                title,
                body,
                sound: 'default'
              },
              data: data || {}
            })
          })

          const resText = await response.text()
          results.push({ token: dt.token, status: 'success', response: resText })
        } catch (e: any) {
          results.push({ token: dt.token, status: 'failed', error: e.message })
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, targets: results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    console.error('send-push-notification edge function error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
