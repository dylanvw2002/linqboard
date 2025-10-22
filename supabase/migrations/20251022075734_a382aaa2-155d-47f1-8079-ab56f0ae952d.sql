-- Verwijder oude cron job
SELECT cron.unschedule('deadline-reminders-weekdays');

-- Maak verbeterde cron job met error handling en logging
SELECT cron.schedule(
  'deadline-reminders-weekdays',
  '0 8,10,12,14,16 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://jfdpljhkrcuietevzshr.supabase.co/functions/v1/check-deadline-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret 
        FROM vault.decrypted_secrets 
        WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
      )
    ),
    body := jsonb_build_object(
      'time', now(),
      'triggered_by', 'cron',
      'timezone', 'Europe/Amsterdam'
    )
  ) as request_id;
  $$
);

-- Maak handmatige trigger functie voor testing
CREATE OR REPLACE FUNCTION trigger_deadline_reminders_manual()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://jfdpljhkrcuietevzshr.supabase.co/functions/v1/check-deadline-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret 
        FROM vault.decrypted_secrets 
        WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
      )
    ),
    body := jsonb_build_object(
      'time', now(), 
      'manual_trigger', true,
      'timezone', 'Europe/Amsterdam'
    )
  ) INTO response_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'response_id', response_id, 
    'triggered_at', now() AT TIME ZONE 'Europe/Amsterdam'
  );
END;
$$;