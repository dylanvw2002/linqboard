-- Add phone_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.phone_number IS 'User phone number for SMS notifications (E.164 format recommended)';