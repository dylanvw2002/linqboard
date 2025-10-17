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

    // Step 1: Get widget
    const { data: widget, error: widgetError } = await supabaseAdmin
      .from('widgets')
      .select('id, board_id')
      .eq('id', widgetId)
      .single();

    if (widgetError || !widget) {
      console.error('Widget not found:', widgetError);
      throw new Error('Widget niet gevonden');
    }

    // Step 2: Get board
    const { data: board, error: boardError } = await supabaseAdmin
      .from('boards')
      .select('id, organization_id, name')
      .eq('id', widget.board_id)
      .single();

    if (boardError || !board) {
      console.error('Board not found:', boardError);
      throw new Error('Board niet gevonden');
    }

    // Step 3: Check membership
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', board.organization_id)
      .maybeSingle();

    if (membershipError || !membership) {
      console.error('Access denied:', membershipError, 'User:', user.id, 'Org:', board.organization_id);
      throw new Error('Geen toegang tot dit board');
    }

    // Check subscription level - chat widget is only for team/business
    // Check the ORGANIZATION OWNER's subscription, not the individual user's
    const { data: ownerMembership, error: ownerError } = await supabaseAdmin
      .from('memberships')
      .select('user_id')
      .eq('organization_id', board.organization_id)
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

    // Get chat history (limit to 20 for faster responses)
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('widget_chat_messages')
      .select('role, content')
      .eq('widget_id', widgetId)
      .order('created_at', { ascending: true })
      .limit(20);

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

    // Get board context for AI
    const { data: columns } = await supabaseAdmin
      .from('columns')
      .select('name, column_type')
      .eq('board_id', widget.board_id);

    const { data: teamMembers } = await supabaseAdmin
      .from('profiles')
      .select('full_name, user_id')
      .in('user_id', 
        await supabaseAdmin
          .from('memberships')
          .select('user_id')
          .eq('organization_id', board.organization_id)
          .then(res => res.data?.map(m => m.user_id) || [])
      );

    const boardContext = `
Board: "${board.name || 'Onbekend'}"
Kolommen: ${columns?.map(c => `${c.name} (${c.column_type})`).join(', ') || 'geen'}
Teamleden: ${teamMembers?.map(t => t.full_name).join(', ') || 'geen'}`;

    // Define tools for AI to use
    const tools = [
      {
        type: "function",
        function: {
          name: "create_task",
          description: "Maak een nieuwe taak aan in een kolom",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Titel van de taak" },
              column_name: { type: "string", description: "Naam van de kolom" },
              assignee_name: { type: "string", description: "Naam van toegewezen persoon (optioneel)" },
              description: { type: "string", description: "Beschrijving (optioneel)" },
            },
            required: ["title", "column_name"],
          },
        },
      },
    ];

    // Call Lovable AI without streaming (needed for function calling)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        max_completion_tokens: 150,
        tools: tools,
        tool_choice: "auto",
        messages: [
          {
            role: 'system',
            content: `Je bent Linq. MAX 2-3 zinnen. Gebruik tools om acties uit te voeren.

${boardContext}

Als je een taak moet aanmaken, gebruik dan create_task met de juiste kolom_name uit de lijst hierboven.`,
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
      
      if (response.status === 429) {
        throw new Error('Te veel verzoeken, probeer het later opnieuw');
      }
      if (response.status === 402) {
        throw new Error('Betaling vereist voor AI-gebruik');
      }
      throw new Error('AI antwoord mislukt');
    }

    const aiResponse = await response.json();
    const choice = aiResponse.choices?.[0];
    
    let fullMessage = '';

    console.log('AI response choice:', JSON.stringify(choice, null, 2));

    // Check if AI wants to call a function
    if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log('🔧 AI tool call:', functionName, 'Args:', JSON.stringify(functionArgs));

      // Execute the function
      if (functionName === 'create_task') {
        try {
          console.log('📋 Available columns:', JSON.stringify(columns));
          
          // Find column by name (case-insensitive and partial match)
          const targetColumn = columns?.find(c => 
            c.name.toLowerCase().includes(functionArgs.column_name.toLowerCase()) ||
            functionArgs.column_name.toLowerCase().includes(c.name.toLowerCase())
          );

          console.log('🎯 Target column:', targetColumn);

          if (!targetColumn) {
            fullMessage = `❌ Kolom "${functionArgs.column_name}" niet gevonden. Beschikbare: ${columns?.map(c => c.name).join(', ')}`;
          } else {
            // Find column ID
            const { data: columnData } = await supabaseAdmin
              .from('columns')
              .select('id')
              .eq('board_id', widget.board_id)
              .eq('name', targetColumn.name)
              .single();

            console.log('🆔 Column data:', columnData);

            if (!columnData) {
              fullMessage = `❌ Kolom ID niet gevonden.`;
            } else {
              // Create task
              console.log('✏️ Creating task:', {
                column_id: columnData.id,
                title: functionArgs.title,
                description: functionArgs.description || null,
              });

              const { data: taskData, error: taskError } = await supabaseAdmin
                .from('tasks')
                .insert({
                  column_id: columnData.id,
                  title: functionArgs.title,
                  description: functionArgs.description || null,
                  position: 0,
                })
                .select()
                .single();

              console.log('📝 Task created:', taskData, 'Error:', taskError);

              if (taskError) {
                console.error('❌ Task creation error:', taskError);
                fullMessage = `❌ Kon taak niet aanmaken: ${taskError.message}`;
              } else {
                // If assignee specified, try to assign
                if (functionArgs.assignee_name && taskData) {
                  console.log('👤 Looking for assignee:', functionArgs.assignee_name);
                  console.log('👥 Available team members:', JSON.stringify(teamMembers));
                  
                  const assignee = teamMembers?.find(m => 
                    m.full_name.toLowerCase().includes(functionArgs.assignee_name.toLowerCase())
                  );

                  console.log('🎯 Found assignee:', assignee);

                  if (assignee) {
                    const { error: assignError } = await supabaseAdmin
                      .from('task_assignees')
                      .insert({
                        task_id: taskData.id,
                        user_id: assignee.user_id,
                      });
                    
                    console.log('✅ Assigned to user, error:', assignError);
                  }
                }

                fullMessage = `✓ "${functionArgs.title}" toegevoegd aan ${targetColumn.name}.`;
              }
            }
          }
        } catch (error) {
          console.error('Function execution error:', error);
          fullMessage = `❌ Fout bij uitvoeren actie.`;
        }
      }
    } else {
      // No tool call, use regular message
      fullMessage = choice?.message?.content || 'Sorry, ik kon geen antwoord genereren.';
    }

    if (!fullMessage) {
      fullMessage = 'Sorry, ik kon geen antwoord genereren.';
    }

    // Store assistant message
    const { error: assistantInsertError } = await supabaseAdmin
      .from('widget_chat_messages')
      .insert({
        widget_id: widgetId,
        role: 'assistant',
        content: fullMessage,
      });

    if (assistantInsertError) {
      console.error('Failed to store assistant message:', assistantInsertError);
    }

    return new Response(
      JSON.stringify({ message: fullMessage }),
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
