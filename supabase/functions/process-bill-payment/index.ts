import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Map frontend provider names to Flutterwave biller codes
function getBillerCode(type: string, provider: string): string {
  const providerLower = provider.toLowerCase()
  
  if (type === 'airtime') {
    if (providerLower.includes('mtn')) return 'BIL108'
    if (providerLower.includes('airtel')) return 'BIL109'
    if (providerLower.includes('glo')) return 'BIL110'
    if (providerLower.includes('9mobile')) return 'BIL111'
  } else if (type === 'data') {
    if (providerLower.includes('mtn')) return 'BIL104'
    if (providerLower.includes('airtel')) return 'BIL105'
    if (providerLower.includes('glo')) return 'BIL106'
    if (providerLower.includes('9mobile')) return 'BIL107'
  } else if (type === 'electricity') {
    if (providerLower.includes('ikeja') || providerLower === 'ikedc') return 'BIL113'
    if (providerLower.includes('eko') || providerLower === 'ekedc') return 'BIL112'
    if (providerLower.includes('abuja') || providerLower === 'aedc') return 'BIL114'
  } else if (type === 'tv_subscription') {
    if (providerLower.includes('dstv')) return 'BIL121'
    if (providerLower.includes('gotv')) return 'BIL122'
    if (providerLower.includes('startimes')) return 'BIL123'
  }
  return ''
}

// Executes purchase through Flutterwave Bills API or Mock Fallback
async function executeVTUPurchase(
  type: string,
  provider: string,
  recipient: string,
  amount: number
): Promise<{ reference: string; status: 'successful' | 'failed'; error?: string }> {
  const apiKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY')

  if (!apiKey) {
    console.log('[VTU Mock] No FLUTTERWAVE_SECRET_KEY found. Running in simulated mode.')
    // Simulate real network delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Handle mock failures
    if (recipient.endsWith('99')) {
      return {
        reference: '',
        status: 'failed',
        error: 'Invalid recipient number or meter account. Biller verification failed.'
      }
    }
    if (amount > 100000) {
      return {
        reference: '',
        status: 'failed',
        error: 'Transaction amount exceeds maximum limit allowed by biller.'
      }
    }
    if (recipient.startsWith('000')) {
      return {
        reference: '',
        status: 'failed',
        error: 'Biller system timeout or insufficient provider service balance.'
      }
    }

    return {
      reference: `MOCK-VTU-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      status: 'successful'
    }
  }

  // Real Integration: Flutterwave Bills API
  const ref = `TL-BILL-${Date.now()}`
  const billerCode = getBillerCode(type, provider)
  const billerType = type === 'airtime' ? 'AIRTIME' : type === 'data' ? 'DATA' : type.toUpperCase()

  try {
    const response = await fetch('https://api.flutterwave.com/v3/bills', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        country: 'NG',
        customer: recipient,
        amount: amount,
        recurrence: 'ONCE',
        type: billerType,
        reference: ref,
        biller_code: billerCode || undefined
      })
    })

    const resJson = await response.json()

    if (!response.ok || resJson.status !== 'success') {
      return {
        reference: ref,
        status: 'failed',
        error: resJson.message || 'Failed to process payment with VTU provider.'
      }
    }

    return {
      reference: resJson.data.tx_ref || resJson.data.reference || ref,
      status: 'successful'
    }
  } catch (err: any) {
    console.error('[VTU API Error]', err)
    return {
      reference: ref,
      status: 'failed',
      error: err.message || err.toString()
    }
  }
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

    const body = await req.json()
    const { profile_id, type, recipient_number, network_or_provider, amount } = body

    // 1. Parameter Validation
    if (!profile_id || !type || !recipient_number || !network_or_provider || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required parameters.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const parsedAmount = Number(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid payment amount.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Amount range checks
    if (type === 'airtime' && (parsedAmount < 50 || parsedAmount > 50000)) {
      return new Response(JSON.stringify({ error: 'Airtime amount must be between ₦50 and ₦50,000.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (type === 'data' && (parsedAmount < 100 || parsedAmount > 20000)) {
      return new Response(JSON.stringify({ error: 'Data purchase amount must be between ₦100 and ₦20,000.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (type === 'electricity' && (parsedAmount < 500 || parsedAmount > 100000)) {
      return new Response(JSON.stringify({ error: 'Electricity purchase must be between ₦500 and ₦100,000.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (type === 'tv_subscription' && (parsedAmount < 1000 || parsedAmount > 50000)) {
      return new Response(JSON.stringify({ error: 'TV subscription must be between ₦1,000 and ₦50,000.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Idempotency Check (prevent double charges within last 60 seconds)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
    const { data: duplicate } = await supabaseClient
      .from('bill_payments')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('type', type)
      .eq('recipient_number', recipient_number)
      .eq('network_or_provider', network_or_provider)
      .eq('amount', parsedAmount)
      .gte('created_at', oneMinuteAgo)
      .in('status', ['pending', 'successful'])
      .maybeSingle()

    if (duplicate) {
      return new Response(
        JSON.stringify({
          error: 'A duplicate transaction was detected within the last 60 seconds. Please check history before retrying.',
          payment: duplicate
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 3. Insert 'pending' record to log attempt
    const { data: paymentRecord, error: insertError } = await supabaseClient
      .from('bill_payments')
      .insert({
        profile_id,
        type,
        recipient_number,
        network_or_provider,
        amount: parsedAmount,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to log payment attempt: ${insertError.message}`)
    }

    // 4. Call VTU Provider
    const outcome = await executeVTUPurchase(type, network_or_provider, recipient_number, parsedAmount)

    // 5. Update Status based on outcome
    const { data: updatedRecord, error: updateError } = await supabaseClient
      .from('bill_payments')
      .update({
        status: outcome.status,
        provider_reference: outcome.reference || null,
        completed_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to finalize payment status: ${updateError.message}`)
    }

    if (outcome.status === 'failed') {
      return new Response(
        JSON.stringify({
          error: outcome.error || 'Payment transaction failed with billing provider.',
          payment: updatedRecord
        }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(JSON.stringify({ message: 'Bill payment successful.', payment: updatedRecord }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('Error executing process-bill-payment:', err)
    return new Response(JSON.stringify({ error: err.message || err.toString() }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
