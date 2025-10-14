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

// Generate HTML email template
function generateEmailHTML(
  task: any, 
  column: any, 
  assignees: any[], 
  comments: any[], 
  attachments: any[],
  personalMessage: string | undefined,
  language: string
): string {
  const translations = {
    nl: {
      greeting: 'Hallo',
      intro: 'Je hebt een taak ontvangen van LinqBoard.',
      taskDetails: 'Taakdetails',
      column: 'Kolom',
      title: 'Titel',
      description: 'Beschrijving',
      priority: 'Prioriteit',
      dueDate: 'Deadline',
      assignees: 'Toegewezen aan',
      comments: 'Opmerkingen',
      attachments: 'Bijlagen',
      noDescription: 'Geen beschrijving',
      noComments: 'Geen opmerkingen',
      noAttachments: 'Geen bijlagen',
      personalMessage: 'Persoonlijk bericht',
      calendarNote: 'Als er een deadline is ingesteld, vind je een kalenderbestand (.ics) als bijlage om toe te voegen aan je agenda.',
      footer: 'LinqBoard | Sikkelvoorde 4, 3204 EJ Spijkenisse'
    },
    en: {
      greeting: 'Hello',
      intro: 'You have received a task from LinqBoard.',
      taskDetails: 'Task Details',
      column: 'Column',
      title: 'Title',
      description: 'Description',
      priority: 'Priority',
      dueDate: 'Due Date',
      assignees: 'Assigned to',
      comments: 'Comments',
      attachments: 'Attachments',
      noDescription: 'No description',
      noComments: 'No comments',
      noAttachments: 'No attachments',
      personalMessage: 'Personal Message',
      calendarNote: 'If a deadline is set, you will find a calendar file (.ics) as an attachment to add to your calendar.',
      footer: 'LinqBoard | Sikkelvoorde 4, 3204 EJ Spijkenisse'
    }
  };
  
  const t = translations[language as keyof typeof translations] || translations.nl;
  
  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981'
  };
  
  const priorityLabels = {
    nl: { high: 'Hoog', medium: 'Gemiddeld', low: 'Laag' },
    en: { high: 'High', medium: 'Medium', low: 'Low' }
  };
  
  const priorityColor = task.priority ? priorityColors[task.priority as keyof typeof priorityColors] : '#6b7280';
  const priorityLabel = task.priority ? priorityLabels[language as keyof typeof priorityLabels][task.priority as keyof typeof priorityColors] : task.priority;
  
  // Function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${task.title} - LinqBoard</title>
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 25%, #6b21a8 50%, #7c3aed 75%, #9333ea 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <!-- Wrapper with gradient background -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 25%, #6b21a8 50%, #7c3aed 75%, #9333ea 100%); padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Main container -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
              
              <!-- Header with Logo -->
              <tr>
                <td align="center" style="padding: 0 0 30px 0;">
                  <img src="https://jfdpljhkrcuietevzshr.supabase.co/storage/v1/object/public/avatars/logo-linqboard.png" alt="LinqBoard Logo" style="height: 50px; width: auto; display: block;" />
                </td>
              </tr>
              
              <!-- Task Card Container -->
              <tr>
                <td style="background: #ffffff; border: 2px solid rgba(139, 123, 232, 0.3); border-radius: 24px; box-shadow: 0 10px 40px rgba(107, 93, 211, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1); padding: 0; overflow: hidden;">

                  <!-- Personal Message (if exists) -->
                  ${personalMessage ? `
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 20px; margin: 20px; background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-left: 4px solid #8B7BE8; border-radius: 16px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding-bottom: 8px;">
                                <span style="display: inline-block; background: #8B7BE8; color: white; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 12px; border-radius: 12px;">💬 ${t.personalMessage}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="color: #4a5568; font-size: 15px; line-height: 1.6; font-style: italic;">
                                "${personalMessage}"
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  ` : ''}
                  
                  <!-- Task Content -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 32px;">
                        
                        <!-- Task Title -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="padding-bottom: 24px;">
                              <h1 style="margin: 0; color: #1a202c; font-size: 28px; font-weight: 600; line-height: 1.3; font-family: Georgia, 'Times New Roman', Times, serif; letter-spacing: -0.5px;">
                                ${task.title}
                              </h1>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Column & Priority Badges -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="padding-bottom: 24px;">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td style="padding-right: 8px;">
                                    <span style="display: inline-block; background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); color: #4c51bf; font-size: 14px; font-weight: 600; padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(165, 180, 252, 0.5);">
                                      📋 ${column.name}
                                    </span>
                                  </td>
                                  ${task.priority ? `
                                    <td style="padding-right: 8px;">
                                      <span style="display: inline-block; background: ${priorityColor}; color: white; font-size: 14px; font-weight: 600; padding: 8px 16px; border-radius: 20px; box-shadow: 0 2px 8px ${priorityColor}40;">
                                        ${priorityLabel}
                                      </span>
                                    </td>
                                  ` : ''}
                                  ${task.due_date ? `
                                    <td>
                                      <span style="display: inline-block; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #92400e; font-size: 14px; font-weight: 600; padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(251, 191, 36, 0.5);">
                                        📅 ${new Date(task.due_date).toLocaleDateString(language === 'en' ? 'en-US' : 'nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </span>
                                    </td>
                                  ` : ''}
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Description -->
                        ${task.description ? `
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 16px; margin: 16px 20px; background: #fafbfc; border-left: 4px solid #8B7BE8; border-radius: 12px;">
                                <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${task.description.replace(/\n/g, '<br>')}</p>
                              </td>
                            </tr>
                            <tr><td style="height: 24px;"></td></tr>
                          </table>
                        ` : ''}
                        
                        <!-- Assigned Users -->
                        ${assignees.length > 0 ? `
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding-bottom: 12px;">
                                <h3 style="margin: 0; color: #2d3748; font-size: 16px; font-weight: 600;">
                                  👥 ${t.assignees}
                                </h3>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 24px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    ${assignees.map(a => `
                                      <td style="padding-right: 16px; padding-bottom: 12px;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                          <tr>
                                             <td align="center">
                                              <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #8B7BE8 0%, #6B5DD3 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px; margin-bottom: 6px; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                                ${getInitials(a.full_name)}
                                              </div>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td align="center">
                                              <div style="color: #4a5568; font-size: 13px; font-weight: 500; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                                ${a.full_name}
                                              </div>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    `).join('')}
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        ` : ''}
                        
                        <!-- Comments -->
                        ${comments.length > 0 ? `
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding-bottom: 12px;">
                                <h3 style="margin: 0; color: #2d3748; font-size: 16px; font-weight: 600;">
                                  💬 ${t.comments}
                                </h3>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 24px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fafbfc; border-radius: 12px; padding: 16px; margin: 16px 20px; border: 1px solid #e5e7eb;">
                                  ${comments.map((c, idx) => `
                                    <tr>
                                      <td style="padding: 12px 0; ${idx < comments.length - 1 ? 'border-bottom: 1px solid #e2e8f0;' : ''}">
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                          <tr>
                                            <td style="width: 36px; vertical-align: top; padding-right: 12px;">
                                              <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">
                                                ${getInitials(c.full_name)}
                                              </div>
                                            </td>
                                            <td style="vertical-align: top;">
                                              <div style="color: #8B7BE8; font-weight: 600; font-size: 14px; margin-bottom: 4px;">
                                                ${c.full_name}
                                              </div>
                                              <div style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 6px;">
                                                ${c.content}
                                              </div>
                                              <div style="color: #a0aec0; font-size: 12px;">
                                                ${new Date(c.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'nl-NL', { day: 'numeric', month: 'short' })} om ${new Date(c.created_at).toLocaleTimeString(language === 'en' ? 'en-US' : 'nl-NL', { hour: '2-digit', minute: '2-digit' })}
                                              </div>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  `).join('')}
                                </table>
                              </td>
                            </tr>
                          </table>
                        ` : ''}
                        
                        <!-- Attachments -->
                        ${attachments.length > 0 ? `
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding-bottom: 12px;">
                                <h3 style="margin: 0; color: #2d3748; font-size: 16px; font-weight: 600;">
                                  📎 ${t.attachments}
                                </h3>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                  ${attachments.map(att => `
                                    <tr>
                                      <td style="padding: 16px; margin: 16px 20px; background: #fafbfc; border-radius: 12px; border: 1px solid #e5e7eb;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                          <tr>
                                            <td style="width: 40px; vertical-align: middle;">
                                              <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                                                ${att.file_type.startsWith('image/') ? '🖼️' : att.file_type.includes('pdf') ? '📄' : att.file_type.includes('word') || att.file_type.includes('document') ? '📝' : att.file_type.includes('sheet') || att.file_type.includes('excel') ? '📊' : '📎'}
                                              </div>
                                            </td>
                                            <td style="vertical-align: middle; padding-left: 12px;">
                                              <div style="color: #2d3748; font-weight: 500; font-size: 14px; margin-bottom: 2px;">
                                                ${att.file_name}
                                              </div>
                                              <div style="color: #a0aec0; font-size: 12px;">
                                                ${(att.file_size / 1024).toFixed(1)} KB
                                              </div>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                    <tr><td style="height: 8px;"></td></tr>
                                  `).join('')}
                                </table>
                              </td>
                            </tr>
                          </table>
                        ` : ''}
                        
                        <!-- Calendar Note -->
                        ${task.due_date ? `
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding-top: 24px; padding: 16px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; border: 1px solid #fbbf24;">
                                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                                  <strong>📅 ${t.calendarNote}</strong>
                                </p>
                              </td>
                            </tr>
                          </table>
                        ` : ''}
                        
                      </td>
                    </tr>
                  </table>
                  
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="padding: 30px 20px 0 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="color: rgba(255, 255, 255, 0.9); font-size: 14px; line-height: 1.6;">
                        <strong style="font-size: 16px; display: block; margin-bottom: 8px;">LinqBoard</strong>
                        Sikkelvoorde 4, 3204 EJ Spijkenisse<br>
                        KvK: 97289388 | BTW: NL005260317B10
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
    </html>
  `;
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
      comments,
      attachments,
      personalMessage,
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
      from: 'LinqBoard <info@linqboard.io>',
      to: allRecipients,
      subject: `${language === 'en' ? 'Task' : 'Taak'}: ${task.title}`,
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
