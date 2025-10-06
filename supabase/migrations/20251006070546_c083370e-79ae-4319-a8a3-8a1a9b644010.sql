-- Create enum for column types
CREATE TYPE public.column_type AS ENUM ('regular', 'sick_leave', 'vacation');

-- Add column_type to columns table
ALTER TABLE public.columns 
ADD COLUMN column_type public.column_type NOT NULL DEFAULT 'regular';