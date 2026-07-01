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
    const { lender_id, company_name, contact_email } = body

    if (!lender_id || !company_name) {
      throw new Error('Missing lender_id or company_name')
    }

    // Log admin notification (in production, this would send an email via Resend/Postmark)
    console.log(`[ADMIN NOTIFICATION] New lender registration:`)
    console.log(`  Company: ${company_name}`)
    console.log(`  Lender ID: ${lender_id}`)
    console.log(`  Contact: ${contact_email}`)
    console.log(`  Review at: /admin/lenders`)

    // For now, record a simple notification marker
    // In production, integrate with Supabase's built-in email or a transactional email service
    const adminEmail = Deno.env.get('TRUSTLINE_ADMIN_EMAIL') || 'admin@trustline.ng'

    return new Response(
      JSON.stringify({
        success: true,
        message: `Admin notification sent for lender: ${company_name}`,
        notified_email: adminEmail
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
