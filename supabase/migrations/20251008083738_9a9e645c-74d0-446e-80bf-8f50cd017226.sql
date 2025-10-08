-- Add E-boekhouden.nl sync columns to user_subscriptions
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS eboekhouden_relation_code text,
ADD COLUMN IF NOT EXISTS eboekhouden_last_sync timestamp with time zone,
ADD COLUMN IF NOT EXISTS company_name text;

-- Create sync log table for tracking E-boekhouden.nl synchronization
CREATE TABLE IF NOT EXISTS eboekhouden_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sync_type text NOT NULL CHECK (sync_type IN ('invoice', 'customer')),
  status text NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message text,
  eboekhouden_response jsonb,
  synced_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE eboekhouden_sync_log ENABLE ROW LEVEL SECURITY;

-- Admin can view all sync logs
CREATE POLICY "Admins can view all sync logs"
ON eboekhouden_sync_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.user_id = '4a0b93e5-c165-4fdf-ae6d-b9bb9558aef9'::uuid
  )
);

-- Users can view their own sync logs
CREATE POLICY "Users can view own sync logs"
ON eboekhouden_sync_log
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sync_log_invoice ON eboekhouden_sync_log(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON eboekhouden_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_eboekhouden ON user_subscriptions(eboekhouden_relation_code);