-- Add storage policies for task attachments
CREATE POLICY "Members can view task attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-attachments' 
  AND (
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
  )
);

CREATE POLICY "Members can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-attachments'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Members can delete their task attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'task-attachments'
  AND (
    EXISTS (
      SELECT 1 
      FROM task_attachments ta
      WHERE ta.file_path = storage.objects.name
      AND ta.uploaded_by = auth.uid()
    )
  )
);