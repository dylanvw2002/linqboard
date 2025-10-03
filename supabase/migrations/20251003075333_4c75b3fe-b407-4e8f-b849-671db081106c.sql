-- Set replica identity to full to get complete row data in realtime updates
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.columns REPLICA IDENTITY FULL;