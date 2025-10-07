import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY')

Deno.serve(async (req) => {
  try {
    const { id } = await req.json()
    console.log('Webhook received for payment:', id)
    
    // Fetch payment details from Mollie
    const response = await fetch(`https://api.mollie.com/v2/payments/${id}`, {
      headers: { 'Authorization': `Bearer ${MOLLIE_API_KEY}` }
    })
    const payment = await response.json()
    
    console.log('Payment status:', payment.status, 'Metadata:', payment.metadata)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update subscription status based on payment status
    if (payment.status === 'paid') {
      // This was the first payment, now create the actual subscription
      const { plan, billing_interval, user_id } = payment.metadata
      
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
          description: `LinqBoard ${plan} plan`,
          webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mollie-webhook`
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
        .select('pending_plan, pending_billing_interval')
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
    } else if (payment.status === 'failed') {
      const { user_id } = payment.metadata
      
      await supabase
        .from('user_subscriptions')
        .update({ status: 'past_due' })
        .eq('user_id', user_id)
      
      console.log('Payment failed, subscription marked as past_due')
    }

    return new Response(null, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(null, { status: 400 })
  }
})
