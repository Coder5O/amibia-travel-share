-- Ensure foundational tables exist to prevent relation errors
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  location_name TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  reference_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Trigger: new like
CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner UUID;
BEGIN
  SELECT user_id INTO v_post_owner FROM public.posts WHERE id = NEW.post_id;
  IF v_post_owner != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, reference_id)
    VALUES (v_post_owner, NEW.user_id, 'like', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_insert ON public.likes;
CREATE TRIGGER on_like_insert
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_new_like();

-- Trigger: new comment
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner UUID;
BEGIN
  SELECT user_id INTO v_post_owner FROM public.posts WHERE id = NEW.post_id;
  IF v_post_owner != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, reference_id)
    VALUES (v_post_owner, NEW.user_id, 'comment', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_insert ON public.comments;
CREATE TRIGGER on_comment_insert
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();

-- Trigger: new trip request
CREATE OR REPLACE FUNCTION public.handle_new_trip_participant()
RETURNS TRIGGER AS $$
DECLARE
  v_trip_owner UUID;
BEGIN
  SELECT user_id INTO v_trip_owner FROM public.trips WHERE id = NEW.trip_id;
  IF v_trip_owner != NEW.user_id AND NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, actor_id, type, reference_id)
    VALUES (v_trip_owner, NEW.user_id, 'trip_request', NEW.trip_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trip_participant_insert ON public.trip_participants;
CREATE TRIGGER on_trip_participant_insert
AFTER INSERT ON public.trip_participants
FOR EACH ROW EXECUTE FUNCTION public.handle_new_trip_participant();

-- Trigger: trip request updated (approved/rejected)
CREATE OR REPLACE FUNCTION public.handle_trip_participant_status()
RETURNS TRIGGER AS $$
DECLARE
  v_trip_owner UUID;
BEGIN
  SELECT user_id INTO v_trip_owner FROM public.trips WHERE id = NEW.trip_id;
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.notifications (user_id, actor_id, type, reference_id)
    VALUES (NEW.user_id, v_trip_owner, 'trip_' || NEW.status, NEW.trip_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trip_participant_update ON public.trip_participants;
CREATE TRIGGER on_trip_participant_update
AFTER UPDATE ON public.trip_participants
FOR EACH ROW EXECUTE FUNCTION public.handle_trip_participant_status();
