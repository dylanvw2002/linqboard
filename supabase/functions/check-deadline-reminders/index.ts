import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      console.log(`[TIME-CHECK] Outside business hours (${currentHour}:00). Skipping check.`);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Outside business hours (8:00-17:00)',
          summary: { due_today_sent: 0, overdue_sent: 0, errors: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[CHECK] Starting deadline reminder check at ${amsterdamTime.toISOString()}...`);

    const today = new Date(amsterdamTime.getFullYear(), amsterdamTime.getMonth(), amsterdamTime.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayISO = today.toISOString();
    const yesterdayISO = yesterday.toISOString();

    console.log('Checking for tasks due today:', todayISO);
    console.log('Checking for overdue tasks from:', yesterdayISO);

    // Find all tasks due today (reminders will be sent every 2 hours)
    const { data: dueTodayTasks, error: dueTodayError } = await supabase
      .from('tasks')
      .select('id, title, due_date')
      .gte('due_date', todayISO)
      .lt('due_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

    if (dueTodayError) {
      console.error('Error fetching due today tasks:', dueTodayError);
    } else {
      console.log(`Found ${dueTodayTasks?.length || 0} tasks due today`);
    }

    // Find all overdue tasks (any task with due_date before today)
    const { data: overdueTasks, error: overdueError } = await supabase
      .from('tasks')
      .select('id, title, due_date')
      .lt('due_date', todayISO);

    if (overdueError) {
      console.error('Error fetching overdue tasks:', overdueError);
    } else {
      console.log(`Found ${overdueTasks?.length || 0} overdue tasks`);
    }

    const results = {
      due_today: [] as any[],
      overdue: [] as any[],
      errors: [] as any[]
    };

    // Send "due today" reminders
    if (dueTodayTasks && dueTodayTasks.length > 0) {
      for (const task of dueTodayTasks.slice(0, 50)) { // Limit to 50 per batch
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/send-deadline-reminder`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                taskId: task.id,
                reminderType: 'due_today'
              })
            }
          );

          const result = await response.json();
          
          if (response.ok) {
            console.log(`✅ Due today reminder sent for task: ${task.title}`);
            results.due_today.push({ taskId: task.id, title: task.title, success: true });
          } else {
            console.error(`❌ Failed to send due today reminder for task ${task.title}:`, result);
            results.errors.push({ taskId: task.id, title: task.title, error: result.error });
          }
        } catch (error: any) {
          console.error(`❌ Error sending due today reminder for task ${task.title}:`, error);
          results.errors.push({ taskId: task.id, title: task.title, error: error.message });
        }
      }
    }

    // Send "overdue" reminders
    if (overdueTasks && overdueTasks.length > 0) {
      for (const task of overdueTasks.slice(0, 50)) { // Limit to 50 per batch
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/send-deadline-reminder`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                taskId: task.id,
                reminderType: 'overdue'
              })
            }
          );

          const result = await response.json();
          
          if (response.ok) {
            console.log(`✅ Overdue reminder sent for task: ${task.title}`);
            results.overdue.push({ taskId: task.id, title: task.title, success: true });
          } else {
            console.error(`❌ Failed to send overdue reminder for task ${task.title}:`, result);
            results.errors.push({ taskId: task.id, title: task.title, error: result.error });
          }
        } catch (error: any) {
          console.error(`❌ Error sending overdue reminder for task ${task.title}:`, error);
          results.errors.push({ taskId: task.id, title: task.title, error: error.message });
        }
      }
    }

    console.log('Deadline reminder check completed');
    console.log(`- Due today reminders sent: ${results.due_today.length}`);
    console.log(`- Overdue reminders sent: ${results.overdue.length}`);
    console.log(`- Errors: ${results.errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        summary: {
          due_today_sent: results.due_today.length,
          overdue_sent: results.overdue.length,
          errors: results.errors.length
        },
        details: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-deadline-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});