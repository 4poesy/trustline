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

    const { sender_profile_id, recipient_phone, amount, note } = await req.json()

    if (!sender_profile_id || !recipient_phone || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid transfer parameters.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // 1. Verify Sender's Profile & Wallet Balance
    const { data: senderProfile, error: senderErr } = await supabaseClient
      .from('profiles')
      .select('wallet_balance, currency, location')
      .eq('id', sender_profile_id)
      .single()

    if (senderErr || !senderProfile) {
      return new Response(JSON.stringify({ error: 'Sender profile not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      })
    }

    const senderBalance = Number(senderProfile.wallet_balance || 0)
    if (senderBalance < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient wallet balance.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // 2. Verify Sender's KYC level & Limits
    const { data: kycProfile, error: kycErr } = await supabaseClient
      .from('kyc_profiles')
      .select('tier')
      .eq('profile_id', sender_profile_id)
      .single()

    const senderTier = kycProfile?.tier ?? 0
    if (senderTier < 1) {
      return new Response(JSON.stringify({ error: 'P2P transfers require identity verification (KYC Tier 1+).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      })
    }

    // Enforce limits
    const maxLimits: Record<number, number> = { 1: 50000, 2: 200000, 3: 500000 }
    const dailyLimit = maxLimits[senderTier] ?? 50000

    // Compute today's total P2P transfers
    const todayStr = new Date().toISOString().split('T')[0]
    const { data: todayTransfers } = await supabaseClient
      .from('wallet_transactions')
      .select('amount')
      .eq('profile_id', sender_profile_id)
      .eq('type', 'transfer')
      .gte('created_at', `${todayStr}T00:00:00Z`)

    const currentDailySum = (todayTransfers || []).reduce((sum: number, tx: any) => sum + Number(tx.amount), 0)
    if (currentDailySum + amount > dailyLimit) {
      return new Response(
        JSON.stringify({ error: `Daily transfer limit exceeded. Your remaining limit is ${senderProfile.currency} ${(dailyLimit - currentDailySum).toLocaleString()}.` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // 3. Find Recipient's Profile
    const { data: recipientProfile, error: recipientErr } = await supabaseClient
      .from('profiles')
      .select('id, name, wallet_balance, currency')
      .eq('phone_number', recipient_phone)
      .single()

    if (recipientErr || !recipientProfile) {
      return new Response(JSON.stringify({ error: 'Recipient phone number is not registered on Trustline.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      })
    }

    if (recipientProfile.id === sender_profile_id) {
      return new Response(JSON.stringify({ error: 'You cannot send P2P transfers to yourself.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Check if Cross-Border (different currencies)
    const isCrossBorder = senderProfile.currency !== recipientProfile.currency
    let finalRecipientAmount = amount

    if (isCrossBorder) {
      if (senderTier < 3) {
        return new Response(JSON.stringify({ error: 'Cross-border transfers require KYC Tier 3 (Selfie/Liveness check).' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        })
      }

      // Fetch exchange rate
      const { data: rateRow } = await supabaseClient
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', senderProfile.currency)
        .eq('to_currency', recipientProfile.currency)
        .single()

      if (!rateRow) {
        return new Response(JSON.stringify({ error: `Exchange rate not available for ${senderProfile.currency} to ${recipientProfile.currency}.` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }
      finalRecipientAmount = amount * Number(rateRow.rate)
    }

    // 4. Perform Transfer inside a single execution block
    const reference = `TL-P2P-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    // Debit Sender
    const { error: debitErr } = await supabaseClient
      .from('profiles')
      .update({ wallet_balance: senderBalance - amount })
      .eq('id', sender_profile_id)

    if (debitErr) throw debitErr

    // Log Transfer sent for sender
    await supabaseClient.from('wallet_transactions').insert({
      profile_id: sender_profile_id,
      type: 'transfer',
      amount,
      currency: senderProfile.currency,
      description: `P2P Sent to ${recipientProfile.name} (${recipient_phone})`,
      payment_method: 'wallet',
      reference,
      status: 'successful'
    })

    // Credit Recipient
    const recipientBalance = Number(recipientProfile.wallet_balance || 0)
    const { error: creditErr } = await supabaseClient
      .from('profiles')
      .update({ wallet_balance: recipientBalance + finalRecipientAmount })
      .eq('id', recipientProfile.id)

    if (creditErr) throw creditErr

    // Log Transfer received for recipient
    await supabaseClient.from('wallet_transactions').insert({
      profile_id: recipientProfile.id,
      type: 'deposit',
      amount: finalRecipientAmount,
      currency: recipientProfile.currency,
      description: `P2P Received from ${sender_profile_id} - Ref: ${reference}`,
      payment_method: 'wallet',
      reference: `${reference}-R`,
      status: 'successful'
    })

    // Log P2P Transfers tracking row
    const { error: p2pRowErr } = await supabaseClient.from('p2p_transfers').insert({
      sender_profile_id,
      recipient_profile_id: recipientProfile.id,
      amount,
      currency: senderProfile.currency,
      note,
      status: 'completed',
      payment_provider_reference: reference
    })
    if (p2pRowErr) throw p2pRowErr

    // Auto-create income entry in transactions (IndexedDB sync) for recipient to boost credit score
    await supabaseClient.from('transactions').insert({
      profile_id: recipientProfile.id,
      type: 'income',
      amount: finalRecipientAmount,
      category: 'Transfer Received',
      note: `P2P Transfer from sender - Reference: ${reference}`,
      entry_date: todayStr
    })

    // Send push notification to recipient
    try {
      await supabaseClient.functions.invoke('send-push-notification', {
        body: {
          profile_id: recipientProfile.id,
          title: 'Money Received! 💰',
          body: `You received a P2P transfer of ${recipientProfile.currency} ${finalRecipientAmount.toLocaleString()} from ${senderProfile.location}.`
        }
      })
    } catch (e) {
      console.error('Failed to trigger P2P push notification:', e)
    }

    return new Response(
      JSON.stringify({ success: true, reference, recipient_amount: finalRecipientAmount, recipient_name: recipientProfile.name }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    console.error('process-p2p-transfer edge function error:', error)
    return new Response(JSON.stringify({ error: error.message || 'P2P execution failed.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
