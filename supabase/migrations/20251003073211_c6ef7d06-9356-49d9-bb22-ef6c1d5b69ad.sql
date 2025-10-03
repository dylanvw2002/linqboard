-- Add DELETE policy for organizations (only owners can delete)
CREATE POLICY "Owners can delete their organizations"
ON public.organizations
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE memberships.organization_id = organizations.id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'owner'
  )
);

-- Ensure CASCADE deletes for all related data
ALTER TABLE public.memberships
DROP CONSTRAINT IF EXISTS memberships_organization_id_fkey,
ADD CONSTRAINT memberships_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE CASCADE;

ALTER TABLE public.boards
DROP CONSTRAINT IF EXISTS boards_organization_id_fkey,
ADD CONSTRAINT boards_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE CASCADE;

ALTER TABLE public.activity_log
DROP CONSTRAINT IF EXISTS activity_log_organization_id_fkey,
ADD CONSTRAINT activity_log_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE CASCADE;