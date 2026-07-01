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

    const { profile_id, bvn, nin, document_type, document_url, selfie_url, requested_tier } = await req.json()

    if (!profile_id) {
      return new Response(JSON.stringify({ error: 'Missing profile_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // 1. Get or create kyc_profiles row
    const { data: currentKyc, error: kycError } = await supabaseClient
      .from('kyc_profiles')
      .select('*')
      .eq('profile_id', profile_id)
      .single()

    let kycId = currentKyc?.id
    let currentTier = currentKyc?.tier ?? 0

    if (kycError && kycError.code !== 'PGRST116') {
      throw kycError
    }

    if (!currentKyc) {
      const { data: newKyc, error: createError } = await supabaseClient
        .from('kyc_profiles')
        .insert({
          profile_id,
          tier: 0,
          bvn_verified: false,
          nin_verified: false,
          document_verified: false
        })
        .select()
        .single()

      if (createError) throw createError
      kycId = newKyc.id
      currentTier = 0
    }

    // 2. Perform verification based on requested_tier
    let nextTier = currentTier
    let bvnVer = currentKyc?.bvn_verified ?? false
    let ninVer = currentKyc?.nin_verified ?? false
    let docVer = currentKyc?.document_verified ?? false

    // Mono / Smile ID Verification API Mock integration
    const smileApiKey = Deno.env.get('SMILE_IDENTITY_API_KEY')
    if (!smileApiKey) {
      console.log('[KYC Mock] No SMILE_IDENTITY_API_KEY found. Running in simulated mode.')
    }

    if (requested_tier === 1) {
      if (bvn) {
        if (bvn.length !== 11 || isNaN(Number(bvn))) {
          return new Response(JSON.stringify({ error: 'BVN must be an 11-digit number.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          })
        }
        bvnVer = true
      }
      if (nin) {
        if (nin.length !== 11 || isNaN(Number(nin))) {
          return new Response(JSON.stringify({ error: 'NIN must be an 11-digit number.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          })
        }
        ninVer = true
      }
      if (bvnVer || ninVer) {
        nextTier = Math.max(nextTier, 1)
      } else {
        return new Response(JSON.stringify({ error: 'Please provide a valid BVN or NIN' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }
    } else if (requested_tier === 2) {
      if (currentTier < 1) {
        return new Response(JSON.stringify({ error: 'Please complete Tier 1 verification first.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }
      if (!document_type || !document_url) {
        return new Response(JSON.stringify({ error: 'Please upload a valid government ID document.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }
      docVer = true
      nextTier = Math.max(nextTier, 2)
    } else if (requested_tier === 3) {
      if (currentTier < 2) {
        return new Response(JSON.stringify({ error: 'Please complete Tier 2 verification first.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }
      if (!selfie_url) {
        return new Response(JSON.stringify({ error: 'Liveness check selfie is required.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }
      nextTier = Math.max(nextTier, 3)
    }

    // 3. Update KYC Profile in database
    const updateData: any = {
      tier: nextTier,
      bvn_verified: bvnVer,
      nin_verified: ninVer,
      document_verified: docVer,
      submitted_at: new Date().toISOString(),
      verified_at: nextTier > currentTier ? new Date().toISOString() : undefined
    }

    if (bvn) updateData.bvn = bvn
    if (nin) updateData.nin = nin
    if (document_type) updateData.document_type = document_type
    if (document_url) updateData.document_url = document_url
    if (selfie_url) updateData.selfie_url = selfie_url

    const { error: updateError } = await supabaseClient
      .from('kyc_profiles')
      .update(updateData)
      .eq('id', kycId)

    if (updateError) throw updateError

    // Trigger agent commission payout check (referral logic)
    try {
      if (nextTier > currentTier) {
        await supabaseClient.functions.invoke('process-agent-commission', {
          body: { referred_profile_id: profile_id, tier: nextTier }
        })
      }
    } catch (e) {
      console.error('Failed to trigger agent commission check:', e)
    }

    return new Response(
      JSON.stringify({ success: true, tier: nextTier, message: `Identity upgraded successfully to Tier ${nextTier}.` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    console.error('verify-identity edge function error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
