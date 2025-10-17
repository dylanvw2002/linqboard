-- Remove the existing daily cron job
SELECT cron.unschedule('check-task-deadline-reminders');

-- Schedule the cron job to check for deadline reminders every hour
SELECT cron.schedule(
  'check-task-deadline-reminders',
  '0 * * * *', -- Every hour at minute 0
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