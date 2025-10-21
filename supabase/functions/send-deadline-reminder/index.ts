import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    return '';
  }
}

const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LinqBoard – Deadline Reminder</title>
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
          
          <!-- Meta Info (Deadline & Column) -->
          <tr>
            <td style="padding:0 12px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef9f5;border-radius:16px;border:2px solid #f97316;">
                <tr>
                  <td style="padding:10px;">
                    <div style="font-size:11px;font-weight:700;color:#9a3412;text-transform:uppercase;margin-bottom:6px;">
                      📅 Details
                    </div>
                    <div style="font-size:12px;line-height:1.6;color:#451a03;">
                      <strong>Deadline:</strong> {{dueDateStr}}<br>
                      <strong>Kolom:</strong> {{columnName}}
                    </div>
                  </td>
                </tr>
              </table>
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

async function generateEmailHTML(
  task: any,
  column: any,
  assignees: any[],
  reminderType: 'due_today' | 'overdue',
  boardUrl: string,
  logoBase64: string
): Promise<string> {
  // Priority configuration
  const priorityConfig = {
    high: { bg: '#fecaca', fg: '#991b1b', label: 'Hoog' },
    medium: { bg: '#fef08a', fg: '#854d0e', label: 'Middel' },
    low: { bg: '#bbf7d0', fg: '#166534', label: 'Laag' }
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
  
  // Convert assignee avatars to base64 and generate HTML
  const assigneesWithBase64 = await Promise.all(
    assignees.map(async (a) => {
      if (a.avatar_url) {
        const avatarBase64 = await imageUrlToBase64(a.avatar_url);
        return { ...a, avatar_base64: avatarBase64 };
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
  
  // Due date
  const dueDate = new Date(task.due_date);
  const dueDateStr = dueDate.toLocaleDateString('nl-NL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Replace all placeholders
  let html = EMAIL_TEMPLATE
    .replace(/{{logoBase64}}/g, logoBase64 || '')
    .replace(/{{priorityBg}}/g, priorityData.bg)
    .replace(/{{priorityFg}}/g, priorityData.fg)
    .replace(/{{priorityLabel}}/g, priorityData.label)
    .replace(/{{title}}/g, task.title)
    .replace(/{{description}}/g, description)
    .replace(/{{assigneesHtml}}/g, assigneesHtml)
    .replace(/{{dueDateStr}}/g, dueDateStr)
    .replace(/{{columnName}}/g, column.name)
    .replace(/{{taskUrl}}/g, boardUrl);
  
  return html;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if current time is within business hours (8:00 - 17:00 Amsterdam time)
    const now = new Date();
    const amsterdamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
    const currentHour = amsterdamTime.getHours();
    
    if (currentHour < 8 || currentHour >= 17) {
      console.log(`[TIME-CHECK] Outside business hours (${currentHour}:00). Skipping reminder.`);
      return new Response(
        JSON.stringify({ message: 'Outside business hours (8:00-17:00)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { taskId, reminderType } = await req.json();

    console.log(`[REMINDER] Processing ${reminderType} reminder for task ${taskId}`);

    // Note: No duplicate check - reminders are sent every 2 hours regardless of previous sends
    // This is intentional per user requirements

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
    const boardUrl = `https://linqboard.io/board/${task.column.board.id}`;
    const logoUrl = 'https://vvoktdypcvdawumavylp.supabase.co/storage/v1/object/public/Logo\'s/logo-transparent.png';
    const logoBase64 = await imageUrlToBase64(logoUrl);
    
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
      from: 'LinqBoard <noreply@linqboard.io>',
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