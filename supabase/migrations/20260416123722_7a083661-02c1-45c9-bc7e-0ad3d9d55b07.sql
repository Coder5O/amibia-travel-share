CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, category, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Traveler'),
    COALESCE((NEW.raw_user_meta_data->>'category')::traveler_category, 'has_both'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;