-- Create task_attachments table
CREATE TABLE public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_attachments
CREATE POLICY "Members can view attachments of their tasks"
ON public.task_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = task_attachments.task_id
      AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Members can upload attachments to their tasks"
ON public.task_attachments
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = task_attachments.task_id
      AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete their own attachments"
ON public.task_attachments
FOR DELETE
USING (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = task_attachments.task_id
      AND m.user_id = auth.uid()
  )
);

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  false,
  10485760, -- 10 MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/gif']
);

-- Create storage policies
CREATE POLICY "Members can view attachments of their organization"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'task-attachments' AND
  EXISTS (
    SELECT 1
    FROM task_attachments ta
    JOIN tasks t ON ta.task_id = t.id
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE ta.file_path = storage.objects.name
      AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Members can upload attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'task-attachments' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Members can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'task-attachments' AND
  EXISTS (
    SELECT 1
    FROM task_attachments ta
    WHERE ta.file_path = storage.objects.name
      AND ta.uploaded_by = auth.uid()
  )
);

-- Enable realtime for task_attachments
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_attachments;