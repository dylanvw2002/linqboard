import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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
              'custom': 'op het ingestelde moment',
            };

            const offsetLabel = offsetLabels[reminder.reminder_offset] || 'op het ingestelde moment';
            const dueDate = task.due_date ? new Date(task.due_date).toLocaleString('nl-NL') : 'Niet ingesteld';

            console.log(`Sending email to ${userEmail} for task: ${task.title}`);
            
            const emailResult = await resend.emails.send({
              from: 'LinqBoard Herinneringen <herinneringen@linqboard.io>',
              to: [userEmail],
              subject: `⏰ Herinnering: ${task.title}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .task-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .task-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
                    .task-detail { margin: 10px 0; }
                    .label { font-weight: bold; color: #667eea; }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>⏰ Taak Herinnering</h1>
                    </div>
                    <div class="content">
                      <p>Je hebt een herinnering ingesteld ${offsetLabel}.</p>
                      
                      <div class="task-info">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-detail">${task.description}</div>` : ''}
                        <div class="task-detail">
                          <span class="label">Deadline:</span> ${dueDate}
                        </div>
                        ${task.priority ? `<div class="task-detail"><span class="label">Prioriteit:</span> ${task.priority}</div>` : ''}
                      </div>

                      <p>Log in op LinqBoard om de taak te bekijken en bij te werken.</p>
                    </div>
                    <div class="footer">
                      <p>Dit is een automatische herinnering van LinqBoard</p>
                    </div>
                  </div>
                </body>
                </html>
              `,
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