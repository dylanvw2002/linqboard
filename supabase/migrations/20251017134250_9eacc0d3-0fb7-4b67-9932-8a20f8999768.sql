-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing cron job if it exists
SELECT cron.unschedule('check-deadline-reminders') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-deadline-reminders'
);

-- Create cron job to check deadline reminders every 2 hours between 8:00 and 17:00 Amsterdam time
-- Runs at: 8:00, 10:00, 12:00, 14:00, 16:00
SELECT cron.schedule(
  'check-deadline-reminders',
  '0 8,10,12,14,16 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://jfdpljhkrcuietevzshr.supabase.co/functions/v1/check-deadline-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZHBsamhrcmN1aWV0ZXZ6c2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzYwNjUsImV4cCI6MjA3NDk1MjA2NX0.nWXg-6JNxmWPbc-nSMHWnv8S5leKVR1hZeO5TKuWdWE"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);