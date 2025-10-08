-- Add VAT/country fields to user_subscriptions
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS customer_type TEXT CHECK (customer_type IN ('private', 'business')),
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS vat_number_valid BOOLEAN,
ADD COLUMN IF NOT EXISTS price_excl_vat DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_incl_vat DECIMAL(10,2);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Customer details
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_country TEXT NOT NULL,
  customer_type TEXT NOT NULL,
  vat_number TEXT,
  
  -- Amounts
  amount_excl_vat DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL,
  vat_amount DECIMAL(10,2) NOT NULL,
  amount_incl_vat DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'paid',
  payment_id TEXT,
  
  -- Invoice file
  pdf_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create EU sales summary table
CREATE TABLE IF NOT EXISTS eu_sales_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  
  total_sales_excl_vat DECIMAL(12,2) DEFAULT 0,
  total_vat_collected DECIMAL(12,2) DEFAULT 0,
  vat_rate DECIMAL(5,2),
  transaction_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(country, year, quarter)
);

-- Create Mollie transactions table for audit trail
CREATE TABLE IF NOT EXISTS mollie_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE NOT NULL,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  
  status TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  
  country TEXT,
  customer_type TEXT,
  vat_number TEXT,
  vat_rate DECIMAL(5,2),
  vat_amount DECIMAL(10,2),
  
  mollie_response JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE eu_sales_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE mollie_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for eu_sales_summary (admin only - we'll handle this separately)
CREATE POLICY "Admins can view EU sales summary"
  ON eu_sales_summary FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.user_id = '4a0b93e5-c165-4fdf-ae6d-b9bb9558aef9'::uuid
    )
  );

-- RLS Policies for mollie_transactions
CREATE POLICY "Users can view their own transactions"
  ON mollie_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(invoice_number FROM '\d+$') AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || current_year || '-%';
  
  invoice_num := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 5, '0');
  
  RETURN invoice_num;
END;
$$;

-- Create trigger for updated_at on invoices
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on eu_sales_summary
CREATE TRIGGER update_eu_sales_summary_updated_at
  BEFORE UPDATE ON eu_sales_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on mollie_transactions
CREATE TRIGGER update_mollie_transactions_updated_at
  BEFORE UPDATE ON mollie_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();