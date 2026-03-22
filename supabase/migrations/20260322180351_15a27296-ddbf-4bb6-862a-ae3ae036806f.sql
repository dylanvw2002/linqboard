
-- Create archived_tasks table to store deleted/completed tasks
CREATE TABLE public.archived_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_task_id uuid NOT NULL,
  board_id uuid NOT NULL,
  column_name text NOT NULL,
  title text NOT NULL,
  description text,
  priority text,
  due_date timestamptz,
  assignee_names text[],
  labels text[],
  time_logged_minutes integer DEFAULT 0,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archived_by uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.archived_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies - org members can view/delete archived tasks
CREATE POLICY "Members can view archived tasks"
  ON public.archived_tasks FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can insert archived tasks"
  ON public.archived_tasks FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND archived_by = auth.uid());

CREATE POLICY "Members can delete archived tasks"
  ON public.archived_tasks FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
