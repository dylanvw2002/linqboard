import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mollieApiKey = Deno.env.get('MOLLIE_API_KEY');
    if (!mollieApiKey) {
      throw new Error('Mollie API key not configured');
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Extract JWT token from header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('User not authenticated');
    }

    console.log('Authenticated user:', user.id);

    // Get user profile for email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get request body
    const { amount, description } = await req.json();

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    console.log(`Creating one-time payment for user ${user.id}: €${amount}`);

    // Create Mollie payment
    const mollieResponse = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mollieApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: {
          currency: 'EUR',
          value: amount.toFixed(2),
        },
        description: description || 'Eenmalige betaling',
        redirectUrl: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'http://localhost:5173'}/subscription-success`,
        webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mollie-webhook`,
        metadata: {
          user_id: user.id,
          email: user.email,
          type: 'one_time_payment',
        },
      }),
    });

    if (!mollieResponse.ok) {
      const errorText = await mollieResponse.text();
      console.error('Mollie API error:', errorText);
      throw new Error(`Mollie API error: ${mollieResponse.status} - ${errorText}`);
    }

    const payment = await mollieResponse.json();
    console.log('Payment created:', payment.id);

    // Store transaction in database
    const { error: transactionError } = await supabaseAdmin
      .from('mollie_transactions')
      .insert({
        user_id: user.id,
        payment_id: payment.id,
        amount: amount,
        status: payment.status,
        currency: 'EUR',
        customer_type: 'individual',
        mollie_response: payment,
      });

    if (transactionError) {
      console.error('Error storing transaction:', transactionError);
    }

    return new Response(
      JSON.stringify({ 
        checkoutUrl: payment._links.checkout.href,
        paymentId: payment.id,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-one-time-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
