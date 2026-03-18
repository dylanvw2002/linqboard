
CREATE TABLE public.person_vacation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  person_name text NOT NULL,
  user_id uuid,
  total_vacation_hours numeric NOT NULL DEFAULT 0,
  work_schedule jsonb NOT NULL DEFAULT '{"mon":0,"tue":0,"wed":0,"thu":0,"fri":0,"sat":0,"sun":0}'::jsonb,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, person_name, year)
);

ALTER TABLE public.person_vacation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view vacation settings"
  ON public.person_vacation_settings FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can insert vacation settings"
  ON public.person_vacation_settings FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can update vacation settings"
  ON public.person_vacation_settings FOR UPDATE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can delete vacation settings"
  ON public.person_vacation_settings FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
