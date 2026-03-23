CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_type text NOT NULL,
  message_id uuid NOT NULL,
  emoji text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (message_type, message_id, emoji, user_id)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions on their DMs"
  ON public.message_reactions FOR SELECT
  TO authenticated
  USING (
    message_type = 'direct_message' AND (
      EXISTS (
        SELECT 1 FROM direct_messages dm
        WHERE dm.id = message_reactions.message_id
        AND (dm.sender_id = auth.uid() OR dm.receiver_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can insert reactions"
  ON public.message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reactions"
  ON public.message_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());