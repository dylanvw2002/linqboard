-- Add background image support to boards table
ALTER TABLE public.boards 
ADD COLUMN IF NOT EXISTS background_image_url TEXT DEFAULT NULL;

-- Create storage bucket for board backgrounds if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('board-backgrounds', 'board-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for board backgrounds
CREATE POLICY "Anyone can view board backgrounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'board-backgrounds');

CREATE POLICY "Authenticated users can upload board backgrounds"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'board-backgrounds' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own board backgrounds"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'board-backgrounds' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own board backgrounds"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'board-backgrounds' 
  AND auth.uid() IS NOT NULL
);