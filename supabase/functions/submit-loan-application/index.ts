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

    const body = await req.json()
    const { loan_product_id, requested_amount, requested_tenure_days, purpose } = body

    if (!loan_product_id || !requested_amount || !requested_tenure_days || !purpose) {
      throw new Error('Missing required fields: loan_product_id, requested_amount, requested_tenure_days, purpose')
    }

    // 1. Fetch the loan product and its lender
    const { data: product, error: prodErr } = await supabase
      .from('loan_products')
      .select('*, lenders!inner(id, company_name, status, contact_email)')
      .eq('id', loan_product_id)
      .eq('is_active', true)
      .single()

    if (prodErr || !product) throw new Error('Loan product not found or inactive')
    if (product.lenders.status !== 'approved') throw new Error('Lender is not approved')

    // 2. Validate amount and tenure ranges
    if (requested_amount < product.minimum_amount || requested_amount > product.maximum_amount) {
      throw new Error(`Requested amount must be between ${product.minimum_amount} and ${product.maximum_amount}`)
    }
    if (requested_tenure_days < product.minimum_tenure_days || requested_tenure_days > product.maximum_tenure_days) {
      throw new Error(`Requested tenure must be between ${product.minimum_tenure_days} and ${product.maximum_tenure_days} days`)
    }

    // 3. Get user profile and verify eligibility
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, phone_number, role, location, trust_score, created_at')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('Profile not found')

    // Check KYC tier
    const { data: kyc } = await supabase
      .from('kyc_profiles')
      .select('tier')
      .eq('profile_id', user.id)
      .maybeSingle()

    const kycTier = kyc?.tier || 0
    if (kycTier < product.minimum_kyc_tier) {
      throw new Error(`Minimum KYC Tier ${product.minimum_kyc_tier} required. You are Tier ${kycTier}.`)
    }

    // Check trust score
    if ((profile.trust_score || 0) < product.minimum_trust_score) {
      throw new Error(`Minimum Trust Score of ${product.minimum_trust_score} required.`)
    }

    // Check months active
    const monthsActive = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000))
    if (monthsActive < product.minimum_months_active) {
      throw new Error(`Minimum ${product.minimum_months_active} months of activity required.`)
    }

    // 4. Capture trust snapshot
    const { data: trustMetrics } = await supabase
      .from('trust_metrics')
      .select('*')
      .eq('profile_id', user.id)
      .maybeSingle()

    // Get 6 month income summary
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
    const { data: salesData } = await supabase
      .from('sales')
      .select('amount, sale_date')
      .eq('profile_id', user.id)
      .gte('sale_date', sixMonthsAgo)

    const totalIncome6m = (salesData || []).reduce((sum, s) => sum + Number(s.amount), 0)
    const txCount6m = (salesData || []).length

    const trustSnapshot = {
      trust_score: profile.trust_score,
      trust_metrics: trustMetrics || null,
      income_summary_6m: { total: totalIncome6m, transaction_count: txCount6m },
      kyc_tier: kycTier,
      months_active: monthsActive,
      profile_role: profile.role,
      snapshot_at: new Date().toISOString()
    }

    // 5. Get marketplace config for fee calculation
    const { data: config } = await supabase
      .from('marketplace_config')
      .select('origination_fee_percentage')
      .limit(1)
      .single()

    const feePercentage = config?.origination_fee_percentage || 2.5
    const estimatedFee = (requested_amount * feePercentage) / 100

    // 6. Create the application
    const { data: application, error: appErr } = await supabase
      .from('loan_applications')
      .insert({
        loan_product_id,
        lender_id: product.lender_id,
        applicant_profile_id: user.id,
        requested_amount,
        requested_tenure_days,
        purpose,
        status: 'submitted',
        trust_snapshot: trustSnapshot,
        kyc_tier_at_application: kycTier,
        trustline_fee_amount: estimatedFee,
        trustline_fee_status: 'pending'
      })
      .select()
      .single()

    if (appErr) throw appErr

    return new Response(
      JSON.stringify({
        success: true,
        application_id: application.id,
        lender_name: product.lenders.company_name,
        message: `Application submitted to ${product.lenders.company_name}. They will review and respond within 2-3 business days.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
