-- ==================================================
-- ULTRA-SAFE DATABASE PERFORMANCE INDEXES MIGRATION
-- ==================================================

DO $$
BEGIN
    -- 1. Check and index public.profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_profiles_availability_status ON public.profiles(availability_status)';
    END IF;

    -- 2. Check and index public.trips
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trips') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at DESC)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination)';
    END IF;

    -- 3. Check and index public.saved_places
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_places') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON public.saved_places(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_saved_places_location_id ON public.saved_places(location_id)';
    END IF;

    -- 4. Check and index public.emergency_contacts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emergency_contacts') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id)';
    END IF;

    -- 5. Check and index public.conversation_participants
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversation_participants') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_conversation_participants_convo_id ON public.conversation_participants(conversation_id)';
    END IF;

    -- 6. Check and index public.messages
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_convo_id ON public.messages(conversation_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC)';
    END IF;

    -- 7. Check and index public.posts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC)';
    END IF;

    -- 8. Check and index public.comments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id)';
    END IF;

    -- 9. Check and index public.likes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id)';
    END IF;

    -- 10. Check and index public.ratings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ratings') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ratings_reviewed_user_id ON public.ratings(reviewed_user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ratings_reviewer_id ON public.ratings(reviewer_id)';
    END IF;
END $$;
