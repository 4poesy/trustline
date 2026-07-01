import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import bcrypt from "https://esm.sh/bcryptjs@2.4.3"
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getProfileIdFromHeader(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.split(' ')[1]
  const jwtSecret = Deno.env.get('JWT_SECRET') ?? Deno.env.get('SUPABASE_JWT_SECRET') ?? ''
  if (!jwtSecret) return null

  try {
    const keyBuf = new TextEncoder().encode(jwtSecret)
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuf,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )
    const payload = await verify(token, cryptoKey)
    return payload.sub as string
  } catch (e) {
    console.error('JWT verification failed:', e)
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const profileId = await getProfileIdFromHeader(req)
    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { current_pin, new_pin } = await req.json()

    if (!current_pin || !new_pin) {
      return new Response(JSON.stringify({ error: 'Current PIN and new PIN are required.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (current_pin === new_pin) {
      return new Response(JSON.stringify({ error: 'New PIN must be different from current PIN.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!/^\d{4}$/.test(new_pin)) {
      return new Response(JSON.stringify({ error: 'New PIN must be exactly 4 numeric digits.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const obviousPins = ["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1234", "4321"]
    if (obviousPins.includes(new_pin)) {
      return new Response(JSON.stringify({ error: 'Please choose a less obvious PIN.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Connect to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('pin_hash')
      .eq('id', profileId)
      .maybeSingle()

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'User profile not found.' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify current PIN
    const isPinValid = bcrypt.compareSync(current_pin, profile.pin_hash)
    if (!isPinValid) {
      return new Response(JSON.stringify({ error: 'Current PIN is incorrect.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Hash new PIN
    const salt = bcrypt.genSaltSync(12)
    const newPinHash = bcrypt.hashSync(new_pin, salt)

    // Update profile
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        pin_hash: newPinHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Invalidate other sessions (keep current session active by keeping current JWT in sessions table if we want,
    // or just wipe all other session records for this user)
    const authHeader = req.headers.get('Authorization') ?? ''
    const currentToken = authHeader.split(' ')[1] || ''
    
    // Hash current token to keep it valid
    const tokenData = new TextEncoder().encode(currentToken)
    const hashBuffer = await crypto.subtle.digest("SHA-256", tokenData)
    const currentSessionTokenHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    await supabase
      .from('sessions')
      .delete()
      .eq('profile_id', profileId)
      .neq('session_token_hash', currentSessionTokenHash)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
