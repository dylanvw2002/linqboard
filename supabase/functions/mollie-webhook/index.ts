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
    
    console.log('Payment status:', payment.status)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update subscription status based on payment status
    if (payment.status === 'paid') {
      const periodStart = new Date()
      const periodEnd = new Date()
      
      // Check if it's monthly or yearly subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('billing_interval')
        .eq('mollie_subscription_id', payment.subscriptionId)
        .single()
      
      if (subscription?.billing_interval === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      }

      await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString()
        })
        .eq('mollie_subscription_id', payment.subscriptionId)
      
      console.log('Subscription activated')
    } else if (payment.status === 'failed') {
      await supabase
        .from('user_subscriptions')
        .update({ status: 'past_due' })
        .eq('mollie_subscription_id', payment.subscriptionId)
      
      console.log('Subscription marked as past_due')
    }

    return new Response(null, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(null, { status: 400 })
  }
})
