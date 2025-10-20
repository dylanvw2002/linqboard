-- Remove old cron jobs
DO $$
BEGIN
  PERFORM cron.unschedule('check-task-deadline-reminders');
  PERFORM cron.unschedule('check-deadline-reminders');
  PERFORM cron.unschedule('check-deadline-reminders-hourly');
  PERFORM cron.unschedule('deadline-reminders-every-2-hours');
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'No existing cron jobs found.';
END $$;

-- Schedule new cron job (every 2 hours during business hours)
SELECT cron.schedule(
  'deadline-reminders-every-2-hours',
  '0 8,10,12,14,16 * * *',
  $$
  INSERT INTO cron.job_run_details (jobname, run_at, status)
  VALUES ('deadline-reminders-every-2-hours', now(), 'started');

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
