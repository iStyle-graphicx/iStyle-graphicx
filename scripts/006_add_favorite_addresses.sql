-- Create favorite_addresses table for quick address selection
CREATE TABLE IF NOT EXISTS favorite_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorite_addresses_user_id ON favorite_addresses(user_id);

-- Enable RLS
ALTER TABLE favorite_addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own favorite addresses" ON favorite_addresses;
DROP POLICY IF EXISTS "Users can insert their own favorite addresses" ON favorite_addresses;
DROP POLICY IF EXISTS "Users can update their own favorite addresses" ON favorite_addresses;
DROP POLICY IF EXISTS "Users can delete their own favorite addresses" ON favorite_addresses;

-- Create RLS policies
CREATE POLICY "Users can view their own favorite addresses"
  ON favorite_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite addresses"
  ON favorite_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite addresses"
  ON favorite_addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite addresses"
  ON favorite_addresses FOR DELETE
  USING (auth.uid() = user_id);
