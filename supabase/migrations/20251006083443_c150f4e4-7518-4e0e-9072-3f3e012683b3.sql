-- Add DELETE policy for columns table
CREATE POLICY "Members can delete columns" 
ON public.columns 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM boards b
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE b.id = columns.board_id 
      AND m.user_id = auth.uid()
  )
);