-- Add RLS policy to allow owners to delete members from their organizations
CREATE POLICY "Owners can delete members from their organizations"
ON public.memberships
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.memberships owner_membership
    WHERE owner_membership.organization_id = memberships.organization_id
      AND owner_membership.user_id = auth.uid()
      AND owner_membership.role = 'owner'
  )
  -- Prevent owners from deleting themselves
  AND memberships.user_id != auth.uid()
);