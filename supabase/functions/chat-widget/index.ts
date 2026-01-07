import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to detect if a question needs web search
function needsWebSearch(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  const searchIndicators = [
    'foutcode', 'fout code', 'error code', 'code', 'storing',
    'wat is', 'wat betekent', 'hoe werkt', 'hoe kan ik',
    'handleiding', 'manual', 'instructie',
    'prijs', 'kosten', 'tarief',
    'adres', 'telefoonnummer', 'contact',
    'openingstijden', 'open',
    'weer', 'temperatuur',
    'nieuws', 'actueel',
    'intergas', 'nefit', 'remeha', 'vaillant', 'bosch', 'daikin', 'mitsubishi',
    'cv ketel', 'warmtepomp', 'airco', 'verwarming',
    'recept', 'ingrediënten',
    'definitie', 'betekenis',
  ];
  
  return searchIndicators.some(indicator => lowerMessage.includes(indicator));
}

// Helper function to perform web search
async function performWebSearch(query: string): Promise<string | null> {
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlApiKey) {
    console.log('FIRECRAWL_API_KEY not configured, skipping web search');
    return null;
  }
  
  try {
    console.log('Performing web search for:', query);
    
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: 2,
        lang: 'nl',
        country: 'nl',
      }),
    });
    
    if (!response.ok) {
      console.error('Firecrawl search failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data || data.data.length === 0) {
      console.log('No search results found');
      return null;
    }
    
    const searchContext = data.data
      .map((result: any, index: number) => {
        const title = result.title || 'Onbekende bron';
        const url = result.url || '';
        const content = result.markdown?.slice(0, 1000) || result.description || '';
        return `[Bron ${index + 1}: ${title}]\nURL: ${url}\n${content}`;
      })
      .join('\n\n---\n\n');
    
    console.log('Web search successful, found', data.data.length, 'results');
    return searchContext;
  } catch (error) {
    console.error('Web search error:', error);
    return null;
  }
}

