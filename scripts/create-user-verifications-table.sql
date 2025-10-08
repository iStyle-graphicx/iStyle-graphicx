-- Create user_verifications table for tracking verification status
CREATE TABLE IF NOT EXISTS public.user_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    identity_verified BOOLEAN DEFAULT FALSE,
    payment_verified BOOLEAN DEFAULT FALSE,
    driver_license_verified BOOLEAN DEFAULT FALSE,
    vehicle_verified BOOLEAN DEFAULT FALSE,
    background_check_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON public.user_verifications(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own verification status" ON public.user_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification status" ON public.user_verifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification record" ON public.user_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);
