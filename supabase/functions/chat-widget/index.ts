import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Use service role client for initial verification
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    const { widgetId, message, userName, isPrivate = false } = await req.json();

    if (!widgetId || !message) {
      throw new Error('Missing widgetId or message');
    }

    // Check if this is a fixed chat (uses board ID directly) or a widget chat
    const isFixedChat = typeof widgetId === 'string' && widgetId.startsWith('fixed-');
    let boardId: string;
    let organizationId: string;

    if (isFixedChat) {
      // Fixed chat: extract board ID from "fixed-{boardId}"
      boardId = widgetId.replace('fixed-', '');
      
      // Get board directly
      const { data: board, error: boardError } = await supabaseAdmin
        .from('boards')
        .select('id, organization_id')
        .eq('id', boardId)
        .single();

      if (boardError || !board) {
        console.error('Board not found:', boardError);
        throw new Error('Board niet gevonden');
      }
      
      organizationId = board.organization_id;
    } else {
      // Widget chat: get widget first, then board
      const { data: widget, error: widgetError } = await supabaseAdmin
        .from('widgets')
        .select('id, board_id')
        .eq('id', widgetId)
        .single();

      if (widgetError || !widget) {
        console.error('Widget not found:', widgetError);
        throw new Error('Widget niet gevonden');
      }

      boardId = widget.board_id;

      const { data: board, error: boardError } = await supabaseAdmin
        .from('boards')
        .select('id, organization_id')
        .eq('id', boardId)
        .single();

      if (boardError || !board) {
        console.error('Board not found:', boardError);
        throw new Error('Board niet gevonden');
      }
      
      organizationId = board.organization_id;
    }

    // Check membership
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (membershipError || !membership) {
      console.error('Access denied:', membershipError, 'User:', user.id, 'Org:', organizationId);
      throw new Error('Geen toegang tot dit board');
    }

    // Check subscription level - chat widget is only for team/business
    // Check the ORGANIZATION OWNER's subscription, not the individual user's
    const { data: ownerMembership, error: ownerError } = await supabaseAdmin
      .from('memberships')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('role', 'owner')
      .single();

    if (ownerError || !ownerMembership) {
      console.error('Organization owner not found:', ownerError);
      throw new Error('Organisatie eigenaar niet gevonden');
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('plan')
      .eq('user_id', ownerMembership.user_id)
      .single();

    if (subError || !subscription) {
      console.error('Subscription check failed:', subError);
      throw new Error('Geen geldig abonnement gevonden');
    }

    if (subscription.plan !== 'team' && subscription.plan !== 'business') {
      console.error('Insufficient subscription:', subscription.plan);
      throw new Error('AI Chat is alleen beschikbaar voor organisaties met Team of Business abonnementen');
    }

    // Get chat history - filter by privacy mode
    let historyQuery = supabaseAdmin
      .from('widget_chat_messages')
      .select('role, content')
      .eq('widget_id', widgetId);
    
    // For private mode, only get user's own messages
    if (isPrivate) {
      historyQuery = historyQuery.eq('user_id', user.id).eq('is_private', true);
    } else {
      historyQuery = historyQuery.eq('is_private', false);
    }
    
    const { data: messages, error: messagesError } = await historyQuery
      .order('created_at', { ascending: true })
      .limit(50);

    if (messagesError) {
      console.error('Failed to fetch chat history:', messagesError);
      throw new Error('Failed to fetch chat history');
    }

    // Store user message
    const { error: insertError } = await supabaseAdmin
      .from('widget_chat_messages')
      .insert({
        widget_id: widgetId,
        user_id: user.id,
        role: 'user',
        content: message,
        is_private: isPrivate,
      });

    if (insertError) {
      console.error('Failed to store user message:', insertError);
      throw new Error('Failed to store message');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call Lovable AI with user context
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Je bent Linq, de AI-assistent van LinqBoard.

BELANGRIJKSTE REGEL: Antwoord ALTIJD kort en bondig. Maximaal 2-3 zinnen per antwoord. Geen opsommingen of bullet points tenzij echt nodig.

Wat je doet:
- Uitleg geven over LinqBoard
- Vragen beantwoorden
- Informatie opzoeken

Wat je NIET kunt: aanpassingen maken aan het board. Zeg dit kort als iemand erom vraagt.

Stijl: vriendelijk, direct, beknopt. Nederlands.`,
          },
          ...(messages || []),
          {
            role: 'user',
            content: `${userName}: ${message}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || 'Sorry, ik kon geen antwoord genereren.';

    // Store assistant message
    const { error: assistantInsertError } = await supabaseAdmin
      .from('widget_chat_messages')
      .insert({
        widget_id: widgetId,
        user_id: isPrivate ? user.id : null,
        role: 'assistant',
        content: assistantMessage,
        is_private: isPrivate,
      });

    if (assistantInsertError) {
      console.error('Failed to store assistant message:', assistantInsertError);
    }

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in chat-widget function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
