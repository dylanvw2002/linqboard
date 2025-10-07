-- Add background settings to boards table
ALTER TABLE public.boards 
ADD COLUMN IF NOT EXISTS background_gradient TEXT DEFAULT 'from-blue-50 to-blue-100';