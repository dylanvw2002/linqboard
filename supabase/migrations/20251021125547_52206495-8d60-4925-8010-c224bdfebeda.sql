-- Enable REPLICA IDENTITY FULL for tasks table to support realtime DELETE events
ALTER TABLE public.tasks REPLICA IDENTITY FULL;