import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { display_name, location, profile_id } = await req.json()
    if (!display_name || !profile_id) {
      return new Response(JSON.stringify({ error: 'Missing display_name or profile_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const baseLoc = location ? `-${location}` : ''
    const baseSlug = slugify(`${display_name}${baseLoc}`)

    let finalSlug = baseSlug
    let counter = 1
    let isUnique = false

    while (!isUnique) {
      const { data, error } = await supabaseClient
        .from('listings')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        isUnique = true
      } else {
        counter++
        finalSlug = `${baseSlug}-${counter}`
      }
    }

    return new Response(JSON.stringify({ slug: finalSlug }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
