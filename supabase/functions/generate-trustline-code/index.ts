import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, phone_last4 } = await req.json()
    if (!name || name.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Name must be at least 2 characters.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Extract first 3 letters, uppercase, alphabetic only
    let nameFragment = name.toUpperCase().replace(/[^A-Z]/g, '')
    if (nameFragment.length < 3) {
      nameFragment = (nameFragment + 'AAA').substring(0, 3)
    } else {
      nameFragment = nameFragment.substring(0, 3)
    }

    // 2. Phone segment
    const phoneSegment = (phone_last4 && phone_last4.trim().length === 4) 
      ? phone_last4.trim() 
      : 'XXXX'

    // Initialize Supabase Client with Service Role Key to bypass RLS and perform checks
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Characters for generating random part (excluding I, O, 0, 1)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let candidateCode = ''
    let collision = true
    let attempts = 0

    while (collision && attempts < 50) {
      attempts++
      let randomPart = ''
      for (let i = 0; i < 4; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      candidateCode = `TL-${nameFragment}-${phoneSegment}-${randomPart}`

      // Check collision
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('trustline_code', candidateCode)

      if (!error && count === 0) {
        collision = false
      }
    }

    if (collision) {
      return new Response(JSON.stringify({ error: 'Failed to generate code due to collision limits.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ trustline_code: candidateCode }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
