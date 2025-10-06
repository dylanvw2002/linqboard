-- Create enum for column glow types
CREATE TYPE public.column_glow_type AS ENUM ('default', 'red', 'green', 'blue', 'yellow', 'purple', 'orange');

-- Add glow_type column to columns table
ALTER TABLE public.columns 
ADD COLUMN glow_type public.column_glow_type NOT NULL DEFAULT 'default';