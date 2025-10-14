-- Create user verifications table
CREATE TABLE IF NOT EXISTS public.user_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    identity_verified BOOLEAN DEFAULT FALSE,
    payment_verified BOOLEAN DEFAULT FALSE,
    driver_license_verified BOOLEAN DEFAULT FALSE,
    vehicle_verified BOOLEAN DEFAULT FALSE,
    background_check_verified BOOLEAN DEFAULT FALSE,
    verification_documents JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    marketing_communications BOOLEAN DEFAULT FALSE,
    delivery_updates BOOLEAN DEFAULT TRUE,
    payment_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Removed duplicate payment_methods table creation (already exists in script 001)

-- Create billing history table
CREATE TABLE IF NOT EXISTS public.billing_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZAR',
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    transaction_id VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for user_verifications
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_verifications_select_own" ON public.user_verifications;
CREATE POLICY "user_verifications_select_own" ON public.user_verifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_verifications_insert_own" ON public.user_verifications;
CREATE POLICY "user_verifications_insert_own" ON public.user_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_verifications_update_own" ON public.user_verifications;
CREATE POLICY "user_verifications_update_own" ON public.user_verifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Add RLS policies for notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_preferences_select_own" ON public.notification_preferences;
CREATE POLICY "notification_preferences_select_own" ON public.notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_preferences_insert_own" ON public.notification_preferences;
CREATE POLICY "notification_preferences_insert_own" ON public.notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_preferences_update_own" ON public.notification_preferences;
CREATE POLICY "notification_preferences_update_own" ON public.notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Removed duplicate payment_methods RLS policies (already exist in script 001)

-- Add RLS policies for billing_history
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_history_select_own" ON public.billing_history;
CREATE POLICY "billing_history_select_own" ON public.billing_history
    FOR SELECT USING (auth.uid() = user_id);

-- Add RLS policies for ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ratings_select_all" ON public.ratings;
CREATE POLICY "ratings_select_all" ON public.ratings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "ratings_insert_customer" ON public.ratings;
CREATE POLICY "ratings_insert_customer" ON public.ratings
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "ratings_update_customer" ON public.ratings;
CREATE POLICY "ratings_update_customer" ON public.ratings
    FOR UPDATE USING (auth.uid() = customer_id);
