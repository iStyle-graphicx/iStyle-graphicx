-- Fix OTP table structure
ALTER TABLE otp_codes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_phone_verified ON otp_codes(phone_number, verified);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_created_at ON otp_codes(created_at);

-- Add constraint to prevent duplicate active OTPs
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_otp 
ON otp_codes (phone_number) 
WHERE verified = false AND expires_at > NOW();

-- Add function to auto-clean expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM otp_codes 
  WHERE expires_at < NOW() - INTERVAL '1 day'
  AND verified = true;
  
  DELETE FROM otp_codes 
  WHERE expires_at < NOW() - INTERVAL '10 minutes'
  AND verified = false;
END;
$$;

-- Create cron job to run cleanup every hour
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('cleanup-otps', '0 * * * *', 'SELECT cleanup_expired_otps();');