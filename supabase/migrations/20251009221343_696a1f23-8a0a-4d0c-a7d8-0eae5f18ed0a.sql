-- Add background fit mode to boards table
ALTER TABLE public.boards 
ADD COLUMN IF NOT EXISTS background_fit_mode text DEFAULT 'scale' CHECK (background_fit_mode IN ('scale', 'cover'));