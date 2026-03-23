-- Add INSERT policy for task_history so client can log exports
CREATE POLICY "Members can insert task history"
ON public.task_history
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = task_history.task_id AND m.user_id = auth.uid()
  )
);

-- Add notes column to tasks
ALTER TABLE public.tasks ADD COLUMN notes text;