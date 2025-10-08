import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY')

// E-boekhouden.nl sync function
async function syncToEboekhouden(
  supabase: any,
  invoice: any,
  userId: string,
  userName: string,
  userEmail: string,
  country: string,
  customerType: string,
  vatNumber: string | null,
  vatNumberValid: boolean,
  planName: string,
  intervalText: string,
  existingRelationCode?: string
) {
  try {
    const relationCode = existingRelationCode || `LINQ-${userId.substring(0, 8)}`
    
    // Log sync attempt
    await supabase.from('eboekhouden_sync_log').insert({
      invoice_id: invoice.id,
      user_id: userId,
      sync_type: 'customer',
      status: 'pending'
    })

    // Check if customer exists, if not create
    if (!existingRelationCode) {
      const { data: checkResult } = await supabase.functions.invoke('eboekhouden-client', {
        body: {
          action: 'getRelatie',
          params: { relatiecode: relationCode }
        }
      })

      if (!checkResult?.exists) {
        const { data: addRelResult, error: relError } = await supabase.functions.invoke('eboekhouden-client', {
          body: {
            action: 'addRelatie',
            params: {
              relatiecode: relationCode,
              bedrijf: invoice.customer_name,
              email: userEmail,
              land: country,
              btwNummer: vatNumber || undefined
            }
          }
        })

        if (relError) throw relError

        // Save relation code
        await supabase
          .from('user_subscriptions')
          .update({ 
            eboekhouden_relation_code: relationCode,
            eboekhouden_last_sync: new Date().toISOString()
          })
          .eq('user_id', userId)

        await supabase.from('eboekhouden_sync_log').insert({
          invoice_id: invoice.id,
          user_id: userId,
          sync_type: 'customer',
          status: 'success',
          eboekhouden_response: addRelResult
        })
      }
    }

    // Determine BTW code
    let btwCode = 'HOOG_VERK_21' // Default NL 21%
    if (country !== 'NL') {
      const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']
      
      if (euCountries.includes(country)) {
        if (customerType === 'business' && vatNumberValid) {
          btwCode = 'VERLEGD' // Reverse charge
        } else {
          btwCode = 'HOOG_VERK_21' // EU B2C
        }
      } else {
        btwCode = 'GEEN' // Outside EU
      }
    }

    // Create invoice in E-boekhouden.nl
    const { data: factuurResult, error: factuurError } = await supabase.functions.invoke('eboekhouden-client', {
      body: {
        action: 'addFactuur',
        params: {
          relatiecode: relationCode,
          factuurnummer: invoice.invoice_number,
          factuurdatum: new Date().toISOString().split('T')[0],
          bedragExclBtw: invoice.amount_excl_vat,
          btwCode: btwCode,
          omschrijving: `LinqBoard ${planName} Abonnement`,
          intervalText: intervalText,
          planName: planName
        }
      }
    })

    if (factuurError) throw factuurError

    // Log success
    await supabase.from('eboekhouden_sync_log').insert({
      invoice_id: invoice.id,
      user_id: userId,
      sync_type: 'invoice',
      status: 'success',
      eboekhouden_response: factuurResult
    })

    console.log('E-boekhouden sync successful for invoice:', invoice.invoice_number)
  } catch (error: any) {
    console.error('E-boekhouden sync failed:', error)
    
    // Log error
    await supabase.from('eboekhouden_sync_log').insert({
      invoice_id: invoice.id,
      user_id: userId,
      sync_type: 'invoice',
      status: 'failed',
      error_message: error.message || error.toString()
    })
  }
}

