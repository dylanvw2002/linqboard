-- Create task checklist items table
CREATE TABLE public.task_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (same pattern as task_assignees)
CREATE POLICY "Members can view checklist items"
ON public.task_checklist_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = task_checklist_items.task_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Members can insert checklist items"
ON public.task_checklist_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = task_checklist_items.task_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Members can update checklist items"
ON public.task_checklist_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = task_checklist_items.task_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete checklist items"
ON public.task_checklist_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = task_checklist_items.task_id AND m.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_task_checklist_items_task_id ON public.task_checklist_items(task_id);
CREATE INDEX idx_task_checklist_items_position ON public.task_checklist_items(task_id, position);