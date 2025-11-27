-- Add mobile_position column to columns table for mobile ordering
ALTER TABLE public.columns 
ADD COLUMN mobile_position integer;

-- Set initial mobile_position to match current position
UPDATE public.columns 
SET mobile_position = position;

-- Add index for better performance
CREATE INDEX idx_columns_mobile_position ON public.columns(mobile_position);