-- Add pdf_url and email_sent columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS pdf_url text,
ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_sent_at timestamp with time zone;

-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for invoices bucket
CREATE POLICY "Users can view their own invoice PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role can upload invoice PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoices');