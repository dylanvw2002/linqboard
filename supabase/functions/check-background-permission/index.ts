import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    // Get user subscription plan
    const { data: limits, error: limitsError } = await supabase.rpc(
      'get_user_subscription_limits', 
      { _user_id: user.id }
    )

    if (limitsError) {
      console.error('Error getting subscription limits:', limitsError)
      throw limitsError
    }

    const plan = limits?.[0]?.plan || 'free'
    const canCustomize = plan === 'team' || plan === 'business'

    return new Response(
      JSON.stringify({ 
        canCustomize,
        plan,
        message: canCustomize 
          ? 'Achtergrond aanpassen toegestaan' 
          : 'Upgrade naar Team of Business voor aangepaste achtergronden'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in check-background-permission:', error)
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
