import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      throw new Error('Authentication failed')
    }

    console.log('Cancelling subscription for user:', user.id)

    // Get subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('mollie_customer_id, mollie_subscription_id, plan')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.mollie_subscription_id) {
      throw new Error('No active subscription found')
    }

    console.log('Found subscription:', subscription.mollie_subscription_id)

    // Cancel in Mollie
    const cancelResponse = await fetch(
      `https://api.mollie.com/v2/customers/${subscription.mollie_customer_id}/subscriptions/${subscription.mollie_subscription_id}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${MOLLIE_API_KEY}` }
      }
    )

    if (!cancelResponse.ok) {
      const errorText = await cancelResponse.text()
      const errorData = JSON.parse(errorText)
      
      // If subscription is already cancelled, that's fine - just proceed to update database
      if (cancelResponse.status === 422 && errorData.detail?.includes('cancelled')) {
        console.log('Subscription already cancelled in Mollie, updating database')
      } else {
        console.error('Mollie cancellation failed:', errorText)
        throw new Error('Failed to cancel subscription with Mollie')
      }
    } else {
      console.log('Mollie subscription cancelled')
    }

    // Update database - downgrade to free plan
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ 
        plan: 'free',
        status: 'active',
        max_organizations: 1,
        max_members_per_org: 2,
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
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      throw updateError
    }

    console.log('Subscription downgraded to free plan')

    return new Response(
      JSON.stringify({ success: true, message: 'Subscription cancelled successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in cancel-mollie-subscription:', error)
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
