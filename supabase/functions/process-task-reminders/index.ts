import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    const arrayBuffer = await response.arrayBuffer();
    const base64 = base64Encode(arrayBuffer);
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
  <title>LinqBoard – Taak Herinnering</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f3ff;">
    <tr>
      <td align="center" style="padding:8px;">
        
        <!-- Logo -->
        <img src="{{logoBase64}}" alt="LinqBoard" width="120" height="120" style="display:block;margin:0 auto 6px;" />
        
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:24px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Reminder Badge -->
          <tr>
            <td align="center" style="padding:8px 12px 6px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#dbeafe;color:#1e40af;font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;text-transform:uppercase;">
                    ⏰ Herinnering
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
          
          <!-- Meta Info (Deadline & Reminder Type) -->
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
                      <strong>Herinnering:</strong> {{offsetLabel}}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Priority if set -->
          {{priorityHtml}}
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 12px 12px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;box-shadow:0 3px 8px rgba(99,102,241,0.4);">
                    <a href="https://linqboard.io" style="display:block;padding:10px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;">
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting task reminders processing...');

    // Find all reminders that should be sent
    const { data: reminders, error: remindersError } = await supabase
      .from('task_reminders')
      .select(`
        id,
        task_id,
        user_id,
        notification_type,
        reminder_offset,
        tasks (
          id,
          title,
          description,
          due_date,
          priority
        )
      `)
      .eq('is_sent', false)
      .lte('remind_at', new Date().toISOString())
      .limit(50);

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError);
      throw remindersError;
    }

    if (!reminders || reminders.length === 0) {
      console.log('No reminders to process');
      return new Response(
        JSON.stringify({ message: 'No reminders to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${reminders.length} reminders to process`);

    // Pre-fetch logo
    const logoUrl = 'https://vvoktdypcvdawumavylp.supabase.co/storage/v1/object/public/Logo\'s/logo-transparent.png';
    const logoBase64 = await imageUrlToBase64(logoUrl);

    const results = {
      emailsSent: 0,
      notificationsCreated: 0,
      errors: [] as any[],
    };

    // Process each reminder
    for (const reminder of reminders) {
      try {
        const task = reminder.tasks as any;
        if (!task) {
          console.warn(`Task not found for reminder ${reminder.id}`);
          continue;
        }

        // Get user email
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          reminder.user_id
        );

        if (userError || !userData?.user?.email) {
          console.error(`Error fetching user ${reminder.user_id}:`, userError);
          results.errors.push({ reminder_id: reminder.id, error: 'User not found' });
          continue;
        }

        const userEmail = userData.user.email;
        console.log(`Processing reminder ${reminder.id} for user ${userEmail}, type: ${reminder.notification_type}`);

        // Send email notification if requested
        if (reminder.notification_type === 'email' || reminder.notification_type === 'both') {
          try {
            const offsetLabels: Record<string, string> = {
              '15_minutes': '15 minuten van tevoren',
              '1_hour': '1 uur van tevoren',
              '3_hours': '3 uur van tevoren',
              '1_day': '1 dag van tevoren',
              '3_days': '3 dagen van tevoren',
              '1_week': '1 week van tevoren',
              'custom': 'Op het ingestelde moment',
            };

            const offsetLabel = offsetLabels[reminder.reminder_offset] || 'Op het ingestelde moment';
            const dueDate = task.due_date ? new Date(task.due_date) : null;
            const dueDateStr = dueDate 
              ? dueDate.toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : 'Niet ingesteld';
            
            const description = task.description 
              ? task.description.replace(/\n/g, '<br>')
              : '<span style="color:#999;font-style:italic;">Geen beschrijving</span>';

            const priorityConfig: Record<string, { bg: string; fg: string; label: string }> = {
              high: { bg: '#fecaca', fg: '#991b1b', label: 'Hoog' },
              medium: { bg: '#fef08a', fg: '#854d0e', label: 'Middel' },
              low: { bg: '#bbf7d0', fg: '#166534', label: 'Laag' }
            };

            let priorityHtml = '';
            if (task.priority) {
              const prio = priorityConfig[task.priority];
              if (prio) {
                priorityHtml = `
                  <tr>
                    <td style="padding:0 12px 8px;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${prio.bg};border-radius:16px;">
                        <tr>
                          <td style="padding:8px 10px;">
                            <div style="font-size:12px;color:${prio.fg};font-weight:600;text-align:center;">
                              Prioriteit: ${prio.label}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                `;
              }
            }

            const emailHtml = EMAIL_TEMPLATE
              .replace(/{{logoBase64}}/g, logoBase64)
              .replace(/{{title}}/g, task.title)
              .replace(/{{description}}/g, description)
              .replace(/{{dueDateStr}}/g, dueDateStr)
              .replace(/{{offsetLabel}}/g, offsetLabel)
              .replace(/{{priorityHtml}}/g, priorityHtml);

            console.log(`Sending email to ${userEmail} for task: ${task.title}`);
            
            const emailResult = await resend.emails.send({
              from: 'LinqBoard Herinneringen <herinneringen@linqboard.io>',
              to: [userEmail],
              subject: `⏰ Herinnering: ${task.title}`,
              html: emailHtml,
            });

            console.log(`Email result for ${reminder.id}:`, JSON.stringify(emailResult));
            results.emailsSent++;
            console.log(`Email sent successfully for reminder ${reminder.id} to ${userEmail}`);
          } catch (emailError) {
            console.error(`Error sending email for reminder ${reminder.id}:`, emailError);
            results.errors.push({ reminder_id: reminder.id, error: 'Email send failed', details: String(emailError) });
          }
        }

        // Create desktop notification if requested
        if (reminder.notification_type === 'desktop' || reminder.notification_type === 'both') {
          console.log(`Creating desktop notification for reminder ${reminder.id}`);
          
          const { error: notificationError } = await supabase
            .from('user_notifications')
            .insert({
              user_id: reminder.user_id,
              task_id: task.id,
              title: `⏰ Herinnering: ${task.title}`,
              message: `Deadline: ${task.due_date ? new Date(task.due_date).toLocaleString('nl-NL') : 'Niet ingesteld'}`,
            });

          if (notificationError) {
            console.error(`Error creating notification for reminder ${reminder.id}:`, notificationError);
            results.errors.push({ reminder_id: reminder.id, error: 'Notification creation failed' });
          } else {
            results.notificationsCreated++;
            console.log(`Notification created successfully for reminder ${reminder.id}`);
          }
        }

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('task_reminders')
          .update({ is_sent: true })
          .eq('id', reminder.id);

        if (updateError) {
          console.error(`Error updating reminder ${reminder.id}:`, updateError);
          results.errors.push({ reminder_id: reminder.id, error: 'Update failed' });
        } else {
          console.log(`Reminder ${reminder.id} marked as sent`);
        }
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.errors.push({ reminder_id: reminder.id, error: errorMessage });
      }
    }

    console.log('Processing complete:', JSON.stringify(results));

    return new Response(
      JSON.stringify({
        message: 'Reminders processed',
        ...results,
        processed: reminders.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Fatal error in process-task-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});