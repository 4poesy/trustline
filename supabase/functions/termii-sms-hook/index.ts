import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const TERMII_API_KEY = Deno.env.get('TERMII_API_KEY')
const TERMII_SENDER_ID = Deno.env.get('TERMII_SENDER_ID') || 'Trustline'

serve(async (req) => {
  try {
    const { sms } = await req.json()
    const { otp, phone } = sms

    if (!otp || !phone) {
      return new Response(
        JSON.stringify({ error: 'Missing otp or phone in request payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Termii SMS Hook] Preparing to send OTP to ${phone}`)

    if (!TERMII_API_KEY) {
      console.warn('[Termii SMS Hook] TERMII_API_KEY is not set. Simulating SMS send.')
      return new Response(
        JSON.stringify({ status: 'simulated', message: 'SMS API key missing, simulated successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phone,
        from: TERMII_SENDER_ID,
        sms: `Your Trustline verification code is ${otp}. It expires in 10 minutes.`,
        type: 'plain',
        channel: 'dnd',
        api_key: TERMII_API_KEY,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[Termii SMS Hook] Termii API error response:', result)
      return new Response(
        JSON.stringify({ error: 'Termii gateway rejected send request', details: result }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('[Termii SMS Hook] Termii send success:', result)
    return new Response(
      JSON.stringify({ status: 'success', data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('[Termii SMS Hook] Unexpected error executing SMS hook:', err)
    return new Response(
      JSON.stringify({ error: err.message || err.toString() }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
