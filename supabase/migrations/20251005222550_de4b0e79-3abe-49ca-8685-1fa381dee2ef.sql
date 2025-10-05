-- Add canvas positioning columns to columns table
ALTER TABLE public.columns 
ADD COLUMN IF NOT EXISTS x_position INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS y_position INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 300,
ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 600;

-- Migrate existing columns to canvas positions
-- Spread them out horizontally with some spacing
UPDATE public.columns
SET 
  x_position = (position * 350) + 50,
  y_position = 50,
  width = CASE 
    WHEN width_ratio = 1 THEN 300
    WHEN width_ratio = 2 THEN 450
    WHEN width_ratio = 3 THEN 600
    ELSE 300
  END,
  height = 600
WHERE x_position = 0 AND y_position = 0;