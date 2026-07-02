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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Count distinct keys in baseline 'en-NG'
    const { count: baselineCount, error: baselineErr } = await supabaseClient
      .from('translations')
      .select('*', { count: 'exact', head: true })
      .eq('language_code', 'en-NG')

    if (baselineErr) throw baselineErr

    const totalKeys = baselineCount || 0
    if (totalKeys === 0) {
      return new Response(JSON.stringify({ message: 'No translation keys in en-NG baseline.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Fetch all languages
    const { data: languages, error: langErr } = await supabaseClient
      .from('languages')
      .select('code, name')

    if (langErr) throw langErr

    const alerts: string[] = []
    const updates = []

    for (const lang of languages || []) {
      if (lang.code === 'en-NG') {
        // en-NG is always 100%
        await supabaseClient
          .from('languages')
          .update({ completion_percentage: 100 })
          .eq('code', 'en-NG')
        continue
      }

      // Count keys in this language where translation_value is non-empty
      const { data: langKeys, error: keysErr } = await supabaseClient
        .from('translations')
        .select('translation_key, translation_value')
        .eq('language_code', lang.code)

      if (keysErr) throw keysErr

      const translatedCount = (langKeys || []).filter(k => k.translation_value && k.translation_value.trim() !== '').length
      const completeness = Math.round((translatedCount / totalKeys) * 100)

      // Update completion percentage
      const { error: updateErr } = await supabaseClient
        .from('languages')
        .update({ completion_percentage: completeness })
        .eq('code', lang.code)

      if (updateErr) throw updateErr

      updates.push({ language: lang.name, code: lang.code, completeness })

      // Send alert warning if drops below 90%
      if (completeness < 90) {
        const missingCount = totalKeys - translatedCount
        const alertMsg = `Trustline Alert: ${lang.name} translations are now ${completeness}% complete. ${missingCount} new strings need translation.`
        alerts.push(alertMsg)
        console.warn(alertMsg)
        
        // Simulating email/SMS dispatch or dashboard notification for administrators:
        await supabaseClient.from('notifications').insert({
          title: `i18n Warning: ${lang.name}`,
          content: alertMsg,
          user_id: null, // global broadcast / admin group
          type: 'system_alert'
        }).maybeSingle()
      }
    }

    return new Response(JSON.stringify({ success: true, totalKeys, updates, alerts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('Error calculating completeness:', err)
    return new Response(JSON.stringify({ error: err.message || err.toString() }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
