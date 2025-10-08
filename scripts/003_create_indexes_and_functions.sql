-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_drivers_status_online ON public.drivers(status, is_online);
CREATE INDEX IF NOT EXISTS idx_deliveries_customer_id ON public.deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON public.deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);

-- Function to update driver location
CREATE OR REPLACE FUNCTION update_driver_location(
  driver_id UUID,
  new_lat DECIMAL(10, 8),
  new_lng DECIMAL(11, 8)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.drivers
  SET 
    current_lat = new_lat,
    current_lng = new_lng,
    updated_at = NOW()
  WHERE id = driver_id AND status = 'active';
  
  RETURN FOUND;
END;
$$;

-- Function to calculate delivery distance (simplified)
CREATE OR REPLACE FUNCTION calculate_delivery_fee(
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  delivery_lat DECIMAL(10, 8),
  delivery_lng DECIMAL(11, 8),
  weight_kg INTEGER
)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
  distance_km DECIMAL(10, 2);
  base_rate DECIMAL(10, 2) := 50.00;
  rate_per_km DECIMAL(10, 2);
BEGIN
  -- Simplified distance calculation (in real app, use proper geospatial functions)
  distance_km := SQRT(
    POWER(pickup_lat - delivery_lat, 2) + 
    POWER(pickup_lng - delivery_lng, 2)
  ) * 111; -- Rough conversion to km
  
  -- Determine rate based on weight
  IF weight_kg <= 50 THEN
    rate_per_km := 35.00;
  ELSIF weight_kg <= 200 THEN
    rate_per_km := 50.00;
  ELSE
    rate_per_km := 65.00;
  END IF;
  
  RETURN base_rate + (distance_km * rate_per_km);
END;
$$;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_title TEXT,
  notification_message TEXT,
  notification_type TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (target_user_id, notification_title, notification_message, notification_type)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger to update driver earnings when delivery is completed
CREATE OR REPLACE FUNCTION update_driver_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE public.drivers
    SET 
      total_deliveries = total_deliveries + 1,
      total_earnings = total_earnings + NEW.delivery_fee,
      updated_at = NOW()
    WHERE id = NEW.driver_id;
    
    -- Create notification for driver
    PERFORM create_notification(
      NEW.driver_id,
      'Delivery Completed',
      'You have successfully completed a delivery and earned R' || NEW.delivery_fee::TEXT,
      'success'
    );
    
    -- Create notification for customer
    PERFORM create_notification(
      NEW.customer_id,
      'Delivery Completed',
      'Your delivery has been completed successfully. Please rate your experience.',
      'success'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for delivery completion
DROP TRIGGER IF EXISTS trigger_update_driver_stats ON public.deliveries;
CREATE TRIGGER trigger_update_driver_stats
  AFTER UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_stats();
