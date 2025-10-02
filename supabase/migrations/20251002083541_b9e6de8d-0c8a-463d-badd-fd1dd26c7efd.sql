-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view memberships of their organizations" ON public.memberships;

-- Create a security definer function to check if user has any membership in an organization
CREATE OR REPLACE FUNCTION public.user_can_view_membership(_membership_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m1
    WHERE m1.id = _membership_id
      AND EXISTS (
        SELECT 1
        FROM public.memberships m2
        WHERE m2.organization_id = m1.organization_id
          AND m2.user_id = _user_id
      )
  )
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view memberships of their organizations"
ON public.memberships
FOR SELECT
USING (public.user_can_view_membership(id, auth.uid()));