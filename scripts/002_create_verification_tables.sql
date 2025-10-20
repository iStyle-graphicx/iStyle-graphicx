-- Create user_verifications table for tracking verification status
CREATE TABLE IF NOT EXISTS public.user_verifications (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  payment_verified BOOLEAN DEFAULT FALSE,
  driver_license_verified BOOLEAN DEFAULT FALSE,
  vehicle_verified BOOLEAN DEFAULT FALSE,
  background_check_verified BOOLEAN DEFAULT FALSE,
  background_check_status TEXT DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'in_progress', 'completed', 'failed')),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'documents_submitted', 'under_review', 'approved', 'rejected')),
  verification_documents JSONB DEFAULT '{}'::jsonb,
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to drivers table
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS vehicle_make TEXT,
ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
ADD COLUMN IF NOT EXISTS vehicle_year INTEGER,
ADD COLUMN IF NOT EXISTS vehicle_color TEXT,
ADD COLUMN IF NOT EXISTS vehicle_capacity TEXT,
ADD COLUMN IF NOT EXISTS license_expiry_date DATE,
ADD COLUMN IF NOT EXISTS pdp_number TEXT,
ADD COLUMN IF NOT EXISTS pdp_expiry_date DATE,
ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT,
ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
ADD COLUMN IF NOT EXISTS bank_branch_code TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'documents_submitted', 'under_review', 'approved', 'rejected'));

-- Enable RLS on user_verifications
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_verifications
DROP POLICY IF EXISTS "user_verifications_select_own" ON public.user_verifications;
CREATE POLICY "user_verifications_select_own" ON public.user_verifications 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_verifications_insert_own" ON public.user_verifications;
CREATE POLICY "user_verifications_insert_own" ON public.user_verifications 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_verifications_update_own" ON public.user_verifications;
CREATE POLICY "user_verifications_update_own" ON public.user_verifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_drivers_verification_status ON public.drivers(verification_status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);

-- Create function to automatically create verification record for new drivers
CREATE OR REPLACE FUNCTION public.handle_new_driver_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_verifications (user_id, verification_status)
  VALUES (NEW.id, 'pending')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger for new driver verification
DROP TRIGGER IF EXISTS on_driver_created ON public.drivers;
CREATE TRIGGER on_driver_created
  AFTER INSERT ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_driver_verification();
