import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find all recurring template tasks that need new instances
    const { data: templates, error: fetchError } = await supabase
      .from("tasks")
      .select("*, columns(board_id, column_type)")
      .eq("is_recurring_template", true)
      .not("recurrence_pattern", "is", null);

    if (fetchError) throw fetchError;
    if (!templates || templates.length === 0) {
      return new Response(JSON.stringify({ message: "No recurring tasks found", created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    let created = 0;

    for (const template of templates) {
      // Check if end date has passed
      if (template.recurrence_end_date && template.recurrence_end_date < today) continue;

      // Skip sick/vacation columns
      if (template.columns?.column_type === "sick_leave" || template.columns?.column_type === "vacation") continue;

      // Find the last created instance
      const { data: lastInstance } = await supabase
        .from("tasks")
        .select("created_at")
        .eq("recurring_parent_id", template.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastCreated = lastInstance && lastInstance.length > 0
        ? new Date(lastInstance[0].created_at)
        : new Date(template.created_at);

      // Check if it's time to create a new instance
      const interval = template.recurrence_interval || 1;
      const pattern = template.recurrence_pattern;
      let nextDue = new Date(lastCreated);

      if (pattern === "daily") {
        nextDue.setDate(nextDue.getDate() + interval);
      } else if (pattern === "weekly") {
        nextDue.setDate(nextDue.getDate() + interval * 7);
      } else if (pattern === "monthly") {
        nextDue.setMonth(nextDue.getMonth() + interval);
      }

      if (nextDue > now) continue;

      // Create new task instance
      const maxPosition = 0; // Will be at top
      const { error: insertError } = await supabase.from("tasks").insert({
        column_id: template.column_id,
        title: template.title,
        description: template.description,
        priority: template.priority,
        position: maxPosition,
        recurring_parent_id: template.id,
      });

      if (!insertError) {
        created++;
        // Copy assignees from template
        const { data: assignees } = await supabase
          .from("task_assignees")
          .select("user_id")
          .eq("task_id", template.id);

        if (assignees && assignees.length > 0) {
          const { data: newTask } = await supabase
            .from("tasks")
            .select("id")
            .eq("recurring_parent_id", template.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (newTask) {
            await supabase.from("task_assignees").insert(
              assignees.map((a: any) => ({ task_id: newTask.id, user_id: a.user_id }))
            );
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: "Recurring tasks processed", created }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
