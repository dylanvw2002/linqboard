-- Create security definer function to check if two users share an organization
CREATE OR REPLACE FUNCTION public.users_share_organization(_user_id1 uuid, _user_id2 uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m1
    JOIN public.memberships m2 ON m1.organization_id = m2.organization_id
    WHERE m1.user_id = _user_id1
      AND m2.user_id = _user_id2
  )
$$;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create new restricted policies for viewing profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view profiles of people in their organizations
CREATE POLICY "Users can view organization members profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND public.users_share_organization(auth.uid(), user_id)
);