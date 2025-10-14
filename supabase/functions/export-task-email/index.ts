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
  
  const priorityColor = task.priority ? priorityColors[task.priority as keyof typeof priorityColors] : '#6b7280';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8B7BE8 0%, #6B5DD3 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">LinqBoard</h1>
      </div>
      
      <div style="padding: 30px; background: white;">
        <h2 style="color: #333;">${t.greeting},</h2>
        
        <p style="color: #666; line-height: 1.6;">
          ${t.intro}
        </p>
        
        ${personalMessage ? `
          <div style="background: #f5f3ff; padding: 15px; border-left: 4px solid #8B7BE8; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #8B7BE8;">${t.personalMessage}</h4>
            <p style="margin: 0; color: #666;">${personalMessage}</p>
          </div>
        ` : ''}
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #8B7BE8;">${t.taskDetails}</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">${t.column}:</td>
              <td style="padding: 8px 0; color: #333;">${column.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">${t.title}:</td>
              <td style="padding: 8px 0; color: #333;">${task.title}</td>
            </tr>
            ${task.description ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold; vertical-align: top;">${t.description}:</td>
                <td style="padding: 8px 0; color: #333;">${task.description.replace(/\n/g, '<br>')}</td>
              </tr>
            ` : ''}
            ${task.priority ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">${t.priority}:</td>
                <td style="padding: 8px 0;">
                  <span style="background: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; text-transform: uppercase;">
                    ${task.priority}
                  </span>
                </td>
              </tr>
            ` : ''}
            ${task.due_date ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">${t.dueDate}:</td>
                <td style="padding: 8px 0; color: #333;">${new Date(task.due_date).toLocaleDateString(language === 'en' ? 'en-US' : 'nl-NL')}</td>
              </tr>
            ` : ''}
          </table>
        </div>
        
        ${assignees.length > 0 ? `
          <div style="margin: 20px 0;">
            <h4 style="color: #333; margin-bottom: 10px;">${t.assignees}</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${assignees.map(a => `
                <div style="background: #f5f3ff; padding: 8px 12px; border-radius: 6px; display: inline-block;">
                  <span style="color: #8B7BE8; font-weight: 500;">${a.full_name}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${comments.length > 0 ? `
          <div style="margin: 20px 0;">
            <h4 style="color: #333; margin-bottom: 10px;">${t.comments}</h4>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
              ${comments.map(c => `
                <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                  <div style="color: #8B7BE8; font-weight: 500; margin-bottom: 5px;">${c.full_name}</div>
                  <div style="color: #666; font-size: 14px;">${c.content}</div>
                  <div style="color: #999; font-size: 12px; margin-top: 5px;">
                    ${new Date(c.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'nl-NL')} 
                    ${new Date(c.created_at).toLocaleTimeString(language === 'en' ? 'en-US' : 'nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${attachments.length > 0 ? `
          <div style="margin: 20px 0;">
            <h4 style="color: #333; margin-bottom: 10px;">${t.attachments}</h4>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
              ${attachments.map(att => `
                <div style="padding: 8px; margin-bottom: 8px; background: white; border-radius: 4px;">
                  📎 ${att.file_name} <span style="color: #999; font-size: 12px;">(${(att.file_size / 1024).toFixed(1)} KB)</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${task.due_date ? `
          <p style="color: #666; font-size: 14px; font-style: italic; margin-top: 20px;">
            📅 ${t.calendarNote}
          </p>
        ` : ''}
      </div>
      
      <div style="background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>${t.footer}</p>
        <p>KvK: 97289388 | BTW: NL005260317B10</p>
      </div>
    </div>
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
        .rpc('get_org_member_emails', { _org_id: task.columns.boards.organization_id });

      if (!emailError && memberData) {
        memberEmails = memberData
          .filter((m: any) => memberUserIds.includes(m.user_id))
          .map((m: any) => m.email);
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
