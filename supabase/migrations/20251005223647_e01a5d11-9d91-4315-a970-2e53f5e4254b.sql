-- Add header and content padding columns to columns table
ALTER TABLE public.columns 
ADD COLUMN IF NOT EXISTS header_height INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS content_padding_top INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_padding_right INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_padding_bottom INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_padding_left INTEGER DEFAULT 0;