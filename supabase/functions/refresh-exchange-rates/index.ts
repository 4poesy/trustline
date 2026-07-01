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

    const currencies = ['NGN', 'GHS', 'KES', 'TZS', 'ZAR', 'UGX', 'USD']
    const ratesData: { from_currency: string; to_currency: string; rate: number }[] = []

    const openExchangeRatesKey = Deno.env.get('OPEN_EXCHANGE_RATES_KEY')

    if (!openExchangeRatesKey) {
      console.log('[Exchange Rates Mock] Running in simulated mode.')
      
      // Hardcoded exchange rates reference (approximate mid-market rates)
      // Base: NGN
      const mockRates: Record<string, number> = {
        'NGN': 1.0,
        'GHS': 0.010,   // 1 NGN = 0.010 GHS
        'KES': 0.088,   // 1 NGN = 0.088 KES
        'TZS': 1.75,    // 1 NGN = 1.75 TZS
        'ZAR': 0.012,   // 1 NGN = 0.012 ZAR
        'UGX': 2.50,    // 1 NGN = 2.50 UGX
        'USD': 0.00067  // 1 NGN = 0.00067 USD
      }

      for (const from of currencies) {
        for (const to of currencies) {
          if (from === to) continue
          
          // Calculate conversion rate relative to NGN
          const rateFromNgn = mockRates[from]
          const rateToNgn = mockRates[to]
          const rate = rateToNgn / rateFromNgn

          ratesData.push({
            from_currency: from,
            to_currency: to,
            rate: parseFloat(rate.toFixed(6))
          })
        }
      }
    } else {
      // Real API Integration: Open Exchange Rates
      const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${openExchangeRatesKey}`)
      const resJson = await response.json()
      
      if (resJson.rates) {
        const rates = resJson.rates
        for (const from of currencies) {
          for (const to of currencies) {
            if (from === to) continue
            // Calculate cross rate from USD base
            const usdToFrom = rates[from] ?? 1
            const usdToTo = rates[to] ?? 1
            const rate = usdToTo / usdToFrom
            
            ratesData.push({
              from_currency: from,
              to_currency: to,
              rate: parseFloat(rate.toFixed(6))
            })
          }
        }
      }
    }

    // Upsert exchange rates
    let inserted = 0
    for (const row of ratesData) {
      const { error } = await supabaseClient
        .from('exchange_rates')
        .upsert(row, { onConflict: 'from_currency,to_currency' })
      if (!error) inserted++
    }

    return new Response(
      JSON.stringify({ success: true, message: `Updated ${inserted} exchange rates.`, rates: ratesData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    console.error('refresh-exchange-rates edge function error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to refresh rates.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
