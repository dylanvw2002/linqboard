-- Update the get_user_subscription_limits function to exclude demo organization
CREATE OR REPLACE FUNCTION public.get_user_subscription_limits(_user_id uuid)
 RETURNS TABLE(plan subscription_plan, max_organizations integer, max_members_per_org integer, current_org_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    COALESCE(us.plan, 'free'::subscription_plan) as plan,
    COALESCE(us.max_organizations, 1) as max_organizations,
    COALESCE(us.max_members_per_org, 2) as max_members_per_org,
    COUNT(DISTINCT CASE 
      WHEN m.organization_id != '00000000-0000-0000-0000-000000000000' 
      THEN m.organization_id 
      ELSE NULL 
    END) as current_org_count
  FROM profiles p
  LEFT JOIN user_subscriptions us ON us.user_id = p.user_id
  LEFT JOIN memberships m ON m.user_id = p.user_id
  WHERE p.user_id = _user_id
  GROUP BY us.plan, us.max_organizations, us.max_members_per_org
$function$;