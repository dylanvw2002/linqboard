-- Add RLS policy to allow owners to update their organizations
CREATE POLICY "Owners can update their organizations"
ON public.organizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE memberships.organization_id = organizations.id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'owner'
  )
);