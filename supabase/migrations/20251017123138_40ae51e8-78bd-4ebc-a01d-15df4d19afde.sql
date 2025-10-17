-- Create table to track sent deadline reminders
CREATE TABLE IF NOT EXISTS public.task_deadline_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('due_today', 'overdue')),
  sent_at timestamptz DEFAULT now() NOT NULL,
  recipients jsonb NOT NULL,
  UNIQUE(task_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.task_deadline_reminders ENABLE ROW LEVEL SECURITY;

-- Only members of the organization can view reminders for their tasks
CREATE POLICY "Members can view deadline reminders"
ON public.task_deadline_reminders
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.columns c ON t.column_id = c.id
    JOIN public.boards b ON c.board_id = b.id
    JOIN public.memberships m ON b.organization_id = m.organization_id
    WHERE t.id = task_deadline_reminders.task_id
      AND m.user_id = auth.uid()
  )
);

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the cron job to check for deadline reminders daily at 08:00 UTC
SELECT cron.schedule(
  'check-task-deadline-reminders',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jfdpljhkrcuietevzshr.supabase.co/functions/v1/check-deadline-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  ) as request_id;
  $$
);