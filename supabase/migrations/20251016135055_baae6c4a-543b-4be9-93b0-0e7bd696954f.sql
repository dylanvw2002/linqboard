-- Create widgets table
CREATE TABLE IF NOT EXISTS public.widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('chat', 'notes', 'calculator', 'timer')),
  x_position INTEGER NOT NULL DEFAULT 100,
  y_position INTEGER NOT NULL DEFAULT 100,
  width INTEGER NOT NULL DEFAULT 400,
  height INTEGER NOT NULL DEFAULT 500,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view widgets for their org's boards"
ON public.widgets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    JOIN public.organizations o ON b.organization_id = o.id
    JOIN public.memberships m ON o.id = m.organization_id
    WHERE b.id = widgets.board_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create widgets for their org's boards"
ON public.widgets FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards b
    JOIN public.organizations o ON b.organization_id = o.id
    JOIN public.memberships m ON o.id = m.organization_id
    WHERE b.id = widgets.board_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update widgets for their org's boards"
ON public.widgets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    JOIN public.organizations o ON b.organization_id = o.id
    JOIN public.memberships m ON o.id = m.organization_id
    WHERE b.id = widgets.board_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete widgets for their org's boards"
ON public.widgets FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    JOIN public.organizations o ON b.organization_id = o.id
    JOIN public.memberships m ON o.id = m.organization_id
    WHERE b.id = widgets.board_id
    AND m.user_id = auth.uid()
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_widgets_updated_at
  BEFORE UPDATE ON public.widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create chat messages table for the chat widget
CREATE TABLE IF NOT EXISTS public.widget_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES public.widgets(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.widget_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat messages
CREATE POLICY "Users can view chat messages for their widgets"
ON public.widget_chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.widgets w
    JOIN public.boards b ON w.board_id = b.id
    JOIN public.organizations o ON b.organization_id = o.id
    JOIN public.memberships m ON o.id = m.organization_id
    WHERE w.id = widget_chat_messages.widget_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create chat messages for their widgets"
ON public.widget_chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.widgets w
    JOIN public.boards b ON w.board_id = b.id
    JOIN public.organizations o ON b.organization_id = o.id
    JOIN public.memberships m ON o.id = m.organization_id
    WHERE w.id = widget_chat_messages.widget_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete chat messages for their widgets"
ON public.widget_chat_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.widgets w
    JOIN public.boards b ON w.board_id = b.id
    JOIN public.organizations o ON b.organization_id = o.id
    JOIN public.memberships m ON o.id = m.organization_id
    WHERE w.id = widget_chat_messages.widget_id
    AND m.user_id = auth.uid()
  )
);