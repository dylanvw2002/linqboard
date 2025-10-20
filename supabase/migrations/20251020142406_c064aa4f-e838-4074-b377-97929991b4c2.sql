-- Remove all existing deadline reminder cron jobs
SELECT cron.unschedule('check-task-deadline-reminders');
SELECT cron.unschedule('check-deadline-reminders');
SELECT cron.unschedule('check-deadline-reminders-hourly');

-- Create a single cron job that runs every 2 hours during business hours (8, 10, 12, 14, 16)
SELECT cron.schedule(
  'deadline-reminders-every-2-hours',
  '0 8,10,12,14,16 * * *', -- At minute 0 of hours 8, 10, 12, 14, and 16
  $$
  SELECT
    net.http_post(
        url:='https://jfdpljhkrcuietevzshr.supabase.co/functions/v1/check-deadline-reminders',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body:=jsonb_build_object('time', now())
    ) as request_id;
  $$
);