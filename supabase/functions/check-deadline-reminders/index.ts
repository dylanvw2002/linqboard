import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[INIT] Function started at ${new Date().toISOString()}`);
    
    // DISABLED: Automatic deadline reminders are disabled.
    // Users should set up reminders manually via the TaskReminders component.
    // The process-task-reminders function handles user-configured reminders.
    console.log(`[DISABLED] Automatic deadline reminders are disabled. Only manual reminders are sent.`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Automatic deadline reminders are disabled. Use manual reminders instead.',
        summary: { due_today_sent: 0, overdue_sent: 0, errors: 0 }
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
