-- Delete all existing users (this will also delete their profiles due to CASCADE)
DELETE FROM auth.users;

-- Function to auto-confirm new users
CREATE OR REPLACE FUNCTION public.handle_new_user_confirm()
RETURNS TRIGGER AS $$
BEGIN
  -- We use a small delay or just update directly if possible
  -- Note: Updating auth.users directly from a trigger on auth.users can be tricky
  -- but in many Supabase setups, this works if the function is SECURITY DEFINER.
  UPDATE auth.users 
  SET email_confirmed_at = now(), 
      confirmed_at = now(),
      last_sign_in_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm 
AFTER INSERT ON auth.users 
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_confirm();
