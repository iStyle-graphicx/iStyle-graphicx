-- WhatsApp OTP System for Registration
-- This script creates the necessary tables and functions for WhatsApp-based registration with OTP

-- Create OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  CONSTRAINT valid_phone CHECK (phone_number ~ '^\+[1-9]\d{1,14}$')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_phone_number ON otp_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_codes(expires_at);

-- Enable RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for OTP codes (server-side only, no direct client access)
CREATE POLICY "Service role can manage OTP codes"
  ON otp_codes
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM otp_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  otp TEXT;
BEGIN
  -- Generate 6-digit OTP
  otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN otp;
END;
$$;

-- Add phone_number to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number TEXT UNIQUE;
    ALTER TABLE profiles ADD CONSTRAINT valid_profile_phone CHECK (phone_number IS NULL OR phone_number ~ '^\+[1-9]\d{1,14}$');
  END IF;
END $$;

-- Create index on phone_number
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);

COMMENT ON TABLE otp_codes IS 'Stores OTP codes for WhatsApp-based registration and verification';
COMMENT ON COLUMN otp_codes.phone_number IS 'Phone number in E.164 format (e.g., +27123456789)';
COMMENT ON COLUMN otp_codes.otp_code IS 'Six-digit OTP code';
COMMENT ON COLUMN otp_codes.expires_at IS 'OTP expiration timestamp (typically 5-10 minutes from creation)';
COMMENT ON COLUMN otp_codes.verified IS 'Whether the OTP has been successfully verified';
COMMENT ON COLUMN otp_codes.attempts IS 'Number of verification attempts';
