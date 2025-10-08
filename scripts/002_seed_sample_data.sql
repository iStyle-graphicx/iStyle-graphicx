-- Insert sample notifications for testing
INSERT INTO public.notifications (user_id, title, message, type, is_read) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Welcome to VanGo!', 'Thank you for joining VanGo. Start by requesting your first delivery.', 'success', false),
  ('00000000-0000-0000-0000-000000000000', 'Driver Found', 'A driver has been assigned to your delivery request. Track your delivery in real-time.', 'info', false),
  ('00000000-0000-0000-0000-000000000000', 'Delivery Complete', 'Your delivery has been completed successfully. Please rate your experience.', 'success', true);

-- Insert sample payment methods
INSERT INTO public.payment_methods (user_id, type, details, is_default) VALUES
  ('00000000-0000-0000-0000-000000000000', 'mastercard', '{"last4": "1234", "brand": "mastercard", "exp_month": 12, "exp_year": 2025}', true),
  ('00000000-0000-0000-0000-000000000000', 'paypal', '{"email": "user@example.com"}', false);

-- Insert sample active drivers with locations in Pretoria area
INSERT INTO public.drivers (id, vehicle_type, license_plate, drivers_license, status, current_lat, current_lng, is_online, rating, total_deliveries, total_earnings) VALUES
  ('11111111-1111-1111-1111-111111111111', 'pickup', 'ABC 123 GP', 'DL123456789', 'active', -25.7479, 28.2293, true, 4.8, 45, 12500.00),
  ('22222222-2222-2222-2222-222222222222', 'van', 'DEF 456 GP', 'DL987654321', 'active', -25.7520, 28.2350, true, 4.9, 67, 18750.00),
  ('33333333-3333-3333-3333-333333333333', 'light', 'GHI 789 GP', 'DL456789123', 'active', -25.7400, 28.2200, true, 4.7, 32, 9800.00);

-- Insert corresponding profiles for the sample drivers
INSERT INTO public.profiles (id, first_name, last_name, phone, user_type) VALUES
  ('11111111-1111-1111-1111-111111111111', 'John', 'Smith', '+27 82 123 4567', 'driver'),
  ('22222222-2222-2222-2222-222222222222', 'Sarah', 'Johnson', '+27 83 987 6543', 'driver'),
  ('33333333-3333-3333-3333-333333333333', 'Mike', 'Williams', '+27 84 456 7890', 'driver');
