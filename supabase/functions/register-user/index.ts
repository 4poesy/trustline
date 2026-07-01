import { serve } from "https://deno.land/std@0.168/http/server.ts"
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
    const body = await req.json()
    const {
      trustline_code,
      pin,
      name,
      role,
      business_type,
      location,
      phone_last4,
      public_username,
      recovery_question,
      recovery_answer
    } = body

    // 1. Validations
    if (!name || name.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Name must be at least 2 characters.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!pin || !/^\d{4}$/.test(pin)) {
      return new Response(JSON.stringify({ error: 'PIN must be exactly 4 numeric digits.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const obviousPins = ["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1234", "4321"]
    if (obviousPins.includes(pin)) {
      return new Response(JSON.stringify({ error: 'Please choose a less obvious PIN (e.g. avoid 1234 or repeating numbers).' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const validRoles = ['trader', 'service_provider', 'group_member']
    if (!role || !validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid user role selected.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (public_username) {
      if (public_username.length > 30 || !/^[a-z0-9._]+$/.test(public_username)) {
        return new Response(JSON.stringify({ error: 'Username must be lowercase alphanumeric, dots, or underscores, max 30 characters.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    if (!recovery_question || !recovery_answer || recovery_answer.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Please select a recovery question and provide an answer.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Connect to Supabase with Service Key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Double-check code exists
    const { data: codeCheck } = await supabase
      .from('profiles')
      .select('id')
      .eq('trustline_code', trustline_code)
      .maybeSingle()

    if (codeCheck) {
      return new Response(JSON.stringify({ error: 'This Trustline Code has already been registered.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (public_username) {
      const { data: usernameCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('public_username', public_username)
        .maybeSingle()

      if (usernameCheck) {
        return new Response(JSON.stringify({ error: 'This username is already taken.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Hash PIN & Recovery Answer using bcryptjs (with cost factor 12)
    const salt = bcrypt.genSaltSync(12)
    const pinHash = bcrypt.hashSync(pin, salt)
    const recoveryAnswerHash = bcrypt.hashSync(recovery_answer.trim().toLowerCase(), salt)

    const profileId = crypto.randomUUID()

    // 2. Insert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: profileId,
        trustline_code,
        pin_hash: pinHash,
        name: name.trim(),
        role,
        business_type: business_type ? business_type.trim() : null,
        location: location ? location.trim() : null,
        phone_last4: phone_last4 ? phone_last4.trim() : null,
        public_username: public_username ? public_username.trim() : null,
        recovery_question,
        recovery_answer_hash: recoveryAnswerHash
      })

    if (profileError) {
      console.error('Profile insertion error:', profileError)
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Create account locks initial state
    await supabase
      .from('account_locks')
      .insert({
        trustline_code,
        failed_count: 0,
        last_failed_at: null,
        locked_until: null
      })

    // 4. Generate JWT signed with Supabase JWT Secret
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET') ?? ''
    if (!jwtSecret) {
      return new Response(JSON.stringify({ error: 'JWT Secret is not configured on the server.' }), {
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
      sub: profileId,
      email: "",
      app_metadata: { provider: "custom" },
      user_metadata: {},
      exp: getNumericDate(30 * 24 * 60 * 60) // 30 days
    }

    const jwt = await create({ alg: "HS256", type: "JWT" }, payload, cryptoKey)

    // Hash the JWT for sessions table
    const tokenData = new TextEncoder().encode(jwt)
    const hashBuffer = await crypto.subtle.digest("SHA-256", tokenData)
    const sessionTokenHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // 5. Insert session
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        profile_id: profileId,
        session_token_hash: sessionTokenHash,
        expires_at: expiresAt.toISOString()
      })

    if (sessionError) {
      console.warn('Session logging error:', sessionError)
    }

    return new Response(JSON.stringify({
      success: true,
      profile_id: profileId,
      session_token: jwt
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
