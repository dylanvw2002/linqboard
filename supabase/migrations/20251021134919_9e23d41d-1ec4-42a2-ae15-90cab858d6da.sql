-- Add is_private column to widget_chat_messages
ALTER TABLE public.widget_chat_messages 
ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance
CREATE INDEX idx_widget_chat_messages_widget_private 
ON public.widget_chat_messages(widget_id, is_private, created_at);

-- Enable RLS
ALTER TABLE public.widget_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy for general chat: anyone in the organization can see general messages
CREATE POLICY "Users can view general chat messages"
ON public.widget_chat_messages
FOR SELECT
USING (
  is_private = false
  AND EXISTS (
    SELECT 1
    FROM widgets w
    INNER JOIN boards b ON w.board_id = b.id
    INNER JOIN memberships m ON b.organization_id = m.organization_id
    WHERE w.id = widget_chat_messages.widget_id
      AND m.user_id = auth.uid()
  )
);

-- Policy for private chat: users can only see their own private messages
CREATE POLICY "Users can view their own private messages"
ON public.widget_chat_messages
FOR SELECT
USING (
  is_private = true
  AND user_id = auth.uid()
);

-- Policy for inserting: users can insert messages if they have access to the widget
CREATE POLICY "Users can insert messages in accessible widgets"
ON public.widget_chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM widgets w
    INNER JOIN boards b ON w.board_id = b.id
    INNER JOIN memberships m ON b.organization_id = m.organization_id
    WHERE w.id = widget_chat_messages.widget_id
      AND m.user_id = auth.uid()
  )
);

-- Policy for deleting: users can only delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.widget_chat_messages
FOR DELETE
USING (user_id = auth.uid());