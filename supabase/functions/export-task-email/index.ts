import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// Helper function to convert image URL to base64
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    const arrayBuffer = await response.arrayBuffer();
    const base64 = base64Encode(arrayBuffer);
    
    // Determine MIME type from URL
    const ext = url.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return ''; // Return empty string on error
  }
}

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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LinqBoard – Taak Export</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f3ff;">
    <tr>
      <td align="center" style="padding:8px;">
        
        <!-- Logo -->
        <img src="{{logoBase64}}" alt="LinqBoard" width="120" height="120" style="display:block;margin:0 auto 6px;" />
        
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:24px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Priority Badge -->
          <tr>
            <td align="center" style="padding:8px 12px 6px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:{{priorityBg}};color:{{priorityFg}};font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;text-transform:uppercase;">
                    {{priorityLabel}}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td align="center" style="padding:0 12px 8px;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#1e1b4b;">{{title}}</h1>
            </td>
          </tr>
          
          <!-- Description -->
          <tr>
            <td style="padding:0 12px 8px;">
              <div style="background:#f9fafb;border-left:4px solid #c7d2fe;padding:8px;border-radius:12px;font-size:13px;line-height:1.4;color:#334155;">
                {{description}}
              </div>
            </td>
          </tr>
          
          <!-- Assignees -->
          <tr>
            <td style="padding:0 12px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf5ff;border-radius:16px;border:2px solid #a855f7;">
                <tr>
                  <td style="padding:10px;">
                    <div style="font-size:11px;font-weight:700;color:#6b21a8;text-transform:uppercase;margin-bottom:8px;text-align:center;">
                      👥 Toegewezen aan
                    </div>
                    <div style="text-align:center;">
                      <table cellpadding="0" cellspacing="0" border="0" style="display:inline-table;">
                        <tr>
                          {{assigneesHtml}}
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Attachments -->
          <tr>
            <td style="padding:0 12px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef9f5;border-radius:16px;border:2px solid #f97316;">
                <tr>
                  <td style="padding:10px;">
                    <div style="font-size:11px;font-weight:700;color:#9a3412;text-transform:uppercase;margin-bottom:6px;">
                      📎 Bijlagen
                    </div>
                    <ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.4;color:#451a03;">
                      {{attachmentsText}}
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Personal Message -->
          <tr>
            <td style="padding:0 12px 8px;">
              {{personalMessageHtml}}
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 12px 12px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;box-shadow:0 3px 8px rgba(99,102,241,0.4);">
                    <a href="{{taskUrl}}" style="display:block;padding:10px 28px;font-size:14px;font-weight:700;color:#a855f7;text-decoration:none;font-family:Arial,sans-serif;">
                      🔗 Bekijk in LinqBoard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
        <!-- Footer -->
        <div style="margin-top:8px;font-size:11px;color:#64748b;text-align:center;padding-bottom:8px;">
          © 2025 LinqBoard – Samen, van to-do naar done.
        </div>
        
      </td>
    </tr>
  </table>
