-- Create driver locations table for real-time tracking
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2), -- Direction in degrees (0-360)
  speed DECIMAL(5, 2), -- Speed in km/h
  accuracy DECIMAL(8, 2), -- GPS accuracy in meters
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for driver_locations
CREATE POLICY "Drivers can insert their own location" ON driver_locations
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM drivers WHERE id = driver_id)
  );

CREATE POLICY "Drivers can update their own location" ON driver_locations
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM drivers WHERE id = driver_id)
  );

CREATE POLICY "Users can view driver locations for their deliveries" ON driver_locations
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM drivers WHERE id = driver_id) OR
    auth.uid() IN (
      SELECT customer_id FROM deliveries 
      WHERE driver_id = driver_locations.driver_id 
      AND status IN ('accepted', 'picked_up', 'in_transit')
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_delivery_id ON driver_locations(delivery_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_timestamp ON driver_locations(timestamp);

-- Add a unique constraint to prevent duplicate locations for the same driver at the same time
CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_locations_unique ON driver_locations(driver_id, timestamp);

-- Add estimated_arrival column to deliveries table if it doesn't exist
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS estimated_arrival TIMESTAMP WITH TIME ZONE;

-- Update deliveries table to include more tracking fields
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS distance_km DECIMAL(8, 2);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
