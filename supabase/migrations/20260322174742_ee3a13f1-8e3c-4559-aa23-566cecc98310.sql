
-- 1. Recurring tasks: add columns to tasks table
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS recurrence_pattern text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recurrence_interval integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS recurrence_end_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_recurring_template boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurring_parent_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL DEFAULT NULL;

-- 2. Time tracking table
CREATE TABLE public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  start_time timestamp with time zone NOT NULL DEFAULT now(),
  end_time timestamp with time zone DEFAULT NULL,
  duration_minutes integer DEFAULT NULL,
  description text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view time entries" ON public.time_entries
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = time_entries.task_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Members can insert time entries" ON public.time_entries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = time_entries.task_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Members can update their own time entries" ON public.time_entries
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Members can delete their own time entries" ON public.time_entries
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. Task dependencies table
CREATE TABLE public.task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dependency_type text NOT NULL DEFAULT 'blocks',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view task dependencies" ON public.task_dependencies
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = task_dependencies.task_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Members can insert task dependencies" ON public.task_dependencies
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = task_dependencies.task_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Members can delete task dependencies" ON public.task_dependencies
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = task_dependencies.task_id AND m.user_id = auth.uid()
  ));
