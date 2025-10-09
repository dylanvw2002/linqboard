-- Add background position and crop fields to boards table
ALTER TABLE public.boards 
ADD COLUMN IF NOT EXISTS background_position_x REAL DEFAULT 50,
ADD COLUMN IF NOT EXISTS background_position_y REAL DEFAULT 50,
ADD COLUMN IF NOT EXISTS background_scale REAL DEFAULT 100;