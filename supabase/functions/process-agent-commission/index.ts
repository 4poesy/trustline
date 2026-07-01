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

    const { referred_profile_id, tier } = await req.json()

    if (!referred_profile_id || !tier) {
      return new Response(JSON.stringify({ error: 'Missing parameters.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // 1. Check if user is referred by an agent
    const { data: referral, error: refErr } = await supabaseClient
      .from('agent_referrals')
      .select('*')
      .eq('referred_profile_id', referred_profile_id)
      .eq('commission_status', 'pending')
      .single()

    if (refErr || !referral) {
      // Not referred, or already paid out
      return new Response(JSON.stringify({ success: true, message: 'No pending referral found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 2. Fetch Agent details
    const { data: agent, error: agentErr } = await supabaseClient
      .from('agents')
      .select('id, profile_id, total_commission_earned, total_referrals')
      .eq('id', referral.agent_id)
      .single()

    if (agentErr || !agent) {
      return new Response(JSON.stringify({ error: 'Agent not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      })
    }

    // 3. Fetch Agent's profile to retrieve currency and wallet balance
    const { data: agentProfile, error: profileErr } = await supabaseClient
      .from('profiles')
      .select('wallet_balance, currency')
      .eq('id', agent.profile_id)
      .single()

    if (profileErr || !agentProfile) {
      return new Response(JSON.stringify({ error: 'Agent profile not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      })
    }

    // Calculate commission payout in NGN base and convert if agent currency differs
    let baseCommission = 0
    if (tier === 1) baseCommission = 100
    else if (tier === 2) baseCommission = 200
    else if (tier === 3) baseCommission = 500

    let agentCommission = baseCommission
    if (agentProfile.currency !== 'NGN') {
      const { data: rateRow } = await supabaseClient
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', 'NGN')
        .eq('to_currency', agentProfile.currency)
        .single()
      
      if (rateRow) {
        agentCommission = baseCommission * Number(rateRow.rate)
      }
    }

    // 4. Update Agent referral status and commission totals
    // Update referral
    const { error: referralUpdateErr } = await supabaseClient
      .from('agent_referrals')
      .update({
        commission_amount: agentCommission,
        commission_status: 'paid'
      })
      .eq('id', referral.id)

    if (referralUpdateErr) throw referralUpdateErr

    // Update agent totals
    const { error: agentUpdateErr } = await supabaseClient
      .from('agents')
      .update({
        total_referrals: agent.total_referrals + 1,
        total_commission_earned: Number(agent.total_commission_earned || 0) + agentCommission
      })
      .eq('id', agent.id)

    if (agentUpdateErr) throw agentUpdateErr

    // Credit agent wallet
    const agentBalance = Number(agentProfile.wallet_balance || 0)
    const { error: walletUpdateErr } = await supabaseClient
      .from('profiles')
      .update({
        wallet_balance: agentBalance + agentCommission
      })
      .eq('id', agent.profile_id)

    if (walletUpdateErr) throw walletUpdateErr

    // Log referral credit to wallet_transactions
    const refKey = `TL-COMM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    await supabaseClient.from('wallet_transactions').insert({
      profile_id: agent.profile_id,
      type: 'deposit',
      amount: agentCommission,
      currency: agentProfile.currency,
      description: `Referral signup commission (Tier ${tier} KYC)`,
      payment_method: 'bank_transfer',
      reference: refKey,
      status: 'successful'
    })

    // Send push notification to agent
    try {
      await supabaseClient.functions.invoke('send-push-notification', {
        body: {
          profile_id: agent.profile_id,
          title: 'Commission Earned! 💸',
          body: `You earned a referral commission of ${agentProfile.currency} ${agentCommission.toLocaleString()} for a verified signup.`
        }
      })
    } catch (e) {
      console.error('Failed to trigger P2P push notification:', e)
    }

    return new Response(
      JSON.stringify({ success: true, agent_id: agent.id, commission_payout: agentCommission }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    console.error('process-agent-commission edge function error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Commission payout failed.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
