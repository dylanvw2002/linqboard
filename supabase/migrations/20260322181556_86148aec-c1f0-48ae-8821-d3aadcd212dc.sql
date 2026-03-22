
-- Create direct_messages table for team chat
CREATE TABLE public.direct_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their own DMs"
  ON public.direct_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can insert messages where they are the sender
CREATE POLICY "Users can send DMs"
  ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND is_org_member(auth.uid(), organization_id));

-- Users can update messages they received (for read status)
CREATE POLICY "Users can mark DMs as read"
  ON public.direct_messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id);

-- Users can delete their own sent messages
CREATE POLICY "Users can delete their sent DMs"
  ON public.direct_messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Create function to notify org members when a task is moved
CREATE OR REPLACE FUNCTION public.notify_task_move()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_col_name text;
  new_col_name text;
  task_title text;
  board_org_id uuid;
  member_record record;
BEGIN
  -- Only fire on column changes
  IF OLD.column_id IS NOT DISTINCT FROM NEW.column_id THEN
    RETURN NEW;
  END IF;

  -- Get column names and org id
  SELECT c.name INTO old_col_name FROM columns c WHERE c.id = OLD.column_id;
  SELECT c.name, b.organization_id INTO new_col_name, board_org_id
    FROM columns c JOIN boards b ON c.board_id = b.id WHERE c.id = NEW.column_id;

  task_title := NEW.title;

  -- Create notification for all org members except the one who moved it
  FOR member_record IN
    SELECT user_id FROM memberships WHERE organization_id = board_org_id AND user_id != auth.uid()
  LOOP
    INSERT INTO user_notifications (user_id, task_id, title, message)
    VALUES (
      member_record.user_id,
      NEW.id,
      'Taak verplaatst',
      '"' || task_title || '" is verplaatst van ' || old_col_name || ' naar ' || new_col_name
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for task moves
CREATE TRIGGER on_task_move_notify
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_move();
