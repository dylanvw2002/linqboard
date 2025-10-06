-- Add header_width column to columns table
ALTER TABLE public.columns 
ADD COLUMN header_width integer DEFAULT NULL;

COMMENT ON COLUMN public.columns.header_width IS 'Width of the column header in pixels. NULL means full width.';