</body>
</html>`;

// Generate HTML email template
async function generateEmailHTML(
  task: any, 
  column: any, 
  assignees: any[], 
  attachments: any[],
  boardId: string,
  language: string,
  personalMessage?: string,
  logoBase64?: string
): Promise<string> {
  // Priority configuration
  const priorityConfig = {
    high: { bg: 'linear-gradient(135deg, #fca5a5, #f87171)', fg: '#fff', label: 'Hoog' },
    medium: { bg: 'linear-gradient(135deg, #fcd34d, #fbbf24)', fg: '#000', label: 'Middel' },
    low: { bg: 'linear-gradient(135deg, #86efac, #4ade80)', fg: '#000', label: 'Laag' }
  };
  
  const priority = task.priority || 'low';
  const priorityData = priorityConfig[priority as keyof typeof priorityConfig];
  
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
  
  // Generate assignees HTML - simplified for email compatibility
  // Convert avatar URLs to base64 for embedded display
  const assigneesWithBase64 = await Promise.all(
    assignees.map(async (a) => {
      if (a.avatar_url && a.avatar_base64) {
        return { ...a, avatar_base64: a.avatar_base64 };
      }
      return a;
    })
  );
  
  const assigneesHtml = assigneesWithBase64.length > 0 
    ? assigneesWithBase64.map(a => {
        const avatarContent = a.avatar_base64
          ? `<img src="${a.avatar_base64}" alt="${a.full_name}" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(139,92,246,0.3);" />`
          : `<div style="width:44px;height:44px;line-height:44px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#c4b5fd);color:#fff;font-weight:700;font-size:16px;border:2px solid #fff;box-shadow:0 2px 6px rgba(139,92,246,0.3);text-align:center;">${getInitials(a.full_name)}</div>`;
        
        return `
        <td align="center" style="padding:0 6px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" valign="middle">
                ${avatarContent}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:4px;font-size:11px;color:#4c1d95;font-weight:600;">
                ${a.full_name}
              </td>
            </tr>
          </table>
        </td>
      `;
      }).join('')
    : '<td align="center" style="color:#9ca3af;font-style:italic;font-size:12px;">Niet toegewezen</td>';
  
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
  
  // Personal message HTML
  const personalMessageHtml = personalMessage 
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eff6ff;border-radius:16px;border:2px solid #3b82f6;">
        <tr>
          <td style="padding:10px;">
            <div style="font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;margin-bottom:6px;">
              💌 Persoonlijk bericht
            </div>
            <div style="font-size:12px;line-height:1.4;color:#1e3a8a;">
              ${personalMessage.replace(/\n/g, '<br>')}
            </div>
          </td>
        </tr>
      </table>`
    : '';
  
  // Replace all placeholders
  let html = EMAIL_TEMPLATE
    .replace(/{{logoBase64}}/g, logoBase64 || '')
    .replace(/{{priorityBg}}/g, priorityData.bg)
    .replace(/{{priorityFg}}/g, priorityData.fg)
    .replace(/{{priorityLabel}}/g, priorityData.label)
    .replace(/{{title}}/g, task.title)
    .replace(/{{description}}/g, description)
    .replace(/{{assigneesHtml}}/g, assigneesHtml)
    .replace(/{{attachmentsText}}/g, attachmentsText)
    .replace(/{{personalMessageHtml}}/g, personalMessageHtml)
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

    // Fetch assignees - first get user_ids
    const { data: assigneesData, error: assigneesError } = await supabaseClient
      .from('task_assignees')
      .select('user_id')
      .eq('task_id', taskId);

    console.log('Task assignees data:', JSON.stringify(assigneesData, null, 2));
    console.log('Task assignees error:', assigneesError);

    let assignees: any[] = [];

    if (assigneesData && assigneesData.length > 0) {
      const userIds = assigneesData.map(a => a.user_id);
      
      // Then fetch profiles for those user_ids
      const { data: profilesData, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      console.log('Profiles data:', JSON.stringify(profilesData, null, 2));
      console.log('Profiles error:', profilesError);

      assignees = profilesData?.map((profile: any) => ({
        user_id: profile.user_id,
        full_name: profile.full_name || 'Onbekend',
        avatar_url: profile.avatar_url
      })) || [];
    }

    console.log('Final assignees:', JSON.stringify(assignees, null, 2));

    // Convert logo to base64 for embedding
    const logoUrl = 'https://vvoktdypcvdawumavylp.supabase.co/storage/v1/object/public/Logo\'s/logo-transparent.png';
    const logoBase64 = await imageUrlToBase64(logoUrl);

    // Convert assignee avatars to base64
    const assigneesWithBase64Avatars = await Promise.all(
      assignees.map(async (assignee) => {
        if (assignee.avatar_url) {
          const avatarBase64 = await imageUrlToBase64(assignee.avatar_url);
          return { ...assignee, avatar_base64: avatarBase64 };
        }
        return assignee;
      })
    );

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
    console.log('Generating email with assignees:', assigneesWithBase64Avatars);
    const emailHtml = await generateEmailHTML(
      task,
      task.columns,
      assigneesWithBase64Avatars,
      attachments,
      task.columns.board_id,
      language,
      personalMessage,
      logoBase64
    );
    console.log('Email HTML length:', emailHtml.length);

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
