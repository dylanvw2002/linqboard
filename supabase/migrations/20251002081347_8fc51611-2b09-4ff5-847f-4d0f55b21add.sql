-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'member');

-- Create priority enum for tasks
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Memberships table (links users to organizations)
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Boards table
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Columns table
CREATE TABLE public.columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Task assignees table
CREATE TABLE public.task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);

ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- Task labels table
CREATE TABLE public.task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Activity log table
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is member of organization
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

-- Helper function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID, _board_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.organization_id
  FROM public.boards b
  WHERE b.id = _board_id
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they are members of"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = organizations.id
        AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for memberships
CREATE POLICY "Users can view memberships of their organizations"
  ON public.memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m2
      WHERE m2.organization_id = memberships.organization_id
        AND m2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert memberships"
  ON public.memberships FOR INSERT
  WITH CHECK (true);

-- RLS Policies for boards
CREATE POLICY "Members can view boards of their organizations"
  ON public.boards FOR SELECT
  USING (
    public.is_org_member(auth.uid(), organization_id)
  );

CREATE POLICY "Members can insert boards"
  ON public.boards FOR INSERT
  WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
  );

CREATE POLICY "Members can update boards"
  ON public.boards FOR UPDATE
  USING (
    public.is_org_member(auth.uid(), organization_id)
  );

-- RLS Policies for columns
CREATE POLICY "Members can view columns of their boards"
  ON public.columns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE b.id = columns.board_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert columns"
  ON public.columns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE b.id = board_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update columns"
  ON public.columns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE b.id = columns.board_id
        AND m.user_id = auth.uid()
    )
  );

-- RLS Policies for tasks
CREATE POLICY "Members can view tasks"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.columns c
      JOIN public.boards b ON c.board_id = b.id
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE c.id = tasks.column_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.columns c
      JOIN public.boards b ON c.board_id = b.id
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE c.id = column_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update tasks"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.columns c
      JOIN public.boards b ON c.board_id = b.id
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE c.id = tasks.column_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.columns c
      JOIN public.boards b ON c.board_id = b.id
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE c.id = tasks.column_id
        AND m.user_id = auth.uid()
    )
  );

-- RLS Policies for task_assignees
CREATE POLICY "Members can view task assignees"
  ON public.task_assignees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.columns c ON t.column_id = c.id
      JOIN public.boards b ON c.board_id = b.id
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE t.id = task_assignees.task_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert task assignees"
  ON public.task_assignees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.columns c ON t.column_id = c.id
      JOIN public.boards b ON c.board_id = b.id
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE t.id = task_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete task assignees"
  ON public.task_assignees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.columns c ON t.column_id = c.id
      JOIN public.boards b ON c.board_id = b.id
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE t.id = task_assignees.task_id
        AND m.user_id = auth.uid()
    )
  );

-- RLS Policies for task_labels
CREATE POLICY "Members can view task labels"
  ON public.task_labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.columns c ON t.column_id = c.id
      JOIN public.boards b ON c.board_id = b.id
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE t.id = task_labels.task_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert task labels"
  ON public.task_labels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.columns c ON t.column_id = c.id
      JOIN public.boards b ON c.board_id = b.id
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE t.id = task_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete task labels"
  ON public.task_labels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.columns c ON t.column_id = c.id
      JOIN public.boards b ON c.board_id = b.id
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE t.id = task_labels.task_id
        AND m.user_id = auth.uid()
    )
  );

-- RLS Policies for comments
CREATE POLICY "Members can view comments"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.columns c ON t.column_id = c.id
      JOIN public.boards b ON c.board_id = b.id
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE t.id = comments.task_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.columns c ON t.column_id = c.id
      JOIN public.boards b ON c.board_id = b.id
      JOIN public.memberships m ON b.organization_id = m.organization_id
      WHERE t.id = task_id
        AND m.user_id = auth.uid()
    )
  );

-- RLS Policies for activity_log
CREATE POLICY "Members can view activity logs"
  ON public.activity_log FOR SELECT
  USING (
    public.is_org_member(auth.uid(), organization_id)
  );

CREATE POLICY "Members can insert activity logs"
  ON public.activity_log FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    public.is_org_member(auth.uid(), organization_id)
  );

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tasks
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for profile creation when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nieuwe gebruiker')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Function to generate unique 6-character invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM public.organizations WHERE invite_code = result) INTO code_exists;
    
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Enable realtime for tasks, columns, and presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.columns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_assignees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;