-- Add width_ratio column to columns table
ALTER TABLE public.columns 
ADD COLUMN width_ratio integer NOT NULL DEFAULT 1;

-- Add constraint to ensure width_ratio is between 1 and 4
ALTER TABLE public.columns
ADD CONSTRAINT width_ratio_range CHECK (width_ratio >= 1 AND width_ratio <= 4);

-- Update existing columns with default width_ratio
UPDATE public.columns
SET width_ratio = 1
WHERE width_ratio IS NULL;