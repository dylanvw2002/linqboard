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

    const { plan, billing_interval } = await req.json()
    
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

    // Create or get Mollie customer
    const customerResponse = await fetch('https://api.mollie.com/v2/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: profile?.full_name || 'LinqBoard User',
        email: user.email
      })
    })
    
    const customer = await customerResponse.json()
    console.log('Mollie customer created:', customer.id)

    // Create first payment (which will create the subscription after payment)
    const price = PRICING[plan][billing_interval as 'monthly' | 'yearly']
    const interval = billing_interval === 'monthly' ? '1 month' : '1 year'
    
    const paymentResponse = await fetch(`https://api.mollie.com/v2/customers/${customer.id}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: { currency: 'EUR', value: price.toFixed(2) },
        description: `LinqBoard ${plan} plan - Eerste betaling`,
        redirectUrl: `${req.headers.get('origin')}/dashboard?subscription=success`,
        webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mollie-webhook`,
        sequenceType: 'first',
        metadata: {
          plan: plan,
          billing_interval: billing_interval,
          user_id: user.id
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
      mollie_customer_id: customer.id,
      mollie_subscription_id: payment.id, // Temporarily store payment ID, will be updated after first payment
      max_organizations: PRICING[plan].orgs,
      max_members_per_org: PRICING[plan].members,
      current_period_start: null,
      current_period_end: null
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
