import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { invoiceId } = await req.json()

    if (!invoiceId) {
      throw new Error('Invoice ID is required')
    }

    console.log('Retrying invoice processing for:', invoiceId)

    // Fetch invoice data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      throw new Error(`Invoice not found: ${invoiceError?.message}`)
    }

    // Get user details
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', invoice.user_id)
      .maybeSingle()

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', invoice.user_id)
      .maybeSingle()

    const results: any = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      email: { success: false, error: null },
      eboekhouden: { success: false, error: null }
    }

    // 1. Send invoice email if not sent
    if (!invoice.email_sent) {
      try {
        console.log('Sending invoice email to:', invoice.customer_email)
        
        const emailResult = await supabase.functions.invoke('send-invoice-email', {
          body: { 
            invoiceId: invoice.id,
            userEmail: invoice.customer_email,
            userName: profile?.full_name || invoice.customer_name || 'Klant'
          }
        })

        console.log('Email result:', emailResult)

        if (emailResult.error) {
          throw new Error(JSON.stringify(emailResult.error))
        }

        results.email.success = true
        console.log('Invoice email sent successfully')
      } catch (emailError) {
        console.error('Failed to send invoice email:', emailError)
        results.email.error = emailError instanceof Error ? emailError.message : String(emailError)
      }
    } else {
      results.email.success = true
      results.email.message = 'Email already sent'
    }

    // 2. Sync to e-Boekhouden if not already synced successfully
    const { data: syncLogs } = await supabase
      .from('eboekhouden_sync_log')
      .select('*')
      .eq('invoice_id', invoice.id)
      .eq('sync_type', 'invoice')
      .eq('status', 'success')
      .maybeSingle()

    if (!syncLogs && subscription) {
      try {
        console.log('Syncing to e-Boekhouden...')
        
        const relationCode = subscription.eboekhouden_relation_code || `LINQ-${invoice.user_id.substring(0, 8)}`
        
        // Determine plan name and interval from subscription
        const planName = subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
        const intervalText = subscription.billing_interval === 'monthly' ? 'Maandelijks' : 'Jaarlijks'
        
        // Check if relation exists
        if (!subscription.eboekhouden_relation_code) {
          console.log('Creating relation:', relationCode)
          
          const addRelResult = await supabase.functions.invoke('eboekhouden-client', {
            body: {
              action: 'addRelatie',
              params: {
                relatiecode: relationCode,
                bedrijf: invoice.customer_name,
                email: invoice.customer_email,
                land: invoice.customer_country,
                btwNummer: invoice.vat_number || undefined
              }
            }
          })

          console.log('Add relation result:', addRelResult)

          if (addRelResult.error) {
            throw new Error(`Failed to create relation: ${JSON.stringify(addRelResult.error)}`)
          }

          // Save relation code
          await supabase
            .from('user_subscriptions')
            .update({ 
              eboekhouden_relation_code: relationCode,
              eboekhouden_last_sync: new Date().toISOString()
            })
            .eq('user_id', invoice.user_id)
        }

        // Determine BTW code
        let btwCode = 'HOOG_VERK_21'
        if (invoice.customer_country !== 'NL') {
          const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']
          
          if (euCountries.includes(invoice.customer_country)) {
            if (invoice.customer_type === 'business' && invoice.vat_number) {
              btwCode = 'VERLEGD'
            }
          } else {
            btwCode = 'GEEN'
          }
        }

        console.log('Creating invoice in e-Boekhouden:', { relationCode, invoiceNumber: invoice.invoice_number })

        const factuurResult = await supabase.functions.invoke('eboekhouden-client', {
          body: {
            action: 'addFactuur',
            params: {
              relatiecode: relationCode,
              factuurnummer: invoice.invoice_number,
              factuurdatum: new Date(invoice.invoice_date).toISOString().split('T')[0],
              bedragExclBtw: invoice.amount_excl_vat,
              btwCode: btwCode,
              omschrijving: `LinqBoard ${planName} Abonnement`,
              intervalText: intervalText,
              planName: planName
            }
          }
        })

        console.log('Create invoice result:', factuurResult)

        if (factuurResult.error) {
          throw new Error(`Failed to create invoice: ${JSON.stringify(factuurResult.error)}`)
        }

        // Log success
        await supabase.from('eboekhouden_sync_log').insert({
          invoice_id: invoice.id,
          user_id: invoice.user_id,
          sync_type: 'invoice',
          status: 'success',
          eboekhouden_response: factuurResult.data
        })

        results.eboekhouden.success = true
        console.log('E-boekhouden sync successful')
      } catch (ebError) {
        console.error('E-boekhouden sync failed:', ebError)
        results.eboekhouden.error = ebError instanceof Error ? ebError.message : String(ebError)
        
        // Log error
        await supabase.from('eboekhouden_sync_log').insert({
          invoice_id: invoice.id,
          user_id: invoice.user_id,
          sync_type: 'invoice',
          status: 'failed',
          error_message: ebError instanceof Error ? ebError.message : String(ebError)
        })
      }
    } else {
      results.eboekhouden.success = true
      results.eboekhouden.message = 'Already synced successfully'
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Error in retry-invoice-processing:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
