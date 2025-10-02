-- Add due_date column to tasks table for deadline functionality
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date timestamptz;