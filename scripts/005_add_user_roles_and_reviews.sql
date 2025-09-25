-- Add user_type column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'customer' CHECK (user_type IN ('customer', 'driver'));

-- Create reviews table for customer ratings and reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for reviews
CREATE POLICY "Users can view reviews for their deliveries" ON reviews
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    auth.uid() = driver_id
  );

CREATE POLICY "Customers can create reviews for their deliveries" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id AND
    EXISTS (
      SELECT 1 FROM deliveries 
      WHERE id = delivery_id 
      AND customer_id = auth.uid() 
      AND status = 'delivered'
    )
  );

CREATE POLICY "Customers can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = customer_id);

-- Add real-time delivery tracking columns to deliveries table
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS current_driver_lat NUMERIC;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS current_driver_lng NUMERIC;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS estimated_arrival TIMESTAMP WITH TIME ZONE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS tracking_updates JSONB DEFAULT '[]';

-- Update notifications table to support real-time notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Create function to update driver location and notify customers
CREATE OR REPLACE FUNCTION update_driver_location(
  p_delivery_id UUID,
  p_lat NUMERIC,
  p_lng NUMERIC
) RETURNS VOID AS $$
BEGIN
  -- Update delivery with current driver location
  UPDATE deliveries 
  SET 
    current_driver_lat = p_lat,
    current_driver_lng = p_lng,
    updated_at = NOW(),
    tracking_updates = tracking_updates || jsonb_build_object(
      'timestamp', NOW(),
      'lat', p_lat,
      'lng', p_lng,
      'type', 'location_update'
    )
  WHERE id = p_delivery_id;
  
  -- Create notification for customer
  INSERT INTO notifications (user_id, title, message, type, delivery_id, priority)
  SELECT 
    customer_id,
    'Driver Location Updated',
    'Your driver is on the way! Track their location in real-time.',
    'delivery_update',
    p_delivery_id,
    'normal'
  FROM deliveries 
  WHERE id = p_delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle delivery status updates with notifications
CREATE OR REPLACE FUNCTION update_delivery_status(
  p_delivery_id UUID,
  p_status TEXT,
  p_driver_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_customer_id UUID;
  v_notification_title TEXT;
  v_notification_message TEXT;
  v_priority TEXT := 'normal';
BEGIN
  -- Get customer ID
  SELECT customer_id INTO v_customer_id 
  FROM deliveries 
  WHERE id = p_delivery_id;
  
  -- Update delivery status
  UPDATE deliveries 
  SET 
    status = p_status,
    driver_id = COALESCE(p_driver_id, driver_id),
    updated_at = NOW(),
    tracking_updates = tracking_updates || jsonb_build_object(
      'timestamp', NOW(),
      'status', p_status,
      'type', 'status_update'
    )
  WHERE id = p_delivery_id;
  
  -- Set notification content based on status
  CASE p_status
    WHEN 'confirmed' THEN
      v_notification_title := 'Delivery Confirmed';
      v_notification_message := 'Your delivery has been confirmed and we are finding a driver.';
    WHEN 'driver_assigned' THEN
      v_notification_title := 'Driver Assigned';
      v_notification_message := 'A driver has been assigned to your delivery!';
      v_priority := 'high';
    WHEN 'picked_up' THEN
      v_notification_title := 'Package Picked Up';
      v_notification_message := 'Your package has been picked up and is on the way!';
      v_priority := 'high';
    WHEN 'delivered' THEN
      v_notification_title := 'Delivery Complete';
      v_notification_message := 'Your package has been delivered successfully! Please rate your driver.';
      v_priority := 'urgent';
    WHEN 'cancelled' THEN
      v_notification_title := 'Delivery Cancelled';
      v_notification_message := 'Your delivery has been cancelled. Contact support if you need assistance.';
      v_priority := 'high';
    ELSE
      v_notification_title := 'Delivery Update';
      v_notification_message := 'Your delivery status has been updated.';
  END CASE;
  
  -- Create notification
  INSERT INTO notifications (user_id, title, message, type, delivery_id, priority, action_url)
  VALUES (
    v_customer_id,
    v_notification_title,
    v_notification_message,
    'delivery_update',
    p_delivery_id,
    v_priority,
    CASE 
      WHEN p_status = 'delivered' THEN '/rate-driver?delivery=' || p_delivery_id
      ELSE '/track-delivery?id=' || p_delivery_id
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for profiles to handle user types
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Update deliveries RLS policies to handle driver vs customer roles
DROP POLICY IF EXISTS "Users can view their own deliveries" ON deliveries;

CREATE POLICY "Customers can view their own deliveries" ON deliveries
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    (auth.uid() = driver_id AND driver_id IS NOT NULL)
  );

CREATE POLICY "Customers can create deliveries" ON deliveries
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'customer'
    )
  );

CREATE POLICY "Customers can update their own deliveries" ON deliveries
  FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Drivers can update assigned deliveries" ON deliveries
  FOR UPDATE USING (
    auth.uid() = driver_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'driver'
    )
  );
