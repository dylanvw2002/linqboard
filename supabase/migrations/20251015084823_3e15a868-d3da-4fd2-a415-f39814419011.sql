-- Drop the existing function
DROP FUNCTION IF EXISTS get_org_member_emails(uuid);

-- Recreate with correct email type
CREATE OR REPLACE FUNCTION get_org_member_emails(_org_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  email character varying(255)
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
    u.email
  FROM profiles p
  INNER JOIN memberships m ON p.user_id = m.user_id
  INNER JOIN auth.users u ON p.user_id = u.id
  WHERE m.organization_id = _org_id;
END;
$$;