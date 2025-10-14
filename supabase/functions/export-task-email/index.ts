import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskExportRequest {
  taskId: string;
  recipientEmails?: string[];
  memberUserIds?: string[];
  personalMessage?: string;
  includeAttachments: boolean;
  language: string;
}

// Generate iCalendar .ics file content
function generateICS(task: any, columnName: string, language: string): string {
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dueDate = new Date(task.due_date);
  const dtstart = dueDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // Set reminder 1 day before
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - 1);
  const reminderDtstart = reminderDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const description = task.description?.replace(/\n/g, '\\n') || '';
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LinqBoard//Task Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:linqboard-task-${task.id}@linqboard.io
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
SUMMARY:${task.title} (${columnName})
DESCRIPTION:${description}
STATUS:CONFIRMED
PRIORITY:${task.priority === 'high' ? '1' : task.priority === 'medium' ? '5' : '9'}
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: ${task.title}
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

// Email template constant
const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LinqBoard – Taak Export</title>
  </head>
  <body
    style="position:relative;margin:0;padding:0;background:linear-gradient(180deg, #f5f3ff 0%, #ede9fe 50%, #f5f3ff 100%);background-repeat:no-repeat;background-attachment:fixed;font-family:Inter,Arial,sans-serif;color:#000;min-height:100vh;"
  >
    <table
      align="center"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="max-width:600px;margin:0 auto;padding:40px 20px;position:relative;z-index:2;"
    >
      <tr>
        <td
          style="background:#fff;border:1px solid rgba(215,205,255,0.3);border-radius:16px;box-shadow:0 6px 24px rgba(160,140,255,0.15);padding:32px;color:#000;"
        >
          <div style="margin-bottom:16px;text-align:center;">
            <span
              style="background:{{priorityBg}};color:{{priorityFg}};padding:6px 14px;border-radius:12px;font-size:13px;margin-right:8px;display:inline-block;letter-spacing:0.2px;"
              >{{priorityLabel}}</span
            >
            <span
              style="background:linear-gradient(90deg,#fde68a,#fef9c3);color:#000;padding:6px 14px;border-radius:12px;font-size:13px;display:inline-block;letter-spacing:0.2px;"
              >{{deadline}}</span
            >
          </div>

          <h1
            style="font-family:Inter,Arial,sans-serif;font-size:26px;font-weight:700;margin:0 0 12px;text-align:center;color:#000;"
          >
            {{title}}
          </h1>

          <div
            style="background:#f9fafb;border-left:4px solid #c7d2fe;padding:16px 18px;border-radius:12px;margin-bottom:28px;line-height:1.6;font-size:15px;color:#000;"
          >
            {{description}}
          </div>

          <h3
            style="font-size:17px;color:#000;margin-bottom:12px;margin-top:0;text-align:center;"
          >
            👥 Toegewezen aan
          </h3>
          <table role="presentation" cellpadding="0" cellspacing="0" align="center">
            <tr>
              {{assigneesHtml}}
            </tr>
          </table>

          <h3
            style="font-size:17px;color:#000;margin-top:10px;margin-bottom:10px;text-align:center;"
          >
            📎 Bijlagen
          </h3>
          <ul style="padding-left:20px;margin-top:0;">
            {{attachmentsHtml}}
          </ul>

          <div style="text-align:center;margin-top:32px;">
            <a
              href="{{taskUrl}}"
              style="background:linear-gradient(135deg,#a5b4fc,#818cf8);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;box-shadow:0 2px 8px rgba(99,102,241,0.25);"
              >🔗 Bekijk in LinqBoard</a
            >
          </div>
        </td>
      </tr>

      <tr>
        <td
          style="text-align:center;padding:28px 0 0 0;color:#000;font-size:13px;position:relative;"
        >
          © 2025 LinqBoard – Samen, van to-do naar done.
        </td>
      </tr>
    </table>

    <img
      src="https://jfdpljhkrcuietevzshr.supabase.co/storage/v1/object/public/avatars/logo-linqboard.png"
      alt="LinqBoard Logo"
      style="position:fixed;bottom:20px;left:20px;height:140px;opacity:0.95;z-index:1;"
    />
  </body>
