-- Add mode column to widgets table
ALTER TABLE widgets ADD COLUMN mode TEXT DEFAULT 'private' CHECK (mode IN ('general', 'private'));

-- Add user_id to widget_chat_messages to track who sent the message
ALTER TABLE widget_chat_messages ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update RLS policies for widget_chat_messages
DROP POLICY IF EXISTS "Users can view chat messages for their widgets" ON widget_chat_messages;
DROP POLICY IF EXISTS "Users can create chat messages for their widgets" ON widget_chat_messages;
DROP POLICY IF EXISTS "Users can delete chat messages for their widgets" ON widget_chat_messages;

-- New policy: Users can view messages in general mode OR their own messages in private mode
CREATE POLICY "Users can view chat messages based on mode"
ON widget_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM widgets w
    JOIN boards b ON w.board_id = b.id
    JOIN organizations o ON b.organization_id = o.id
    JOIN memberships m ON o.id = m.organization_id
    WHERE w.id = widget_chat_messages.widget_id
      AND m.user_id = auth.uid()
      AND (
        w.mode = 'general' 
        OR (w.mode = 'private' AND widget_chat_messages.user_id = auth.uid())
      )
  )
);

-- Users can create messages if they have access to the widget
CREATE POLICY "Users can create chat messages for accessible widgets"
ON widget_chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM widgets w
    JOIN boards b ON w.board_id = b.id
    JOIN organizations o ON b.organization_id = o.id
    JOIN memberships m ON o.id = m.organization_id
    WHERE w.id = widget_chat_messages.widget_id
      AND m.user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own chat messages"
ON widget_chat_messages
FOR DELETE
USING (user_id = auth.uid());