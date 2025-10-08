-- Create audit log table for invoice access
CREATE TABLE public.invoice_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  accessed_at timestamp with time zone DEFAULT now() NOT NULL,
  action text NOT NULL DEFAULT 'view',
  ip_address text,
  user_agent text
);

-- Enable RLS on audit log
ALTER TABLE public.invoice_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (same admin check as other tables)
CREATE POLICY "Admins can view audit logs"
ON public.invoice_access_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND user_id = '4a0b93e5-c165-4fdf-ae6d-b9bb9558aef9'::uuid
  )
);

-- Create indexes for performance
CREATE INDEX idx_invoice_access_log_user_id ON public.invoice_access_log(user_id);
CREATE INDEX idx_invoice_access_log_accessed_at ON public.invoice_access_log(accessed_at);
CREATE INDEX idx_invoice_access_log_invoice_id ON public.invoice_access_log(invoice_id);

-- Create rate limiting table
CREATE TABLE public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  operation text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on rate limit log
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Users can insert their own rate limit logs
CREATE POLICY "Users can insert rate limit logs"
ON public.rate_limit_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_rate_limit_log_user_operation ON public.rate_limit_log(user_id, operation, created_at);

-- Function to check if user is within rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _operation text,
  _max_requests integer,
  _time_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count integer;
BEGIN
  -- Count requests in the time window
  SELECT COUNT(*)
  INTO request_count
  FROM public.rate_limit_log
  WHERE user_id = _user_id
    AND operation = _operation
    AND created_at > now() - ((_time_window_seconds || ' seconds')::interval);
  
  -- Return true if under limit, false if over
  RETURN request_count < _max_requests;
END;
$$;

-- Function to log a rate-limited request
CREATE OR REPLACE FUNCTION public.log_rate_limit_request(
  _operation text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the request log
  INSERT INTO public.rate_limit_log (user_id, operation)
  VALUES (auth.uid(), _operation);
  
  -- Clean up old entries (older than 1 hour) to prevent table bloat
  DELETE FROM public.rate_limit_log
  WHERE created_at < now() - interval '1 hour';
END;
$$;

-- Function to log invoice access for audit trail
CREATE OR REPLACE FUNCTION public.log_invoice_access(
  _invoice_id uuid,
  _action text DEFAULT 'view'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.invoice_access_log (user_id, invoice_id, action)
  VALUES (auth.uid(), _invoice_id, _action);
END;
$$;