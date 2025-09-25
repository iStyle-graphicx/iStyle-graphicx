-- Create function to notify customers when delivery status changes
CREATE OR REPLACE FUNCTION notify_delivery_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify customer when delivery is accepted
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.customer_id,
      'Delivery Accepted!',
      'Your delivery request has been accepted by a driver. Track your delivery in real-time.',
      'delivery_accepted'
    );
  END IF;

  -- Notify customer when delivery is picked up
  IF NEW.status = 'picked_up' AND OLD.status = 'accepted' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.customer_id,
      'Package Picked Up',
      'Your package has been picked up and is on its way to the destination.',
      'delivery_request'
    );
  END IF;

  -- Notify customer when delivery is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.customer_id,
      'Delivery Completed!',
      'Your package has been successfully delivered. Please rate your experience.',
      'delivery_completed'
    );
  END IF;

  -- Notify driver when new delivery is available (if they're assigned)
  IF NEW.driver_id IS NOT NULL AND OLD.driver_id IS NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.driver_id,
      'New Delivery Assignment',
      'You have been assigned a new delivery. Check your driver portal for details.',
      'delivery_request'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for delivery status changes
DROP TRIGGER IF EXISTS delivery_status_change_trigger ON public.deliveries;
CREATE TRIGGER delivery_status_change_trigger
  AFTER UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION notify_delivery_status_change();

-- Create function to notify on payment status changes
CREATE OR REPLACE FUNCTION notify_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify customer when payment is confirmed
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.customer_id,
      'Payment Confirmed',
      'Your payment has been processed successfully. Your delivery is now confirmed.',
      'payment_received'
    );
  END IF;

  -- Notify driver when payment is received (for their earnings)
  IF NEW.payment_status = 'paid' AND NEW.driver_id IS NOT NULL AND OLD.payment_status != 'paid' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.driver_id,
      'Payment Received',
      'Payment for your completed delivery has been processed. Check your earnings.',
      'payment_received'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment status changes
DROP TRIGGER IF EXISTS payment_status_change_trigger ON public.deliveries;
CREATE TRIGGER payment_status_change_trigger
  AFTER UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_status_change();

-- Create function to send welcome notification to new users
CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Send welcome notification based on user type
  IF NEW.user_type = 'customer' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.id,
      'Welcome to Vango Delivery!',
      'Your customer account is ready. Start requesting deliveries for your hardware materials.',
      'success'
    );
  ELSIF NEW.user_type = 'driver' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.id,
      'Welcome to the Vango Driver Network!',
      'Your driver account is ready. Start accepting delivery requests and earn money.',
      'success'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user welcome notifications
DROP TRIGGER IF EXISTS new_user_welcome_trigger ON public.profiles;
CREATE TRIGGER new_user_welcome_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_notification();