// Tool definitions for AI
const tools = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Maak een nieuwe taak aan op het board",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Titel van de taak" },
          column_name: { type: "string", description: "Naam van de kolom waar de taak in moet (bijv. 'Backlog', 'In Progress', 'Done')" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Prioriteit van de taak" },
          due_date: { type: "string", description: "Deadline in YYYY-MM-DD formaat (optioneel)" },
          description: { type: "string", description: "Beschrijving van de taak (optioneel)" }
        },
        required: ["title", "column_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "move_task",
      description: "Verplaats een taak naar een andere kolom",
      parameters: {
        type: "object",
        properties: {
          task_title: { type: "string", description: "Titel van de taak om te verplaatsen" },
          target_column: { type: "string", description: "Naam van de doelkolom" }
        },
        required: ["task_title", "target_column"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Bewerk een bestaande taak (titel, beschrijving, prioriteit of deadline)",
      parameters: {
        type: "object",
        properties: {
          task_title: { type: "string", description: "Huidige titel van de taak" },
          new_title: { type: "string", description: "Nieuwe titel (optioneel)" },
          new_description: { type: "string", description: "Nieuwe beschrijving (optioneel)" },
          new_priority: { type: "string", enum: ["low", "medium", "high"], description: "Nieuwe prioriteit (optioneel)" },
          new_due_date: { type: "string", description: "Nieuwe deadline in YYYY-MM-DD formaat (optioneel)" }
        },
        required: ["task_title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_board_summary",
      description: "Geef een samenvatting van het board met taken per kolom en statistieken",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_overdue_tasks",
      description: "Toon alle taken die over hun deadline zijn",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_my_tasks",
      description: "Toon alle taken die aan de huidige gebruiker zijn toegewezen",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  }
];

// Load board context
async function loadBoardContext(supabaseAdmin: any, boardId: string, userId: string) {
  // Get board info
  const { data: board } = await supabaseAdmin
    .from('boards')
    .select('id, name')
    .eq('id', boardId)
    .single();

  // Get columns
  const { data: columns } = await supabaseAdmin
    .from('columns')
    .select('id, name, position')
    .eq('board_id', boardId)
    .order('position');

  // Get tasks with assignees
  const { data: tasks } = await supabaseAdmin
    .from('tasks')
    .select(`
      id, title, description, priority, due_date, column_id, position,
      task_assignees (
        user_id,
        profiles:user_id (full_name)
      )
    `)
    .in('column_id', columns?.map((c: any) => c.id) || [])
    .order('position');

  // Get team members
  const { data: memberships } = await supabaseAdmin
    .from('memberships')
    .select(`
      user_id,
      profiles:user_id (full_name)
    `)
    .eq('organization_id', board?.organization_id);

  return { board, columns: columns || [], tasks: tasks || [], memberships: memberships || [] };
}

// Build board context string for system prompt
function buildBoardContextString(context: any, userName: string) {
  const { board, columns, tasks } = context;
  
  let contextStr = `\n\n📋 BOARD CONTEXT - "${board?.name || 'Board'}"\n\n`;
  
  // List columns with tasks
  contextStr += `KOLOMMEN EN TAKEN:\n`;
  for (const column of columns) {
    const columnTasks = tasks.filter((t: any) => t.column_id === column.id);
    contextStr += `\n📁 ${column.name} (${columnTasks.length} taken):\n`;
    
    if (columnTasks.length === 0) {
      contextStr += `   (geen taken)\n`;
    } else {
      for (const task of columnTasks) {
        const assignees = task.task_assignees?.map((a: any) => a.profiles?.full_name).filter(Boolean).join(', ');
        const dueInfo = task.due_date ? ` 📅 ${task.due_date}` : '';
        const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
        contextStr += `   - "${task.title}" ${priorityEmoji}${dueInfo}${assignees ? ` 👤 ${assignees}` : ''}\n`;
      }
    }
  }

  // Statistics
  const totalTasks = tasks.length;
  const highPriority = tasks.filter((t: any) => t.priority === 'high').length;
  const overdue = tasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date()).length;

  contextStr += `\n📊 STATISTIEKEN:\n`;
  contextStr += `   Totaal taken: ${totalTasks}\n`;
  contextStr += `   Hoge prioriteit: ${highPriority}\n`;
  contextStr += `   Verlopen deadlines: ${overdue}\n`;
  contextStr += `\n👤 Huidige gebruiker: ${userName}\n`;

  return contextStr;
}

// Execute tool calls
async function executeTool(
  supabaseAdmin: any, 
  toolName: string, 
  args: any, 
  context: any,
  userId: string
): Promise<{ success: boolean; message: string; action?: string }> {
  const { columns, tasks, board } = context;

  try {
    switch (toolName) {
      case 'create_task': {
        const column = columns.find((c: any) => 
          c.name.toLowerCase() === args.column_name.toLowerCase()
        );
        
        if (!column) {
          return { 
            success: false, 
            message: `Kolom "${args.column_name}" niet gevonden. Beschikbare kolommen: ${columns.map((c: any) => c.name).join(', ')}` 
          };
        }

        const maxPosition = Math.max(...tasks.filter((t: any) => t.column_id === column.id).map((t: any) => t.position), -1);

        const { error } = await supabaseAdmin
          .from('tasks')
          .insert({
            title: args.title,
            description: args.description || null,
            priority: args.priority || 'medium',
            due_date: args.due_date || null,
            column_id: column.id,
            position: maxPosition + 1
          });

        if (error) throw error;

        return { 
          success: true, 
          message: `✅ Taak "${args.title}" aangemaakt in kolom "${column.name}"`,
          action: 'task_created'
        };
      }

      case 'move_task': {
        const task = tasks.find((t: any) => 
          t.title.toLowerCase().includes(args.task_title.toLowerCase())
        );
        
        if (!task) {
          return { 
            success: false, 
            message: `Taak "${args.task_title}" niet gevonden` 
          };
        }

        const targetColumn = columns.find((c: any) => 
          c.name.toLowerCase() === args.target_column.toLowerCase()
        );
        
        if (!targetColumn) {
          return { 
            success: false, 
            message: `Kolom "${args.target_column}" niet gevonden` 
          };
        }

        const maxPosition = Math.max(...tasks.filter((t: any) => t.column_id === targetColumn.id).map((t: any) => t.position), -1);

        const { error } = await supabaseAdmin
          .from('tasks')
          .update({ 
            column_id: targetColumn.id,
            position: maxPosition + 1
          })
          .eq('id', task.id);

        if (error) throw error;

        return { 
          success: true, 
          message: `✅ Taak "${task.title}" verplaatst naar "${targetColumn.name}"`,
          action: 'task_moved'
        };
      }

      case 'update_task': {
        const task = tasks.find((t: any) => 
          t.title.toLowerCase().includes(args.task_title.toLowerCase())
        );
        
        if (!task) {
          return { 
            success: false, 
            message: `Taak "${args.task_title}" niet gevonden` 
          };
        }

        const updates: any = {};
        if (args.new_title) updates.title = args.new_title;
        if (args.new_description !== undefined) updates.description = args.new_description;
        if (args.new_priority) updates.priority = args.new_priority;
        if (args.new_due_date) updates.due_date = args.new_due_date;

        if (Object.keys(updates).length === 0) {
          return { success: false, message: 'Geen wijzigingen opgegeven' };
        }

        const { error } = await supabaseAdmin
          .from('tasks')
          .update(updates)
          .eq('id', task.id);

        if (error) throw error;

        return { 
          success: true, 
          message: `✅ Taak "${task.title}" bijgewerkt`,
          action: 'task_updated'
        };
      }

      case 'get_board_summary': {
        let summary = `📋 **Board Samenvatting: ${board?.name}**\n\n`;
        
        for (const column of columns) {
          const columnTasks = tasks.filter((t: any) => t.column_id === column.id);
          summary += `**${column.name}** (${columnTasks.length})\n`;
          columnTasks.slice(0, 5).forEach((task: any) => {
            const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
            summary += `  ${priorityEmoji} ${task.title}\n`;
          });
          if (columnTasks.length > 5) {
            summary += `  ... en ${columnTasks.length - 5} meer\n`;
          }
          summary += '\n';
        }

        return { success: true, message: summary };
      }

      case 'get_overdue_tasks': {
        const today = new Date().toISOString().split('T')[0];
        const overdueTasks = tasks.filter((t: any) => t.due_date && t.due_date < today);
        
        if (overdueTasks.length === 0) {
          return { success: true, message: '✅ Geen verlopen taken gevonden!' };
        }

        let message = `⚠️ **${overdueTasks.length} verlopen taken:**\n\n`;
        overdueTasks.forEach((task: any) => {
          const column = columns.find((c: any) => c.id === task.column_id);
          message += `- "${task.title}" (deadline: ${task.due_date}) in ${column?.name}\n`;
        });

        return { success: true, message };
      }

      case 'get_my_tasks': {
        const myTasks = tasks.filter((t: any) => 
          t.task_assignees?.some((a: any) => a.user_id === userId)
        );
        
        if (myTasks.length === 0) {
          return { success: true, message: 'Je hebt momenteel geen taken toegewezen.' };
        }

        let message = `📌 **Jouw taken (${myTasks.length}):**\n\n`;
        myTasks.forEach((task: any) => {
          const column = columns.find((c: any) => c.id === task.column_id);
          const priorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
          const dueInfo = task.due_date ? ` (deadline: ${task.due_date})` : '';
          message += `${priorityEmoji} "${task.title}" in ${column?.name}${dueInfo}\n`;
        });

        return { success: true, message };
      }

      default:
        return { success: false, message: `Onbekende actie: ${toolName}` };
    }
  } catch (error) {
    console.error('Tool execution error:', error);
    return { success: false, message: `Fout bij uitvoeren: ${error instanceof Error ? error.message : 'Onbekende fout'}` };
  }
}

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
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
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
      boardId = widgetId.replace('fixed-', '');
      
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

    // Check subscription level
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

    // Load board context for AI
    const boardContext = await loadBoardContext(supabaseAdmin, boardId, user.id);
    const boardContextString = buildBoardContextString(boardContext, userName);

    // Get chat history
    let historyQuery = supabaseAdmin
      .from('widget_chat_messages')
      .select('role, content')
      .eq('widget_id', widgetId);
    
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

    // Check if we need to perform a web search
    let searchContext: string | null = null;
    if (needsWebSearch(message)) {
      searchContext = await performWebSearch(message);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build system prompt with board context
    let systemPrompt = `Je bent Linq, een slimme AI-assistent voor het LinqBoard project management platform.

JE KUNT ACTIES UITVOEREN:
- Taken aanmaken, verplaatsen en bewerken
- Board overzichten geven
- Verlopen deadlines tonen
- Je eigen taken tonen

REGELS:
1. Bij verzoeken om taken te maken/verplaatsen/bewerken: gebruik de juiste tool.
2. Houd antwoorden KORT: maximaal 2-3 zinnen.
3. Wees proactief: stel voor om taken aan te maken als iemand iets bespreekt.
4. Nederlands spreken.

${boardContextString}`;

    if (searchContext) {
      systemPrompt += `

WEB SEARCH RESULTATEN:
${searchContext}

Baseer je antwoord op bovenstaande bronnen indien relevant.`;
    }

    // Call Lovable AI with tools
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(messages || []),
          { role: 'user', content: `${userName}: ${message}` },
        ],
        tools,
        tool_choice: 'auto',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Te veel verzoeken. Probeer het later opnieuw.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits zijn op. Neem contact op met support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const choice = data.choices[0];
    
    let assistantMessage: string;
    let actionPerformed: string | null = null;

    // Check if AI wants to call a tool
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments || '{}');

      console.log('Executing tool:', toolName, toolArgs);

      // Execute the tool
      const toolResult = await executeTool(
        supabaseAdmin, 
        toolName, 
        toolArgs, 
        boardContext,
        user.id
      );

      // If action was performed, set flag
      if (toolResult.action) {
        actionPerformed = toolResult.action;
      }

      // Get AI to formulate a response based on tool result
      const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Je bent Linq. Geef een kort, vriendelijk antwoord gebaseerd op het resultaat. Nederlands.' },
            { role: 'user', content: `${userName}: ${message}` },
            { role: 'assistant', content: null, tool_calls: [toolCall] },
            { role: 'tool', tool_call_id: toolCall.id, content: toolResult.message },
          ],
        }),
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        assistantMessage = followUpData.choices[0]?.message?.content || toolResult.message;
      } else {
        assistantMessage = toolResult.message;
      }
    } else {
      assistantMessage = choice.message?.content || 'Sorry, ik kon geen antwoord genereren.';
    }

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
      JSON.stringify({ 
        message: assistantMessage,
        action: actionPerformed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-widget function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
