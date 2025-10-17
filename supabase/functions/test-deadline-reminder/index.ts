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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { taskId, reminderType } = await req.json();

    if (!taskId || !reminderType) {
      throw new Error('taskId and reminderType are required');
    }

    if (!['due_today', 'overdue', 'both'].includes(reminderType)) {
      throw new Error('reminderType must be "due_today", "overdue", or "both"');
    }

    console.log(`Test trigger: Sending ${reminderType} reminder(s) for task ${taskId}`);

    const results = [];

    // Send due_today reminder
    if (reminderType === 'due_today' || reminderType === 'both') {
      const dueTodayResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-deadline-reminder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            taskId,
            reminderType: 'due_today'
          })
        }
      );

      const dueTodayResult = await dueTodayResponse.json();
      results.push({
        type: 'due_today',
        success: dueTodayResponse.ok,
        result: dueTodayResult
      });
    }

    // Send overdue reminder
    if (reminderType === 'overdue' || reminderType === 'both') {
      const overdueResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-deadline-reminder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            taskId,
            reminderType: 'overdue'
          })
        }
      );

      const overdueResult = await overdueResponse.json();
      results.push({
        type: 'overdue',
        success: overdueResponse.ok,
        result: overdueResult
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Test reminders sent',
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in test-deadline-reminder:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});