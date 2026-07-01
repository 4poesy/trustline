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

    const body = await req.json()
    const { loan_application_id, amount, payment_date, payment_method, provider_reference, recorded_by } = body

    if (!loan_application_id || !amount || !payment_date || !payment_method || !recorded_by) {
      throw new Error('Missing required fields')
    }

    // Verify the loan application exists and is in a repayable state
    const { data: application, error: appErr } = await supabase
      .from('loan_applications')
      .select('id, status, expected_repayment_date, applicant_profile_id, lender_id')
      .eq('id', loan_application_id)
      .single()

    if (appErr || !application) throw new Error('Loan application not found')

    if (!['disbursed', 'repaying'].includes(application.status)) {
      throw new Error('Loan is not in a repayable state')
    }

    // Insert repayment record
    const { data: repayment, error: repErr } = await supabase
      .from('loan_repayments')
      .insert({
        loan_application_id,
        amount,
        payment_date,
        payment_method,
        provider_reference: provider_reference || null,
        recorded_by
      })
      .select()
      .single()

    if (repErr) throw repErr

    // Update application status to 'repaying' if it was 'disbursed'
    if (application.status === 'disbursed') {
      await supabase
        .from('loan_applications')
        .update({ status: 'repaying', updated_at: new Date().toISOString() })
        .eq('id', loan_application_id)
    }

    // Check if repayment is on-time
    const payDate = new Date(payment_date)
    const expectedDate = application.expected_repayment_date ? new Date(application.expected_repayment_date) : null
    const isOnTime = expectedDate ? payDate <= expectedDate : true

    // Scaffold: log repayment timing data for future Trust Score integration
    console.log(`[REPAYMENT TRACKING] Application: ${loan_application_id}`)
    console.log(`  Amount: ${amount}`)
    console.log(`  Payment Date: ${payment_date}`)
    console.log(`  Expected Date: ${application.expected_repayment_date}`)
    console.log(`  On-Time: ${isOnTime}`)
    console.log(`  Recorded By: ${recorded_by}`)

    return new Response(
      JSON.stringify({
        success: true,
        repayment_id: repayment.id,
        is_on_time: isOnTime,
        message: 'Repayment recorded successfully'
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
