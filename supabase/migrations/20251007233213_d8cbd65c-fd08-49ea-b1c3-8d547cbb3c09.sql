-- Update the trigger function to give everyone except d.vanwoensel@nrgtotaal.nl a free subscription
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  
  -- Give everyone a free subscription, except d.vanwoensel@nrgtotaal.nl
  IF user_email = 'd.vanwoensel@nrgtotaal.nl' THEN
    -- Skip creating subscription for this specific email
    RETURN NEW;
  ELSE
    -- Create free subscription for everyone else
    INSERT INTO user_subscriptions (user_id, plan, max_organizations, max_members_per_org, status)
    VALUES (NEW.user_id, 'free', 1, 2, 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update existing users without subscriptions to have free plan (except d.vanwoensel@nrgtotaal.nl)
INSERT INTO user_subscriptions (user_id, plan, max_organizations, max_members_per_org, status)
SELECT p.user_id, 'free', 1, 2, 'active'
FROM profiles p
LEFT JOIN user_subscriptions us ON p.user_id = us.user_id
LEFT JOIN auth.users au ON p.user_id = au.id
WHERE us.user_id IS NULL 
  AND au.email != 'd.vanwoensel@nrgtotaal.nl'
ON CONFLICT (user_id) DO NOTHING;