
-- Table for tracking absence records (sick leave and vacation)
CREATE TABLE public.absence_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  user_id UUID NULL, -- nullable: for manually added people not in org
  absence_type TEXT NOT NULL CHECK (absence_type IN ('sick_leave', 'vacation')),
  start_date DATE NOT NULL,
  end_date DATE NULL,
  notes TEXT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.absence_records ENABLE ROW LEVEL SECURITY;

-- Policies: org members can CRUD
CREATE POLICY "Members can view absence records" ON public.absence_records
  FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can insert absence records" ON public.absence_records
  FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Members can update absence records" ON public.absence_records
  FOR UPDATE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can delete absence records" ON public.absence_records
  FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