</html>`;

// Generate HTML email template
function generateEmailHTML(
  task: any, 
  column: any, 
  assignees: any[], 
  attachments: any[],
  boardId: string,
  language: string
): string {
  // Priority configuration
  const priorityConfig = {
    high: { bg: 'linear-gradient(135deg, #fca5a5, #f87171)', fg: '#fff', label: 'Hoog' },
    medium: { bg: 'linear-gradient(135deg, #fcd34d, #fbbf24)', fg: '#000', label: 'Middel' },
    low: { bg: 'linear-gradient(135deg, #86efac, #4ade80)', fg: '#000', label: 'Laag' }
  };
  
  const priority = task.priority || 'low';
  const priorityData = priorityConfig[priority as keyof typeof priorityConfig];
  
  // Format deadline
  const deadline = task.due_date 
    ? new Date(task.due_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Geen deadline';
  
  // Format description
  const description = task.description 
    ? task.description.replace(/\n/g, '<br>')
    : '<span style="color:#999;font-style:italic;">Geen beschrijving</span>';
  
  // Helper function for initials
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Generate assignees HTML
  const assigneesHtml = assignees.length > 0 
    ? assignees.map(a => `
        <td style="text-align:center;padding:0 8px 16px 0;">
          <div
            style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#c7d2fe,#a5b4fc);color:#000;font-weight:600;display:flex;align-items:center;justify-content:center;margin:auto;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.08);font-size:14px;"
          >
            ${getInitials(a.full_name)}
          </div>
          <div
            style="font-size:13px;color:#000;margin-top:4px;max-width:80px;word-break:break-word;"
          >
            ${a.full_name}
          </div>
        </td>
      `).join('')
    : '<td style="text-align:center;color:#999;font-style:italic;">Niet toegewezen</td>';
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    return `${(bytes / 1024).toFixed(0)} KB`;
  };
  
  // Generate attachments HTML
  const attachmentsHtml = attachments.length > 0
    ? attachments.map(att => `
        <li style="margin-bottom:6px;">
          <a
            href="${att.file_path}"
            style="color:#6366f1;text-decoration:none;font-size:14px;font-weight:500;"
          >${att.file_name}</a>
          <span style="color:#999;font-size:13px;">(${formatFileSize(att.file_size)})</span>
        </li>
      `).join('')
    : '<li style="color:#999;font-style:italic;">Geen bijlagen</li>';
  
  // Task URL
  const taskUrl = `https://linqboard.io/board/${boardId}`;
  
  // Replace all placeholders
  let html = EMAIL_TEMPLATE
    .replace(/{{priorityBg}}/g, priorityData.bg)
    .replace(/{{priorityFg}}/g, priorityData.fg)
    .replace(/{{priorityLabel}}/g, priorityData.label)
    .replace(/{{deadline}}/g, deadline)
    .replace(/{{title}}/g, task.title)
    .replace(/{{description}}/g, description)
    .replace(/{{assigneesHtml}}/g, assigneesHtml)
    .replace(/{{attachmentsHtml}}/g, attachmentsHtml)
    .replace(/{{taskUrl}}/g, taskUrl);
  
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

    const authHeader = req.headers.get('authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      taskId, 
      recipientEmails = [], 
      memberUserIds = [],
      personalMessage, 
      includeAttachments, 
      language 
    }: TaskExportRequest = await req.json();

    console.log('Exporting task:', { taskId, recipientEmails, memberUserIds, language });

    // Validate input
    if (!taskId) {
      throw new Error('Task ID is required');
    }

    // Fetch task with column info
    const { data: task, error: taskError } = await supabaseClient
      .from('tasks')
      .select(`
        *,
        columns (
          id,
          name,
          board_id,
          boards (
            organization_id
          )
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      throw new Error('Task not found');
    }

    // Verify user has access to this task's organization
    const { data: membership } = await supabaseClient
      .from('memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', task.columns.boards.organization_id)
      .single();

    if (!membership) {
      throw new Error('Access denied');
    }

    // Fetch emails for selected members
    let memberEmails: string[] = [];
    if (memberUserIds && memberUserIds.length > 0) {
      const { data: memberData, error: emailError } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .in('user_id', memberUserIds);

      if (!emailError && memberData) {
        // Get emails from auth.users for these user_ids
        const { data: { users }, error: usersError } = await supabaseClient.auth.admin.listUsers();
        
        if (!usersError && users) {
          memberEmails = users
            .filter((u: any) => memberUserIds.includes(u.id))
            .map((u: any) => u.email)
            .filter((email: string) => email);
        }
      }
    }

    // Combine member emails and external recipients
    const allRecipients = [...memberEmails, ...recipientEmails];

    if (allRecipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    if (allRecipients.length > 10) {
      throw new Error('Maximum 10 recipients allowed');
    }

    // Fetch assignees
    const { data: assigneesData } = await supabaseClient
      .from('task_assignees')
      .select(`
        user_id,
        profiles!inner (
          full_name,
          avatar_url
        )
      `)
      .eq('task_id', taskId);

    const assignees = assigneesData?.map((a: any) => ({
      user_id: a.user_id,
      full_name: a.profiles?.full_name || 'Unknown',
      avatar_url: a.profiles?.avatar_url
    })) || [];

    // Fetch comments
    const { data: commentsData } = await supabaseClient
      .from('comments')
      .select(`
        *,
        profiles (
          full_name
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    const comments = commentsData?.map((c: any) => ({
      ...c,
      full_name: c.profiles?.full_name || 'Unknown'
    })) || [];

    // Fetch attachments
    const { data: attachmentsData } = await supabaseClient
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId);

    const attachments = attachmentsData || [];

    // Generate email HTML
    const emailHtml = generateEmailHTML(
      task,
      task.columns,
      assignees,
      attachments,
      task.columns.board_id,
      language
    );

    const resend = new Resend(resendApiKey);
    
    // Prepare attachments array
    const emailAttachments: any[] = [];

    // Add .ics file if due_date exists
    if (task.due_date) {
      const icsContent = generateICS(task, task.columns.name, language);
      const icsBytes = new TextEncoder().encode(icsContent);
      emailAttachments.push({
        filename: `${task.title.replace(/[^a-z0-9]/gi, '_')}.ics`,
        content: base64Encode(icsBytes.buffer as ArrayBuffer),
      });
    }

    // Add file attachments if requested
    if (includeAttachments && attachments.length > 0) {
      for (const attachment of attachments) {
        // Download file from storage
        const { data: fileData, error: downloadError } = await supabaseClient
          .storage
          .from('task-attachments')
          .download(attachment.file_path);

        if (!downloadError && fileData) {
          const buffer = await fileData.arrayBuffer();
          emailAttachments.push({
            filename: attachment.file_name,
            content: base64Encode(buffer),
          });
        }
      }
    }

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'LinqBoard <no-reply@linqboard.io>',
      to: allRecipients,
      subject: `📋 ${task.title} - LinqBoard`,
      html: emailHtml,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
    });

    if (emailError) {
      throw new Error(`Email send failed: ${emailError.message}`);
    }

    console.log('Task exported successfully:', emailData);

    // Log the export
    await supabaseClient
      .from('activity_log')
      .insert({
        organization_id: task.columns.boards.organization_id,
        user_id: user.id,
        action: 'task_exported',
        entity_type: 'task',
        entity_id: taskId
      });

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in export-task-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
