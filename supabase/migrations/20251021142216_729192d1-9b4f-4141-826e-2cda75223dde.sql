-- Normalize content_padding_top for consistent spacing between header and first task
UPDATE public.columns 
SET content_padding_top = 0 
WHERE content_padding_top IS NULL OR content_padding_top != 0;