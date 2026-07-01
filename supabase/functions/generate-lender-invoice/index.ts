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

    // Get marketplace config
    const { data: config } = await supabase
      .from('marketplace_config')
      .select('origination_fee_percentage')
      .limit(1)
      .single()

    const feePercentage = config?.origination_fee_percentage || 2.5

    // Get all approved lenders
    const { data: lenders } = await supabase
      .from('lenders')
      .select('id, company_name, contact_email')
      .eq('status', 'approved')

    if (!lenders || lenders.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No approved lenders to invoice', invoices_generated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date()
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0) // Last day of previous month
    const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1) // First day of previous month

    let invoicesGenerated = 0

    for (const lender of lenders) {
      // Find disbursed applications with pending fees in the previous month
      const { data: disbursedApps } = await supabase
        .from('loan_applications')
        .select('id, requested_amount, approved_amount, trustline_fee_amount, disbursed_at')
        .eq('lender_id', lender.id)
        .eq('trustline_fee_status', 'pending')
        .not('disbursed_at', 'is', null)
        .gte('disbursed_at', periodStart.toISOString())
        .lte('disbursed_at', periodEnd.toISOString())

      if (!disbursedApps || disbursedApps.length === 0) continue

      // Build line items
      const lineItems = disbursedApps.map(app => ({
        loan_application_id: app.id,
        disbursed_amount: app.approved_amount || app.requested_amount,
        fee_percentage: feePercentage,
        fee_amount: app.trustline_fee_amount || ((app.approved_amount || app.requested_amount) * feePercentage / 100)
      }))

      const totalAmount = lineItems.reduce((sum, item) => sum + item.fee_amount, 0)

      // Generate invoice number
      const invoiceNumber = `TL-INV-${lender.id.substring(0, 6).toUpperCase()}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`

      // Due date: 15 days from generation
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + 15)

      // Create invoice
      const { error: invErr } = await supabase
        .from('lender_invoices')
        .insert({
          lender_id: lender.id,
          invoice_number: invoiceNumber,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          line_items: lineItems,
          total_amount: totalAmount,
          status: 'sent',
          due_date: dueDate.toISOString().split('T')[0]
        })

      if (invErr) {
        console.error(`Failed to create invoice for lender ${lender.company_name}:`, invErr.message)
        continue
      }

      // Update fee status on applications
      const appIds = disbursedApps.map(a => a.id)
      await supabase
        .from('loan_applications')
        .update({ trustline_fee_status: 'invoiced' })
        .in('id', appIds)

      invoicesGenerated++
      console.log(`Invoice ${invoiceNumber} generated for ${lender.company_name}: ₦${totalAmount.toLocaleString()}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoices_generated: invoicesGenerated,
        period: `${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`
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
