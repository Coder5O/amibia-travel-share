
-- Add gender and verified columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- Trips table
CREATE TABLE public.trips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  destination text NOT NULL,
  departure_date date NOT NULL,
  return_date date,
  available_seats integer NOT NULL DEFAULT 1,
  budget numeric,
  cost_split_method text DEFAULT 'equal',
  description text,
  region text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trips viewable by authenticated" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON public.trips FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON public.trips FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments table
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by authenticated" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Saved places
CREATE TABLE public.saved_places (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, location_id)
);
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved places" ON public.saved_places FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can save places" ON public.saved_places FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave places" ON public.saved_places FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Emergency contacts
CREATE TABLE public.emergency_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  contact_name text NOT NULL,
  phone text NOT NULL,
  relationship text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own emergency contacts" ON public.emergency_contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create emergency contacts" ON public.emergency_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emergency contacts" ON public.emergency_contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emergency contacts" ON public.emergency_contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Ratings & reviews
CREATE TABLE public.ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id uuid NOT NULL,
  reviewed_user_id uuid NOT NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  review_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, reviewed_user_id, trip_id)
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings viewable by authenticated" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create ratings" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id AND reviewer_id != reviewed_user_id);

-- Triggers for updated_at
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
