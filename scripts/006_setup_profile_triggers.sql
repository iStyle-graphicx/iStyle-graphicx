-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, user_type, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'customer'),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id, email_notifications, push_notifications, sms_notifications, marketing_communications)
  VALUES (NEW.id, true, true, false, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create guest user profile for Vango Delivery
INSERT INTO public.profiles (id, first_name, last_name, user_type, phone, avatar_url)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Vango',
  'Delivery',
  'guest',
  '+27746297208',
  '/images/vango-logo.png'
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  user_type = EXCLUDED.user_type,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url;
