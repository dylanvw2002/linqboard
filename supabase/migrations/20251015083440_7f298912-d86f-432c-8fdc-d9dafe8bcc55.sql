-- Create function to get organization members with their email addresses
CREATE OR REPLACE FUNCTION get_org_member_emails(_org_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.avatar_url,
    au.email
  FROM profiles p
  INNER JOIN memberships m ON p.user_id = m.user_id
  INNER JOIN auth.users au ON p.user_id = au.id
  WHERE m.organization_id = _org_id
  ORDER BY p.full_name;
END;
$$;