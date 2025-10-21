-- Fix deadline reminder cron job to run only on weekdays with correct auth
-- Remove old cron job if exists (safe unschedule)
DO $$ 
BEGIN
  PERFORM cron.unschedule('deadline-reminders-every-2-hours');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create new cron job: Monday-Friday (1-5), every 2 hours from 8:00-16:00
SELECT cron.schedule(
  'deadline-reminders-weekdays',
  '0 8,10,12,14,16 * * 1-5',
  $$
  SELECT
    net.http_post(
        url:='https://jfdpljhkrcuietevzshr.supabase.co/functions/v1/check-deadline-reminders',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (
            SELECT decrypted_secret 
            FROM vault.decrypted_secrets 
            WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
          )
        ),
        body:=jsonb_build_object('time', now())
    ) as request_id;
  $$
);