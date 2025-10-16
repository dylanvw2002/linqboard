import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const { widgetId } = await req.json();
    if (!widgetId) {
      throw new Error('Missing widgetId');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    // Get widget
    const { data: widget, error: widgetError } = await supabaseAdmin
      .from('widgets')
      .select('board_id')
      .eq('id', widgetId)
      .single();

    if (widgetError || !widget) {
      console.error('Widget not found:', widgetError);
      return new Response(
        JSON.stringify({ hasAccess: false, reason: 'Widget niet gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get board
    const { data: board, error: boardError } = await supabaseAdmin
      .from('boards')
      .select('organization_id')
      .eq('id', widget.board_id)
      .single();

    if (boardError || !board) {
      console.error('Board not found:', boardError);
      return new Response(
        JSON.stringify({ hasAccess: false, reason: 'Board niet gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is member of the organization
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', board.organization_id)
      .maybeSingle();

    if (membershipError || !membership) {
      console.error('Not a member:', membershipError);
      return new Response(
        JSON.stringify({ hasAccess: false, reason: 'Geen lid van deze organisatie' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get organization owner
    const { data: ownerMembership, error: ownerError } = await supabaseAdmin
      .from('memberships')
      .select('user_id')
      .eq('organization_id', board.organization_id)
      .eq('role', 'owner')
      .single();

    if (ownerError || !ownerMembership) {
      console.error('Owner not found:', ownerError);
      return new Response(
        JSON.stringify({ hasAccess: false, reason: 'Organisatie eigenaar niet gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check owner's subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('plan')
      .eq('user_id', ownerMembership.user_id)
      .single();

    if (subError || !subscription) {
      console.error('Subscription not found:', subError);
      return new Response(
        JSON.stringify({ hasAccess: false, reason: 'Geen abonnement gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasAccess = subscription.plan === 'team' || subscription.plan === 'business';

    return new Response(
      JSON.stringify({ 
        hasAccess,
        ownerPlan: subscription.plan,
        reason: hasAccess ? null : 'AI Chat vereist een Team of Business abonnement'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-widget-access:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ hasAccess: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});