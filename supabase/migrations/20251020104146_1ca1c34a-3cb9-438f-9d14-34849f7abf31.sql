-- Drop existing policies
DROP POLICY IF EXISTS "Users can create chat messages for accessible widgets" ON widget_chat_messages;
DROP POLICY IF EXISTS "Users can view chat messages based on mode" ON widget_chat_messages;

-- Updated INSERT policy: allow users to create their own messages, and allow assistant messages (no user_id)
CREATE POLICY "Users can create chat messages for accessible widgets"
ON widget_chat_messages
FOR INSERT
WITH CHECK (
  -- Allow if user is creating their own message
  (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM widgets w
    JOIN boards b ON w.board_id = b.id
    JOIN organizations o ON b.organization_id = o.id
    JOIN memberships m ON o.id = m.organization_id
    WHERE w.id = widget_chat_messages.widget_id 
    AND m.user_id = auth.uid()
  ))
  OR
  -- Allow assistant messages (no user_id) via service role
  (user_id IS NULL AND role = 'assistant')
);

-- Updated SELECT policy: show messages based on widget mode
CREATE POLICY "Users can view chat messages based on mode"
ON widget_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM widgets w
    JOIN boards b ON w.board_id = b.id
    JOIN organizations o ON b.organization_id = o.id
    JOIN memberships m ON o.id = m.organization_id
    WHERE w.id = widget_chat_messages.widget_id 
    AND m.user_id = auth.uid()
    AND (
      -- General mode: show all messages
      w.mode = 'general'
      OR
      -- Private mode: show only user's own messages and assistant messages
      (w.mode = 'private' AND (widget_chat_messages.user_id = auth.uid() OR widget_chat_messages.user_id IS NULL))
    )
  )
);