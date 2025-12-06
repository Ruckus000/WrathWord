-- Migration: Create trigger for automatic profile creation
-- This ensures profiles are created atomically when users sign up,
-- avoiding RLS issues when email confirmation is enabled.

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_friend_code TEXT;
BEGIN
  -- Generate a unique friend code in format XXXX-XXXX
  generated_friend_code := UPPER(SUBSTR(MD5(NEW.id::text || NOW()::text), 1, 4) || '-' || SUBSTR(MD5(NEW.id::text || NOW()::text), 5, 4));

  INSERT INTO public.profiles (user_id, username, display_name, friend_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    generated_friend_code
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If username or friend_code conflicts, generate fallback values
    INSERT INTO public.profiles (user_id, username, display_name, friend_code)
    VALUES (
      NEW.id,
      'user_' || LEFT(NEW.id::text, 8),
      'user_' || LEFT(NEW.id::text, 8),
      UPPER(SUBSTR(MD5(NEW.id::text || RANDOM()::text), 1, 4) || '-' || SUBSTR(MD5(NEW.id::text || RANDOM()::text), 5, 4))
    );
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clean up any orphaned users (users in auth.users without profiles)
-- This handles the user created during failed sign-up attempts
INSERT INTO public.profiles (user_id, username, display_name, friend_code)
SELECT
  au.id,
  'user_' || LEFT(au.id::text, 8),
  'user_' || LEFT(au.id::text, 8),
  UPPER(SUBSTR(MD5(au.id::text || NOW()::text), 1, 4) || '-' || SUBSTR(MD5(au.id::text || NOW()::text), 5, 4))
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
