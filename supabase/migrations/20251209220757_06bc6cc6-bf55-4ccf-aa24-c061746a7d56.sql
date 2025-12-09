-- First drop all policies that depend on widget_id
DROP POLICY IF EXISTS "Users can view general chat messages" ON widget_chat_messages;
DROP POLICY IF EXISTS "Users can view chat messages based on mode" ON widget_chat_messages;
DROP POLICY IF EXISTS "Users can create chat messages for accessible widgets" ON widget_chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in accessible widgets" ON widget_chat_messages;
DROP POLICY IF EXISTS "Users can delete their own chat messages" ON widget_chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON widget_chat_messages;

-- Drop foreign key constraint
ALTER TABLE widget_chat_messages DROP CONSTRAINT IF EXISTS widget_chat_messages_widget_id_fkey;

-- Change widget_id from uuid to text
ALTER TABLE widget_chat_messages ALTER COLUMN widget_id TYPE text USING widget_id::text;

-- Recreate policies with support for both widget UUIDs and "fixed-{boardId}" format

-- Policy for viewing private messages (user's own messages)
CREATE POLICY "Users can view their private messages"
  ON widget_chat_messages FOR SELECT
  USING (is_private = true AND user_id = auth.uid());

-- Policy for viewing general (non-private) messages via widget
CREATE POLICY "Users can view general widget messages"
  ON widget_chat_messages FOR SELECT
  USING (
    is_private = false AND (
      -- For regular widget messages (UUID format)
      (widget_id !~ '^fixed-' AND EXISTS (
        SELECT 1 FROM widgets w
        JOIN boards b ON w.board_id = b.id
        JOIN memberships m ON b.organization_id = m.organization_id
        WHERE w.id::text = widget_chat_messages.widget_id AND m.user_id = auth.uid()
      ))
      OR
      -- For fixed chat messages (fixed-{boardId} format)
      (widget_id ~ '^fixed-' AND EXISTS (
        SELECT 1 FROM boards b
        JOIN memberships m ON b.organization_id = m.organization_id
        WHERE b.id::text = substring(widget_chat_messages.widget_id from 7) AND m.user_id = auth.uid()
      ))
    )
  );

-- Policy for inserting messages
CREATE POLICY "Users can insert chat messages"
  ON widget_chat_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND (
      -- For regular widget messages
      (widget_id !~ '^fixed-' AND EXISTS (
        SELECT 1 FROM widgets w
        JOIN boards b ON w.board_id = b.id
        JOIN memberships m ON b.organization_id = m.organization_id
        WHERE w.id::text = widget_chat_messages.widget_id AND m.user_id = auth.uid()
      ))
      OR
      -- For fixed chat messages
      (widget_id ~ '^fixed-' AND EXISTS (
        SELECT 1 FROM boards b
        JOIN memberships m ON b.organization_id = m.organization_id
        WHERE b.id::text = substring(widget_chat_messages.widget_id from 7) AND m.user_id = auth.uid()
      ))
    )
  );

-- Policy for deleting own messages
CREATE POLICY "Users can delete their own messages"
  ON widget_chat_messages FOR DELETE
  USING (user_id = auth.uid());