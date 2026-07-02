import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// CRC32 helper function for deterministic rollout cohort mapping
function crc32(str: string): number {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  
  let crc = 0 ^ (-1);
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
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

    // Parse input parameters
    const body = await req.json()
    const { country_code, kyc_tier, trust_score, profile_id } = body

    const userCountry = country_code || 'NG'
    const userKyc = Number(kyc_tier) || 0
    const userTrust = Number(trust_score) || 0
    const userId = profile_id || ''

    // 1. Fetch Global Flags
    const { data: globalFlags, error: gError } = await supabaseClient
      .from('feature_flags')
      .select('*')
      .is('country_code', null)

    if (gError) throw gError

    // 2. Fetch Country Specific Flags
    const { data: countryFlags, error: cError } = await supabaseClient
      .from('feature_flags')
      .select('*')
      .eq('country_code', userCountry)

    if (cError) throw cError

    // Create lookup map
    const flagsMap: Record<string, any> = {}
    if (globalFlags) {
      globalFlags.forEach((f: any) => {
        flagsMap[f.feature_key] = f
      })
    }

    // Merge: Country specific overrides global settings
    if (countryFlags) {
      countryFlags.forEach((f: any) => {
        flagsMap[f.feature_key] = f
      })
    }

    // Process evaluation
    const result: Record<string, boolean> = {}
    Object.keys(flagsMap).forEach((key) => {
      const flag = flagsMap[key]

      // Default disable
      if (!flag.is_enabled) {
        result[key] = false
        return
      }

      // Check KYC tier limit
      if (userKyc < flag.minimum_kyc_tier) {
        result[key] = false
        return
      }

      // Check Trust Score limit
      if (userTrust < Number(flag.minimum_trust_score)) {
        result[key] = false
        return
      }

      // Process deterministic rollout percentage cohort
      if (flag.rollout_percentage < 100) {
        if (!userId) {
          result[key] = false // Anonymous user doesn't pass rollout cohorts
          return
        }
        const userHash = crc32(userId + key) % 100
        if (userHash >= flag.rollout_percentage) {
          result[key] = false
          return
        }
      }

      result[key] = true
    })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('Error fetching feature flags:', err)
    return new Response(JSON.stringify({ error: err.message || err.toString() }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
