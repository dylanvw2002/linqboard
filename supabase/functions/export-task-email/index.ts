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

// Email template constant (Outlook-compatible)
const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LinqBoard – Taak Export (Outlook-proof)</title>
    <!--[if mso]>
      <style type="text/css">
        body, table, td, a { font-family: Arial, sans-serif !important; }
      </style>
    <![endif]-->
  </head>
  <body style="margin:0; padding:0; background:#ede9fe;">
    <!-- Background (with VML for Outlook) -->
    <!--[if mso | IE]>
      <v:background fill="t">
        <v:fill type="gradient" color="#f5f3ff" color2="#ede9fe" angle="180" />
      </v:background>
    <![endif]-->

    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ede9fe">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <!-- Outer container -->
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;">
            <tr>
              <td bgcolor="#ffffff" style="border:1px solid #E3DFFC; border-radius:24px; padding:0; box-shadow: 0 8px 24px rgba(160, 140, 255, 0.15);">
                <!-- Inner content as table-only for Outlook compatibility -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:separate; border-spacing:0;">

                  <!-- Spacer -->
                  <tr><td height="24" style="line-height:24px; font-size:0;">&nbsp;</td></tr>

                  <!-- Priority + Deadline -->
                  <tr>
                    <td align="center" style="padding:0 24px;">
                      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="background:{{priorityBg}}; color:{{priorityFg}}; font-size:14px; line-height:20px; padding:8px 18px; border-radius:16px; font-weight:700; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            {{priorityLabel}}
                          </td>
                          <td width="12">&nbsp;</td>
                          <td style="background:linear-gradient(135deg, #fde68a, #fef9c3); color:#000; font-size:14px; line-height:20px; padding:8px 18px; border-radius:16px; font-weight:700; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            📅 {{deadline}}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Spacer -->
                  <tr><td height="16" style="line-height:16px; font-size:0;">&nbsp;</td></tr>

                  <!-- Title -->
                  <tr>
                    <td align="center" style="padding:0 24px;">
                      <h1 style="margin:0; font-family:Inter, Arial, sans-serif; font-size:26px; line-height:34px; font-weight:700; color:#000;">
                        {{title}}
                      </h1>
                    </td>
                  </tr>

                  <!-- Spacer -->
                  <tr><td height="12" style="line-height:12px; font-size:0;">&nbsp;</td></tr>

                  <!-- Description -->
                  <tr>
                    <td align="left" style="padding:0 24px;">
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f9fafb;">
                        <tr>
                          <td width="6" bgcolor="#c7d2fe" style="font-size:0; line-height:0;">&nbsp;</td>
                          <td style="padding:14px 16px; font-family:Inter, Arial, sans-serif; font-size:15px; line-height:24px; color:#000;">
                            {{description}}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Spacer -->
                  <tr><td height="24" style="line-height:24px; font-size:0;">&nbsp;</td></tr>

                  <!-- Assignees header -->
                  <tr>
                    <td align="center" style="padding:0 24px; font-family:Inter, Arial, sans-serif; color:#000;">
                      <strong style="font-size:17px;">👥 Toegewezen aan</strong>
                    </td>
                  </tr>

                  <!-- Spacer -->
                  <tr><td height="12" style="line-height:12px; font-size:0;">&nbsp;</td></tr>

                  <!-- Assignees list (cells injected) -->
                  <tr>
                    <td align="center" style="padding:0 16px;">
                      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          {{assigneesHtml}}
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Spacer -->
                  <tr><td height="20" style="line-height:20px; font-size:0;">&nbsp;</td></tr>

                  <!-- Attachments header -->
                  <tr>
                    <td align="center" style="padding:0 24px; font-family:Inter, Arial, sans-serif; color:#000;">
                      <strong style="font-size:17px;">📎 Bijlagen</strong>
                    </td>
                  </tr>

                  <!-- Spacer -->
                  <tr><td height="8" style="line-height:8px; font-size:0;">&nbsp;</td></tr>

                  <!-- Attachments list (niet klikbaar) -->
                  <tr>
                    <td align="left" style="padding:0 24px;">
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="font-family:Inter, Arial, sans-serif; font-size:14px; line-height:22px; color:#000;">
                            <ul style="padding-left:18px; margin:0; list-style-type:disc;">
                              {{attachmentsText}}
                            </ul>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Spacer -->
                  <tr><td height="24" style="line-height:24px; font-size:0;">&nbsp;</td></tr>

                  <!-- CTA -->
                  <tr>
                    <td align="center" style="padding:0 24px;">
                      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="background:linear-gradient(135deg, #a5b4fc, #818cf8); border-radius:16px; box-shadow: 0 4px 12px rgba(129, 140, 248, 0.3);">
                            <a href="{{taskUrl}}" style="display:inline-block; padding:16px 40px; font-family:Inter, Arial, sans-serif; font-size:16px; font-weight:700; color:#ffffff; text-decoration:none; letter-spacing:0.3px;">🔗 Bekijk in LinqBoard</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Spacer bottom -->
                  <tr><td height="28" style="line-height:28px; font-size:0;">&nbsp;</td></tr>

                </table>
              </td>
            </tr>

            <!-- Footer met groter logo -->
            <tr>
              <td align="center" style="padding:18px 8px 0 8px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;">
                  <tr>
                    <td align="left" valign="middle" width="220">
                      <img src="https://vvoktdypcvdawumavylp.supabase.co/storage/v1/object/public/Logo's/logo-transparent.png" alt="LinqBoard" style="display:block; height:120px;" height="120" />
                    </td>
                    <td align="right" valign="middle" style="font-family:Inter, Arial, sans-serif; font-size:13px; color:#000;">
                      © 2025 LinqBoard – Samen, van to-do naar done.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
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
  
  // Generate attachments text (simple list items, not clickable links)
  const attachmentsText = attachments.length > 0
    ? attachments.map(att => `
        <li style="margin-bottom:6px;">
          ${att.file_name} <span style="color:#999;">(${formatFileSize(att.file_size)})</span>
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
    .replace(/{{attachmentsText}}/g, attachmentsText)
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
