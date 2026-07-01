import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import bcrypt from "https://esm.sh/bcryptjs@2.4.3"
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { trustline_code, pin } = await req.json()

    if (!trustline_code || !pin) {
      return new Response(JSON.stringify({ error: 'Trustline Code and PIN are required.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const uppercaseCode = trustline_code.trim().toUpperCase()

    // Connect to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Step 1: Check lock
    const { data: lock } = await supabase
      .from('account_locks')
      .select('failed_count, locked_until')
      .eq('trustline_code', uppercaseCode)
      .maybeSingle()

    if (lock?.locked_until) {
      const lockedUntilDate = new Date(lock.locked_until)
      const now = new Date()
      if (lockedUntilDate > now) {
        const remainingMinutes = Math.ceil((lockedUntilDate.getTime() - now.getTime()) / (60 * 1000))
        return new Response(JSON.stringify({
          success: false,
          error: 'account_locked',
          minutes_remaining: remainingMinutes
        }), {
          status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Step 2: Lookup profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('trustline_code', uppercaseCode)
      .maybeSingle()

    // Record login attempt helper
    const logAttempt = async (success: boolean) => {
      await supabase
        .from('login_attempts')
        .insert({
          trustline_code: uppercaseCode,
          success
        })
    }

    // Increment lock failed count helper
    const incrementFailures = async () => {
      const currentFailures = (lock?.failed_count ?? 0) + 1
      let lockedUntil: string | null = null

      if (currentFailures >= 5) {
        const lockTime = new Date()
        lockTime.setMinutes(lockTime.getMinutes() + 30)
        lockedUntil = lockTime.toISOString()
      }

      await supabase
        .from('account_locks')
        .upsert({
          trustline_code: uppercaseCode,
          failed_count: currentFailures,
          last_failed_at: new Date().toISOString(),
          locked_until: lockedUntil
        })

      return { failures: currentFailures, lockedUntil }
    }

    if (!profile) {
      // Simulate bcrypt delay to prevent timing attacks
      await bcrypt.compare("dummy_pin", "$2b$12$4poesy/trustline365/placeholderhash")
      await logAttempt(false)
      await incrementFailures()
      return new Response(JSON.stringify({ success: false, error: 'invalid_credentials' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Step 3: Verify PIN
    const isPinValid = bcrypt.compareSync(pin, profile.pin_hash)
    if (!isPinValid) {
      await logAttempt(false)
      const { failures, lockedUntil } = await incrementFailures()
      if (failures >= 5) {
        return new Response(JSON.stringify({
          success: false,
          error: 'account_locked',
          minutes_remaining: 30
        }), {
          status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: 'invalid_credentials',
          attempts_remaining: 5 - failures
        }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Step 4: Success, reset locks and generate token
    await supabase
      .from('account_locks')
      .upsert({
        trustline_code: uppercaseCode,
        failed_count: 0,
        last_failed_at: null,
        locked_until: null
      })

    await logAttempt(true)

    const jwtSecret = Deno.env.get('JWT_SECRET') ?? Deno.env.get('SUPABASE_JWT_SECRET') ?? ''
    if (!jwtSecret) {
      return new Response(JSON.stringify({ error: 'JWT Secret is not configured.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const keyBuf = new TextEncoder().encode(jwtSecret)
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuf,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )

    const payload = {
      aud: "authenticated",
      role: "authenticated",
      sub: profile.id,
      email: "",
      app_metadata: { provider: "custom" },
      user_metadata: {},
      exp: getNumericDate(30 * 24 * 60 * 60) // 30 days
    }

    const jwt = await create({ alg: "HS256", type: "JWT" }, payload, cryptoKey)

    // Log session
    const tokenData = new TextEncoder().encode(jwt)
    const hashBuffer = await crypto.subtle.digest("SHA-256", tokenData)
    const sessionTokenHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await supabase
      .from('sessions')
      .insert({
        profile_id: profile.id,
        session_token_hash: sessionTokenHash,
        expires_at: expiresAt.toISOString()
      })

    // Remove hashed pins and recovery data from profile before returning
    const safeProfile = { ...profile }
    delete safeProfile.pin_hash
    delete safeProfile.recovery_answer_hash

    return new Response(JSON.stringify({
      success: true,
      profile_id: profile.id,
      session_token: jwt,
      profile: safeProfile
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
