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
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px 30px; }
    .deadline-alert { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; }
    .deadline-alert.overdue { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
    .task-card { border: 2px solid #e0e0e0; border-radius: 12px; padding: 20px; margin: 20px 0; background: #fafafa; }
    .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 10px; }
    .priority-high { background: #fee2e2; color: #991b1b; }
    .priority-medium { background: #fef3c7; color: #92400e; }
    .priority-low { background: #dbeafe; color: #1e40af; }
    .task-title { font-size: 24px; font-weight: bold; margin: 10px 0; color: #1f2937; }
    .task-description { color: #6b7280; margin: 15px 0; line-height: 1.8; }
    .assignees { margin: 20px 0; }
    .assignee-item { display: inline-flex; align-items: center; margin-right: 15px; margin-bottom: 10px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; margin-right: 8px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
    .meta-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .meta-row { display: flex; justify-content: space-between; margin: 8px 0; }
    @media only screen and (max-width: 600px) { .content { padding: 20px 15px; } .task-title { font-size: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      {{LOGO}}
    </div>
    <div class="content">
      <div class="deadline-alert {{ALERT_CLASS}}">
        <h2 style="margin: 0; font-size: 20px;">{{ALERT_TITLE}}</h2>
        <p style="margin: 10px 0 0 0; font-size: 16px;">{{ALERT_MESSAGE}}</p>
      </div>
      
      <div class="task-card">
        {{PRIORITY_BADGE}}
        <h1 class="task-title">{{TASK_TITLE}}</h1>
        <div class="task-description">{{TASK_DESCRIPTION}}</div>
        
        <div class="meta-info">
          <div class="meta-row">
            <strong>📅 Deadline:</strong>
            <span>{{DUE_DATE}}</span>
          </div>
          <div class="meta-row">
            <strong>📋 Kolom:</strong>
            <span>{{COLUMN_NAME}}</span>
          </div>
        </div>
        
        {{ASSIGNEES_SECTION}}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="{{BOARD_URL}}" class="cta-button">Bekijk in LinqBoard</a>
        </div>
      </div>
      
      {{PERSONAL_MESSAGE}}
    </div>
    
    <div class="footer">
      <p>Dit is een automatische reminder van LinqBoard</p>
      <p style="margin-top: 10px;">© 2024 LinqBoard. Alle rechten voorbehouden.</p>
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
    : '<h1 style="color: white; margin: 0;">LinqBoard</h1>';
  html = html.replace('{{LOGO}}', logoHtml);

  // Alert section
  if (reminderType === 'due_today') {
    html = html.replace('{{ALERT_CLASS}}', '');
    html = html.replace('{{ALERT_TITLE}}', '⏰ Deadline Vandaag!');
    html = html.replace('{{ALERT_MESSAGE}}', 'Deze taak heeft vandaag als deadline');
  } else {
    html = html.replace('{{ALERT_CLASS}}', 'overdue');
    html = html.replace('{{ALERT_TITLE}}', '⚠️ Deadline Overschreden!');
    html = html.replace('{{ALERT_MESSAGE}}', 'De deadline voor deze taak is verstreken');
  }

  // Priority badge
  const priorityBadges = {
    high: '<span class="priority-badge priority-high">🔴 Hoge Prioriteit</span>',
    medium: '<span class="priority-badge priority-medium">🟡 Gemiddelde Prioriteit</span>',
    low: '<span class="priority-badge priority-low">🟢 Lage Prioriteit</span>',
  };
  html = html.replace('{{PRIORITY_BADGE}}', task.priority ? priorityBadges[task.priority as keyof typeof priorityBadges] || '' : '');

  // Task details
  html = html.replace('{{TASK_TITLE}}', task.title);
  html = html.replace('{{TASK_DESCRIPTION}}', task.description || 'Geen beschrijving');
  html = html.replace('{{COLUMN_NAME}}', column.name);
  
  // Due date
  const dueDate = new Date(task.due_date);
  const dueDateStr = dueDate.toLocaleDateString('nl-NL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  html = html.replace('{{DUE_DATE}}', dueDateStr);

  // Assignees
  if (assignees.length > 0) {
    let assigneesHtml = '<div class="assignees"><strong>👥 Toegewezen aan:</strong><br/>';
    for (const assignee of assignees) {
      const avatarHtml = assignee.avatar_url
        ? `<img src="${await imageUrlToBase64(assignee.avatar_url)}" alt="${assignee.full_name}" class="avatar" />`
        : '<div class="avatar" style="background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-weight: bold;">👤</div>';
      assigneesHtml += `<div class="assignee-item">${avatarHtml}<span>${assignee.full_name}</span></div>`;
    }
    assigneesHtml += '</div>';
    html = html.replace('{{ASSIGNEES_SECTION}}', assigneesHtml);
  } else {
    html = html.replace('{{ASSIGNEES_SECTION}}', '');
  }

  html = html.replace('{{BOARD_URL}}', boardUrl);
  html = html.replace('{{PERSONAL_MESSAGE}}', '');

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

    const { taskId, reminderType } = await req.json();

    console.log(`[v4-INFO@LINQBOARD] Processing ${reminderType} reminder for task ${taskId}`);

    // Check if reminder already sent
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