Deno.serve(async (req) => {
  let paymentId: string;
  
  try {
    // Mollie sends webhooks as form-encoded data
    const body = await req.text();
    const params = new URLSearchParams(body);
    paymentId = params.get('id') || '';
    
    if (!paymentId) {
      throw new Error('No payment ID provided');
    }
    
    console.log('Webhook received for payment:', paymentId)
    
    // Fetch payment details from Mollie
    const response = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${MOLLIE_API_KEY}` }
    })
    const payment = await response.json()
    
    console.log('Payment status:', payment.status, 'Metadata:', payment.metadata)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Log transaction
    const { error: transactionError } = await supabase
      .from('mollie_transactions')
      .insert({
        payment_id: payment.id,
        user_id: payment.metadata.user_id,
        status: payment.status,
        amount: parseFloat(payment.amount.value),
        currency: payment.amount.currency,
        country: payment.metadata.country,
        customer_type: payment.metadata.customer_type,
        vat_number: payment.metadata.vat_number || null,
        vat_rate: parseFloat(payment.metadata.vat_rate || '0'),
        vat_amount: parseFloat(payment.metadata.vat_amount || '0'),
        mollie_response: payment
      })

    if (transactionError) {
      console.error('Error logging transaction:', transactionError)
    }

    // Update subscription status based on payment status
    if (payment.status === 'paid') {
      // This was the first payment, now create the actual subscription
      const { 
        plan, 
        billing_interval, 
        user_id, 
        user_name,
        user_email,
        country,
        customer_type,
        vat_number,
        vat_number_valid,
        amount_excl_vat,
        vat_rate,
        vat_amount,
        amount_incl_vat
      } = payment.metadata
      
      if (!plan || !billing_interval || !user_id) {
        console.error('Missing metadata in payment:', payment.metadata)
        return new Response(null, { status: 400 })
      }
      
      // Get customer ID from database
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('mollie_customer_id')
        .eq('user_id', user_id)
        .single()
      
      if (!subscription?.mollie_customer_id) {
        console.error('No customer found for user:', user_id)
        return new Response(null, { status: 400 })
      }
      
      // Determine pricing
      const PRICING: Record<string, any> = {
        pro: { monthly: 7.99, yearly: 79.90, orgs: 3, members: 8 },
        team: { monthly: 19.99, yearly: 199.00, orgs: 8, members: 20 },
        business: { monthly: 39.00, yearly: 390.00, orgs: -1, members: -1 }
      }
      
      const price = PRICING[plan][billing_interval]
      const interval = billing_interval === 'monthly' ? '1 month' : '1 year'
      const planName = plan.charAt(0).toUpperCase() + plan.slice(1)
      const intervalText = billing_interval === 'monthly' ? 'Maandelijks' : 'Jaarlijks'
      
      // Create recurring subscription at Mollie
      const subResponse = await fetch(`https://api.mollie.com/v2/customers/${subscription.mollie_customer_id}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MOLLIE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: { currency: 'EUR', value: price.toFixed(2) },
          interval: interval,
          description: `LinqBoard ${planName} Abonnement`,
          webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mollie-webhook`,
          metadata: {
            user_name: user_name,
            plan: planName,
            interval: intervalText
          }
        })
      })
      
      const mollieSubscription = await subResponse.json()
      console.log('Mollie subscription created:', mollieSubscription.id)
      
      const periodStart = new Date()
      const periodEnd = new Date()
      
      if (billing_interval === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      }

      // Check if there's a pending plan change
      const { data: currentSub } = await supabase
        .from('user_subscriptions')
        .select('id, pending_plan, pending_billing_interval')
        .eq('user_id', user_id)
        .single()

      const updateData: any = { 
        status: 'active',
        mollie_subscription_id: mollieSubscription.id,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString()
      }

      // If there's a pending plan, activate it now
      if (currentSub?.pending_plan) {
        console.log('Activating pending plan:', currentSub.pending_plan)
        updateData.plan = currentSub.pending_plan
        updateData.billing_interval = currentSub.pending_billing_interval
        updateData.max_organizations = PRICING[currentSub.pending_plan].orgs
        updateData.max_members_per_org = PRICING[currentSub.pending_plan].members
        updateData.pending_plan = null
        updateData.pending_billing_interval = null
      }

      await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('user_id', user_id)
      
      console.log('Subscription activated')

      // Generate invoice
      const invoiceNumber = await supabase
        .rpc('generate_invoice_number')
        .single()

      if (invoiceNumber.data) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user_id)
          .single()

        // Get or fetch company name from subscription
        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('company_name, eboekhouden_relation_code')
          .eq('user_id', user_id)
          .single()

      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          subscription_id: currentSub?.id,
          user_id: user_id,
          invoice_number: invoiceNumber.data,
          customer_name: userSub?.company_name || profile?.full_name || user_name,
          customer_email: user_email,
          customer_country: country,
          customer_type: customer_type,
          vat_number: vat_number || null,
          amount_excl_vat: parseFloat(amount_excl_vat),
          vat_rate: parseFloat(vat_rate),
          vat_amount: parseFloat(vat_amount),
          amount_incl_vat: parseFloat(amount_incl_vat),
          status: 'paid',
          payment_id: payment.id
        })
        .select()
        .single()

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError)
      } else {
        console.log('Invoice created:', newInvoice.invoice_number)
        
        // Get profile for email
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user_id)
          .maybeSingle()
        
        // Send invoice email first (most important)
        try {
          console.log('Sending invoice email...')
          const emailResult = await supabase.functions.invoke('send-invoice-email', {
            body: { 
              invoiceId: newInvoice.id,
              userEmail: user_email,
              userName: profileData?.full_name || user_name || 'Klant'
            }
          })
          
          if (emailResult.error) {
            console.error('Email send error:', emailResult.error)
          } else {
            console.log('Invoice email sent successfully')
          }
        } catch (emailError) {
          console.error('Failed to send invoice email:', emailError)
        }
        
        // Sync to E-boekhouden.nl (non-critical, can fail)
        try {
          console.log('Starting E-boekhouden sync...')
          await syncToEboekhouden(
            supabase,
            newInvoice,
            user_id,
            user_name,
            user_email,
            country,
            customer_type,
            vat_number,
            vat_number_valid === 'true',
            planName,
            intervalText,
            userSub?.eboekhouden_relation_code
          )
          console.log('E-boekhouden sync completed')
        } catch (ebError) {
          console.error('E-boekhouden sync failed (non-critical):', ebError)
        }
      }

        // Update EU sales summary for EU B2C customers
        if (country !== 'NL' && customer_type === 'private' && parseFloat(vat_amount) > 0) {
          const now = new Date()
          const year = now.getFullYear()
          const quarter = Math.floor(now.getMonth() / 3) + 1

          await supabase
            .from('eu_sales_summary')
            .upsert({
              country: country,
              year: year,
              quarter: quarter,
              total_sales_excl_vat: parseFloat(amount_excl_vat),
              total_vat_collected: parseFloat(vat_amount),
              vat_rate: parseFloat(vat_rate),
              transaction_count: 1
            }, {
              onConflict: 'country,year,quarter',
              ignoreDuplicates: false
            })

          console.log('EU sales summary updated')
        }
      }
    } else if (payment.status === 'failed') {
      const { 
        user_id, 
        original_plan, 
        original_max_organizations, 
        original_max_members_per_org 
      } = payment.metadata
      
      // Reset to original plan on failed payment
      await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'active',
          plan: original_plan || 'free',
          max_organizations: parseInt(original_max_organizations) || 1,
          max_members_per_org: parseInt(original_max_members_per_org) || 2,
          mollie_subscription_id: null,
          current_period_start: null,
          current_period_end: null,
          billing_interval: null,
          price_excl_vat: null,
          price_incl_vat: null,
          vat_amount: null,
          vat_rate: null,
          pending_plan: null,
          pending_billing_interval: null
        })
        .eq('user_id', user_id)
      
      console.log('Payment failed, subscription reset to original plan:', original_plan)
    }

    return new Response(null, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(null, { status: 400 })
  }
})
