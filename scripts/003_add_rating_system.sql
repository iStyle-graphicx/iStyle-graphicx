-- Create driver ratings table
CREATE TABLE IF NOT EXISTS driver_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(delivery_id) -- One rating per delivery
);

-- Enable RLS
ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating to prevent errors
DROP POLICY IF EXISTS "Users can view ratings for their deliveries" ON driver_ratings;
DROP POLICY IF EXISTS "Customers can insert ratings for their deliveries" ON driver_ratings;

-- RLS Policies for driver_ratings
CREATE POLICY "Users can view ratings for their deliveries" ON driver_ratings
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    auth.uid() = driver_id OR
    auth.uid() IN (SELECT id FROM drivers WHERE id = driver_id)
  );

CREATE POLICY "Customers can insert ratings for their deliveries" ON driver_ratings
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id AND
    EXISTS (
      SELECT 1 FROM deliveries 
      WHERE id = delivery_id 
      AND customer_id = auth.uid() 
      AND status = 'completed'
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver_id ON driver_ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_delivery_id ON driver_ratings(delivery_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_created_at ON driver_ratings(created_at);

-- Update notifications table to ensure proper RLS
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
