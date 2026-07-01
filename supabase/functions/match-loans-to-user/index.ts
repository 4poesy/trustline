import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) throw new Error('Unauthorized')

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, location, trust_score, created_at')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('Profile not found')

    // Get KYC tier
    const { data: kyc } = await supabase
      .from('kyc_profiles')
      .select('tier')
      .eq('profile_id', user.id)
      .maybeSingle()

    const kycTier = kyc?.tier || 0
    const trustScore = profile.trust_score || 0
    const monthsActive = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000))

    // Query matching loan products
    // Filter: lender approved, product active, user meets eligibility
    const { data: products, error: prodErr } = await supabase
      .from('loan_products')
      .select(`
        *,
        lenders!inner(id, company_name, company_type, logo_url, status, operating_regions, cbn_license_number)
      `)
      .eq('is_active', true)
      .eq('lenders.status', 'approved')
      .lte('minimum_kyc_tier', kycTier)
      .lte('minimum_trust_score', trustScore)
      .lte('minimum_months_active', monthsActive)
      .order('is_featured', { ascending: false })
      .order('interest_rate', { ascending: true })

    if (prodErr) throw prodErr

    // Further filter: check user role is in target_user_roles and location in operating_regions
    const matched = (products || []).filter(p => {
      const targetRoles = p.target_user_roles || []
      const regions = p.lenders?.operating_regions || []

      const roleMatch = Array.isArray(targetRoles) && targetRoles.includes(profile.role)
      // Location match: check if user's location is in lender's operating regions (case-insensitive)
      const locationMatch = Array.isArray(regions) && regions.some(
        (r: string) => r.toLowerCase() === (profile.location || '').toLowerCase()
      )

      // If lender has no region restriction (empty array), match all locations
      return roleMatch && (regions.length === 0 || locationMatch)
    })

    // Calculate APR for each product for transparency
    const enriched = matched.map(p => {
      const monthlyRate = p.interest_rate
      let apr: number
      if (p.interest_type === 'flat') {
        apr = monthlyRate * 12
      } else {
        // Reducing balance: APR ≈ (1 + monthly_rate/100)^12 - 1
        apr = (Math.pow(1 + monthlyRate / 100, 12) - 1) * 100
      }
      return {
        ...p,
        calculated_apr: Math.round(apr * 100) / 100,
        user_eligible: true
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        products: enriched,
        user_context: {
          trust_score: trustScore,
          kyc_tier: kycTier,
          months_active: monthsActive,
          role: profile.role,
          location: profile.location
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message, products: [] }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
