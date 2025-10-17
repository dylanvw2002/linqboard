-- Create task_history table for audit logging
CREATE TABLE public.task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- Create policy: Members can view history of tasks in their organization
CREATE POLICY "Members can view task history"
ON public.task_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN boards b ON c.board_id = b.id
    JOIN memberships m ON b.organization_id = m.organization_id
    WHERE t.id = task_history.task_id
      AND m.user_id = auth.uid()
  )
);

-- Create function to log task changes
CREATE OR REPLACE FUNCTION public.log_task_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  change_data JSONB;
  action_type TEXT;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    change_data := jsonb_build_object(
      'title', NEW.title,
      'description', NEW.description,
      'priority', NEW.priority,
      'due_date', NEW.due_date,
      'column_id', NEW.column_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Detect what changed
    IF OLD.column_id IS DISTINCT FROM NEW.column_id THEN
      action_type := 'moved';
      change_data := jsonb_build_object(
        'from_column_id', OLD.column_id,
        'to_column_id', NEW.column_id
      );
    ELSIF OLD.title IS DISTINCT FROM NEW.title OR 
          OLD.description IS DISTINCT FROM NEW.description OR
          OLD.priority IS DISTINCT FROM NEW.priority OR
          OLD.due_date IS DISTINCT FROM NEW.due_date THEN
      action_type := 'updated';
      change_data := jsonb_build_object(
        'old', jsonb_build_object(
          'title', OLD.title,
          'description', OLD.description,
          'priority', OLD.priority,
          'due_date', OLD.due_date
        ),
        'new', jsonb_build_object(
          'title', NEW.title,
          'description', NEW.description,
          'priority', NEW.priority,
          'due_date', NEW.due_date
        )
      );
    ELSE
      -- Position or other minor changes - don't log
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
    change_data := jsonb_build_object(
      'title', OLD.title,
      'column_id', OLD.column_id
    );
  END IF;

  -- Insert history record
  INSERT INTO public.task_history (task_id, user_id, action, changes)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    action_type,
    change_data
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for task changes
CREATE TRIGGER task_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.log_task_change();

-- Create function to log assignee changes
CREATE OR REPLACE FUNCTION public.log_assignee_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type TEXT;
  change_data JSONB;
  assignee_name TEXT;
BEGIN
  -- Get assignee name
  SELECT full_name INTO assignee_name
  FROM profiles
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  IF TG_OP = 'INSERT' THEN
    action_type := 'assignee_added';
    change_data := jsonb_build_object(
      'user_id', NEW.user_id,
      'user_name', assignee_name
    );
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'assignee_removed';
    change_data := jsonb_build_object(
      'user_id', OLD.user_id,
      'user_name', assignee_name
    );
  END IF;

  -- Insert history record
  INSERT INTO public.task_history (task_id, user_id, action, changes)
  VALUES (
    COALESCE(NEW.task_id, OLD.task_id),
    auth.uid(),
    action_type,
    change_data
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for assignee changes
CREATE TRIGGER task_assignee_change_trigger
AFTER INSERT OR DELETE ON public.task_assignees
FOR EACH ROW
EXECUTE FUNCTION public.log_assignee_change();

-- Add task_history to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE task_history;