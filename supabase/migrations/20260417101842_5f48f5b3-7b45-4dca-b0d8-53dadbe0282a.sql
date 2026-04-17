-- Add availability fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS available_from date,
  ADD COLUMN IF NOT EXISTS available_to date,
  ADD COLUMN IF NOT EXISTS trip_type text,
  ADD COLUMN IF NOT EXISTS desired_destinations text[];