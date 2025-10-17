import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = blob.type || 'image/png';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return '';
  }
}

const EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
    .header { padding: 30px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #e5e7eb; }
    .logo { max-width: 150px; height: auto; }
    .content { padding: 30px; }
    .priority-badge { display: inline-block; padding: 6px 16px; border-radius: 4px; font-size: 12px; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .priority-high { background: #fee2e2; color: #991b1b; }
    .priority-medium { background: #fef3c7; color: #92400e; }
    .priority-low { background: #dbeafe; color: #1e40af; }
    .task-title { font-size: 24px; font-weight: 600; margin: 16px 0; color: #111827; }
    .task-description { color: #6b7280; font-style: italic; padding: 16px; background: #f9fafb; border-left: 3px solid #e5e7eb; margin: 16px 0; }
    .section { border: 2px solid; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .section-violet { border-color: #8b5cf6; }
    .section-orange { border-color: #f97316; }
    .section-blue { border-color: #3b82f6; }
    .section-title { font-weight: 600; font-size: 14px; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .assignees { display: flex; flex-wrap: wrap; gap: 16px; }
    .assignee-item { display: flex; align-items: center; gap: 8px; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
    .meta-info { margin: 16px 0; padding: 16px; background: #f9fafb; border-radius: 6px; }
    .meta-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
    .meta-label { font-weight: 600; color: #374151; }
    .meta-value { color: #6b7280; }
    .personal-message { font-size: 15px; line-height: 1.8; color: #374151; }
    .signature { margin-top: 16px; font-size: 14px; color: #6b7280; }
    .cta-button { display: inline-flex; align-items: center; gap: 8px; background: white; color: #8b5cf6; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; border: 2px solid #8b5cf6; transition: all 0.2s; }
    .cta-button:hover { background: #8b5cf6; color: white; }
    .footer { padding: 24px; text-align: center; color: #9ca3af; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
    @media only screen and (max-width: 600px) { 
      .container { margin: 0; border-radius: 0; }
      .content { padding: 20px; }
      .assignees { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      {{LOGO}}
    </div>
    <div class="content">
      {{PRIORITY_BADGE}}
      <h1 class="task-title">{{TASK_TITLE}}</h1>
      {{TASK_DESCRIPTION}}
      
      {{ASSIGNEES_SECTION}}
      
      {{META_INFO}}
      
      <div class="section section-blue">
        <div class="section-title">📩 PERSOONLIJK BERICHT</div>
        <div class="personal-message">
          {{PERSONAL_MESSAGE}}
        </div>
        {{SIGNATURE}}
      </div>
      
      <div style="text-align: center;">
        <a href="{{BOARD_URL}}" class="cta-button">
          🔗 Bekijk in LinqBoard
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>© 2025 LinqBoard – Samen, van to-do naar done.</p>
    </div>
  </div>
</body>
</html>
`;

async function generateEmailHTML(
  task: any,
  column: any,
  assignees: any[],
  reminderType: 'due_today' | 'overdue',
  boardUrl: string,
  logoBase64: string
): Promise<string> {
  let html = EMAIL_TEMPLATE;

  // Logo
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="LinqBoard" class="logo" />`
    : '<h1 style="color: #8b5cf6; margin: 0;">LinqBoard</h1>';
  html = html.replace('{{LOGO}}', logoHtml);

  // Priority badge
  const priorityBadges = {
    high: '<span class="priority-badge priority-high">HOOG</span>',
    medium: '<span class="priority-badge priority-medium">MIDDEL</span>',
    low: '<span class="priority-badge priority-low">LAAG</span>',
  };
  html = html.replace('{{PRIORITY_BADGE}}', task.priority ? priorityBadges[task.priority as keyof typeof priorityBadges] || '' : '');

  // Task details
  html = html.replace('{{TASK_TITLE}}', task.title);
  
  // Task description
  const descriptionHtml = task.description 
    ? `<div class="task-description">${task.description}</div>`
    : '';
  html = html.replace('{{TASK_DESCRIPTION}}', descriptionHtml);

  // Due date
  const dueDate = new Date(task.due_date);
  const dueDateStr = dueDate.toLocaleDateString('nl-NL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Meta info section
  const metaInfoHtml = `
    <div class="meta-info">
      <div class="meta-row">
        <span class="meta-label">📅 Deadline:</span>
        <span class="meta-value">${dueDateStr}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">📋 Kolom:</span>
        <span class="meta-value">${column.name}</span>
      </div>
    </div>
  `;
  html = html.replace('{{META_INFO}}', metaInfoHtml);

  // Assignees section
  if (assignees.length > 0) {
    let assigneesHtml = '<div class="section section-violet"><div class="section-title">👥 TOEGEWEZEN AAN</div><div class="assignees">';
    for (const assignee of assignees) {
      const avatarHtml = assignee.avatar_url
        ? `<img src="${await imageUrlToBase64(assignee.avatar_url)}" alt="${assignee.full_name}" class="avatar" />`
        : '<div class="avatar" style="background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-weight: bold;">👤</div>';
      assigneesHtml += `<div class="assignee-item">${avatarHtml}<span>${assignee.full_name}</span></div>`;
    }
    assigneesHtml += '</div></div>';
    html = html.replace('{{ASSIGNEES_SECTION}}', assigneesHtml);
  } else {
    html = html.replace('{{ASSIGNEES_SECTION}}', '');
  }

  // Personal message
  const personalMessage = reminderType === 'due_today'
    ? `Beste,<br><br>Hierbij de uitnodiging om deel te nemen aan de vergadering op ${dueDateStr}. De afspraak is toegevoegd aan ieders planning.<br><br>Met vriendelijke groet,<br>LinqBoard`
    : `Beste,<br><br>Dit is een automatische reminder van LinqBoard. De deadline voor deze taak is verstreken op ${dueDateStr}. Graag zo spoedig mogelijk afhandelen.<br><br>Met vriendelijke groet,<br>LinqBoard`;
  
  html = html.replace('{{PERSONAL_MESSAGE}}', personalMessage);
  html = html.replace('{{SIGNATURE}}', '');
  html = html.replace('{{BOARD_URL}}', boardUrl);

  return html;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { taskId, reminderType, skipDuplicateCheck } = await req.json();

    console.log(`[v6-SKIP-CHECK] Processing ${reminderType} reminder for task ${taskId}, skipDuplicateCheck: ${skipDuplicateCheck}`);

    // Check if reminder already sent (skip for test mode)
    if (!skipDuplicateCheck) {
      const { data: existingReminder } = await supabase
        .from('task_deadline_reminders')
        .select('id')
        .eq('task_id', taskId)
        .eq('reminder_type', reminderType)
        .single();

      if (existingReminder) {
        console.log(`[v2] Reminder already sent for task ${taskId}`);
        return new Response(
          JSON.stringify({ message: 'Reminder already sent' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('[TEST MODE] Skipping duplicate check');
    }

    // Get task with column and board info
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        column:columns (
          id,
          name,
          board:boards (
            id,
            name,
            organization_id
          )
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      console.error('[v2] Task error:', taskError);
      throw new Error(`Task not found: ${taskError?.message}`);
    }

    console.log('[v2] Task found:', task.title);

    // Get assignees - SIMPLIFIED QUERY
    const { data: taskAssignees, error: assigneesError } = await supabase
      .from('task_assignees')
      .select('user_id')
      .eq('task_id', taskId);

    console.log(`[v2] Query result - taskAssignees:`, taskAssignees);
    console.log(`[v2] Query error - assigneesError:`, assigneesError);
    console.log(`[v3] Found ${taskAssignees?.length || 0} assignees for task`);

    if (!taskAssignees || taskAssignees.length === 0) {
      console.log('[v2] No assignees found for task - returning early');
      return new Response(
        JSON.stringify({ message: 'No assignees to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profiles for assignees
    const recipientIds = taskAssignees.map((a: any) => a.user_id);
    console.log('[v2] Recipient IDs:', recipientIds);
    
    const { data: assignees, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', recipientIds);

    console.log('[v2] Profiles found:', assignees);
    console.log('[v2] Profiles error:', profilesError);

    if (!assignees || assignees.length === 0) {
      console.log('[v2] No profiles found for assignees');
      return new Response(
        JSON.stringify({ message: 'No profiles found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to get user emails: ${usersError.message}`);
    }

    const recipients = users
      .filter(u => recipientIds.includes(u.id))
      .map(u => u.email)
      .filter(Boolean) as string[];

    if (recipients.length === 0) {
      throw new Error('No valid recipient emails found');
    }

    // Generate email HTML
    const boardUrl = `https://linqboard.nl/board/${task.column.board.id}`;
    const logoBase64 = await imageUrlToBase64('https://jfdpljhkrcuietevzshr.supabase.co/storage/v1/object/public/board-backgrounds/logo-linqboard.png');
    
    const emailHtml = await generateEmailHTML(
      task,
      task.column,
      assignees,
      reminderType,
      boardUrl,
      logoBase64
    );

    // Send email
    const subject = reminderType === 'due_today'
      ? `⏰ Deadline Vandaag: ${task.title}`
      : `⚠️ Deadline Overschreden: ${task.title}`;

    const { error: emailError } = await resend.emails.send({
      from: 'LinqBoard <info@linqboard.io>',
      to: recipients,
      subject,
      html: emailHtml,
    });

    if (emailError) {
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    // Record reminder sent
    const { error: insertError } = await supabase
      .from('task_deadline_reminders')
      .insert({
        task_id: taskId,
        reminder_type: reminderType,
        recipients: recipientIds,
      });

    if (insertError) {
      console.error('Failed to record reminder:', insertError);
    }

    console.log(`Reminder sent successfully to ${recipients.length} recipients`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipients: recipients.length,
        taskTitle: task.title 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-deadline-reminder:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});