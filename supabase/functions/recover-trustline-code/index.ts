import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import bcrypt from "https://esm.sh/bcryptjs@2.4.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, phone_last4, pin, recovery_question, recovery_answer } = await req.json()

    if (!name || !pin || !recovery_question || !recovery_answer) {
      return new Response(JSON.stringify({ error: 'Name, PIN, recovery question, and answer are required.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const cleanPhoneLast4 = phone_last4 ? phone_last4.trim() : null
    const nameFragment = name.trim().toUpperCase().substring(0, 3)

    // Connect to Supabase with Service Key (must bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Step 1: Check recovery lockouts
    // Find if there is a recent lockout active for this name fragment and last4
    const { data: activeLock } = await supabase
      .from('code_recovery_attempts')
      .select('locked_until')
      .eq('trustline_code_fragment', `${nameFragment}-${cleanPhoneLast4 || 'NONE'}`)
      .gt('locked_until', new Date().toISOString())
      .maybeSingle()

    if (activeLock) {
      return new Response(JSON.stringify({
        error: 'Recovery temporarily locked due to too many failed attempts. Try again later.'
      }), {
        status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Helper to log failed recovery attempts
    const logFailure = async () => {
      // Find recent failures in last 24 hours
      const fragment = `${nameFragment}-${cleanPhoneLast4 || 'NONE'}`
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { count } = await supabase
        .from('code_recovery_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('trustline_code_fragment', fragment)
        .gt('attempted_at', yesterday.toISOString())

      const failures = (count ?? 0) + 1
      let lockedUntil: string | null = null

      if (failures >= 3) {
        const lockTime = new Date()
        lockTime.setHours(lockTime.getHours() + 24)
        lockedUntil = lockTime.toISOString()
      }

      await supabase
        .from('code_recovery_attempts')
        .insert({
          trustline_code_fragment: fragment,
          attempted_at: new Date().toISOString(),
          locked_until: lockedUntil
        })

      return lockedUntil
    }

    // Step 2: Find profiles by name fragment and phone_last4 (if provided at signup)
    // Note: if phone_last4 is null in profiles and input, that matches too.
    let query = supabase.from('profiles').select('*')

    if (cleanPhoneLast4) {
      query = query.eq('phone_last4', cleanPhoneLast4)
    } else {
      query = query.is('phone_last4', null)
    }

    const { data: profiles, error: queryError } = await query

    if (queryError || !profiles || profiles.length === 0) {
      await logFailure()
      return new Response(JSON.stringify({ error: 'No matching profile found with the details provided.' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Filter profiles by first 3 letters of name
    const matchedProfile = profiles.find(p => {
      const pNameFrag = p.name.trim().toUpperCase().substring(0, 3)
      return pNameFrag === nameFragment
    })

    if (!matchedProfile) {
      await logFailure()
      return new Response(JSON.stringify({ error: 'No matching profile found with the details provided.' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Step 3: Verify PIN
    const isPinValid = bcrypt.compareSync(pin, matchedProfile.pin_hash)
    if (!isPinValid) {
      await logFailure()
      return new Response(JSON.stringify({ error: 'No matching profile found with the details provided.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Step 4: Verify recovery question and recovery answer
    if (matchedProfile.recovery_question !== recovery_question) {
      await logFailure()
      return new Response(JSON.stringify({ error: 'No matching profile found with the details provided.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const isAnswerValid = bcrypt.compareSync(recovery_answer.trim().toLowerCase(), matchedProfile.recovery_answer_hash)
    if (!isAnswerValid) {
      await logFailure()
      return new Response(JSON.stringify({ error: 'No matching profile found with the details provided.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Step 5: Success! Return the trustline_code
    return new Response(JSON.stringify({
      success: true,
      trustline_code: matchedProfile.trustline_code
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
