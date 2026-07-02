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

    let languageCode = 'en-NG'
    try {
      const url = new URL(req.url)
      const langParam = url.searchParams.get('lang')
      if (langParam) {
        languageCode = langParam
      } else {
        const body = await req.json()
        if (body.language_code) languageCode = body.language_code
      }
    } catch {
      // Body or query param missing is fine, fallback is en-NG
    }

    // 1. Fetch fallback translations (en-NG)
    const { data: fallbackData, error: fallbackErr } = await supabaseClient
      .from('translations')
      .select('translation_key, translation_value')
      .eq('language_code', 'en-NG')

    if (fallbackErr) throw fallbackErr

    // Create default dictionary
    const dictionary: Record<string, string> = {}
    if (fallbackData) {
      fallbackData.forEach((row: any) => {
        dictionary[row.translation_key] = row.translation_value
      })
    }

    // 2. Fetch language-specific translations if different from en-NG
    if (languageCode !== 'en-NG') {
      const { data: langData, error: langErr } = await supabaseClient
        .from('translations')
        .select('translation_key, translation_value')
        .eq('language_code', languageCode)

      if (langErr) throw langErr

      if (langData) {
        langData.forEach((row: any) => {
          dictionary[row.translation_key] = row.translation_value
        })
      }
    }

    return new Response(JSON.stringify(dictionary), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // cache for 1 hour
      }
    })

  } catch (err: any) {
    console.error('Error fetching translations:', err)
    return new Response(JSON.stringify({ error: err.message || err.toString() }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
