-- Create a security definer function to get member emails for an organization
CREATE OR REPLACE FUNCTION public.get_org_member_emails(_org_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.avatar_url,
    au.email
  FROM public.profiles p
  JOIN auth.users au ON p.user_id = au.id
  JOIN public.memberships m ON p.user_id = m.user_id
  WHERE m.organization_id = _org_id
    AND EXISTS (
      SELECT 1 
      FROM public.memberships user_membership
      WHERE user_membership.organization_id = _org_id
      AND user_membership.user_id = auth.uid()
    )
$$;