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

    const { widgetId, message, userName } = await req.json();

    if (!widgetId || !message) {
      throw new Error('Missing widgetId or message');
    }

    // Verify user has access to widget (check widget -> board -> membership)
    const { data: accessCheck, error: accessError } = await supabaseAdmin
      .from('widgets')
      .select(`
        id,
        board_id,
        boards!inner (
          id,
          organization_id,
          memberships!inner (
            user_id
          )
        )
      `)
      .eq('id', widgetId)
      .eq('boards.memberships.user_id', user.id)
      .single();

    if (accessError || !accessCheck) {
      console.error('Access denied:', accessError);
      throw new Error('Access denied - user is not a member of this board\'s organization');
    }

    // Get chat history
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('widget_chat_messages')
      .select('role, content')
      .eq('widget_id', widgetId)
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
            content: 'Je bent een behulpzame assistent voor LinqBoard. Help gebruikers met hun taken, planning en vragen over het board. Antwoord altijd in het Nederlands en wees vriendelijk en professioneel. Wanneer je een bericht van een gebruiker ontvangt, begin je reactie met het noemen van hun naam.',
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
        role: 'assistant',
        content: assistantMessage,
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
