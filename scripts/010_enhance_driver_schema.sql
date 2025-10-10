-- Add additional fields to drivers table for comprehensive driver information
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS vehicle_make TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS vehicle_model TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS vehicle_year INTEGER;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS vehicle_color TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS vehicle_capacity TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS license_expiry_date DATE;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS pdp_number TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS pdp_expiry_date DATE;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS bank_branch_code TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'documents_submitted', 'under_review', 'approved', 'rejected'));
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Create index for verification status queries
CREATE INDEX IF NOT EXISTS idx_drivers_verification_status ON public.drivers(verification_status);

-- Create index for expiry date queries (for automated reminders)
CREATE INDEX IF NOT EXISTS idx_drivers_insurance_expiry ON public.drivers(insurance_expiry_date);
CREATE INDEX IF NOT EXISTS idx_drivers_license_expiry ON public.drivers(license_expiry_date);
CREATE INDEX IF NOT EXISTS idx_drivers_pdp_expiry ON public.drivers(pdp_expiry_date);
