import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY')

interface PlanPricing {
  monthly: number
  yearly: number
  orgs: number
  members: number
}

const PRICING: Record<string, PlanPricing> = {
  pro: { monthly: 7.99, yearly: 79.90, orgs: 3, members: 8 },
  team: { monthly: 19.99, yearly: 199.00, orgs: 8, members: 20 },
  business: { monthly: 39.00, yearly: 390.00, orgs: -1, members: -1 }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    console.log('Authorization header:', authHeader ? 'present' : 'missing')
    
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    console.log('Auth response:', { user: user ? 'present' : 'null', error: authError })

    if (authError || !user) {
      console.error('Authentication error:', authError)
      throw new Error('Authentication failed')
    }

    const { 
      plan, 
      billing_interval,
      country,
      customer_type,
      vat_number,
      vat_number_valid,
      amount_excl_vat,
      vat_rate,
      vat_amount,
      amount_incl_vat
    } = await req.json()
    
    console.log('Creating subscription:', { plan, billing_interval, userId: user.id })

    if (!PRICING[plan]) {
      throw new Error('Invalid plan selected')
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single()

    console.log('User profile:', profile)

    const userName = profile?.full_name || 'LinqBoard User'
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1)
    const intervalText = billing_interval === 'monthly' ? 'Maandelijks' : 'Jaarlijks'

    // Check if user already has an active subscription
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('mollie_customer_id, mollie_subscription_id, plan')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId: string

    // If there's an active Mollie subscription, cancel it first
    if (existingSub?.mollie_subscription_id && existingSub?.mollie_customer_id) {
      console.log('Cancelling existing Mollie subscription:', existingSub.mollie_subscription_id)
      
      try {
        const cancelResponse = await fetch(
          `https://api.mollie.com/v2/customers/${existingSub.mollie_customer_id}/subscriptions/${existingSub.mollie_subscription_id}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${MOLLIE_API_KEY}` }
          }
        )

        if (cancelResponse.ok) {
          console.log('Previous subscription cancelled successfully')
        } else {
          console.log('Failed to cancel previous subscription, continuing anyway')
        }
      } catch (error) {
        console.error('Error cancelling previous subscription:', error)
        // Continue anyway, might already be cancelled
      }
    }

    if (existingSub?.mollie_customer_id) {
      // Use existing customer ID
      customerId = existingSub.mollie_customer_id
      console.log('Using existing Mollie customer:', customerId)
    } else {
      // Create new Mollie customer
      const customerResponse = await fetch('https://api.mollie.com/v2/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MOLLIE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${userName} - LinqBoard`,
          email: user.email
        })
      })
      
      const customer = await customerResponse.json()
      customerId = customer.id
      console.log('Mollie customer created:', customerId)
    }

    // Use calculated VAT amount
    const totalAmount = amount_incl_vat
    const interval = billing_interval === 'monthly' ? '1 month' : '1 year'
    
    const paymentResponse = await fetch(`https://api.mollie.com/v2/customers/${customerId}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: { currency: 'EUR', value: totalAmount.toFixed(2) },
        description: `LinqBoard ${planName} (${intervalText})`,
        redirectUrl: `${req.headers.get('origin')}/subscription-success`,
        webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mollie-webhook`,
        sequenceType: 'first',
        metadata: {
          plan: plan,
          billing_interval: billing_interval,
          user_id: user.id,
          user_name: userName,
          user_email: user.email,
          country: country,
          customer_type: customer_type,
          vat_number: vat_number || '',
          vat_number_valid: vat_number_valid || false,
          amount_excl_vat: amount_excl_vat.toFixed(2),
          vat_rate: vat_rate.toFixed(2),
          vat_amount: vat_amount.toFixed(2),
          amount_incl_vat: amount_incl_vat.toFixed(2)
        }
      })
    })
    
    const payment = await paymentResponse.json()
    console.log('Mollie payment created:', payment.id)
    
    if (!payment.id || !payment._links?.checkout?.href) {
      console.error('Invalid Mollie payment response:', payment)
      throw new Error('Failed to create Mollie payment')
    }

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Update or insert user_subscriptions in database
    const subscriptionData = {
      user_id: user.id,
      plan,
      billing_interval,
      status: 'pending',
      mollie_customer_id: customerId,
      mollie_subscription_id: payment.id, // Temporarily store payment ID, will be updated after first payment
      max_organizations: PRICING[plan].orgs,
      max_members_per_org: PRICING[plan].members,
      current_period_start: null,
      current_period_end: null,
      country: country,
      customer_type: customer_type,
      vat_number: vat_number || null,
      vat_number_valid: vat_number_valid || false,
      price_excl_vat: amount_excl_vat,
      vat_rate: vat_rate,
      vat_amount: vat_amount,
      price_incl_vat: amount_incl_vat,
      pending_plan: null,
      pending_billing_interval: null
    }

    let updateError
    if (existingSubscription) {
      // Update existing subscription
      const { error } = await supabase
        .from('user_subscriptions')
        .update(subscriptionData)
        .eq('user_id', user.id)
      updateError = error
    } else {
      // Insert new subscription
      const { error } = await supabase
        .from('user_subscriptions')
        .insert(subscriptionData)
      updateError = error
    }

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      throw updateError
    }

    console.log('Subscription saved to database')

    return new Response(
      JSON.stringify({ 
        checkoutUrl: payment._links.checkout.href,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in create-mollie-subscription:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
