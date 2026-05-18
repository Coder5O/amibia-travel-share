-- ==========================================
-- SAFE DATABASE PERFORMANCE INDEXES MIGRATION
-- ==========================================

-- 1. Profiles Table Indexes (Guaranteed to exist)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_availability_status ON public.profiles(availability_status);

-- 2. Trips Table Indexes (Guaranteed to exist)
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination);

-- 3. Saved Places Indexes (Guaranteed to exist)
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON public.saved_places(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_location_id ON public.saved_places(location_id);

-- 4. Emergency Contacts Indexes (Guaranteed to exist)
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);

-- 5. Conversation Participants Indexes (Guaranteed to exist)
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_convo_id ON public.conversation_participants(conversation_id);

-- 6. Messages Table Indexes (Guaranteed to exist)
CREATE INDEX IF NOT EXISTS idx_messages_convo_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- 7. Conditional Table Indexes (Only run if optional tables are created)
DO $$
BEGIN
    -- Check public.posts table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC)';
    END IF;

    -- Check public.comments table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id)';
    END IF;

    -- Check public.likes table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id)';
    END IF;

    -- Check public.ratings table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ratings') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ratings_reviewed_user_id ON public.ratings(reviewed_user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ratings_reviewer_id ON public.ratings(reviewer_id)';
    END IF;
END $$;
