-- ==========================================
-- DUMMY DATA SCRIPT V3 (Lively Users & Clubs)
-- ==========================================

-- STEP 1: Handle Foreign Key Constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- STEP 2: Clear existing dummy data to avoid duplicates
DELETE FROM public.locations;
DELETE FROM public.profiles WHERE user_id::text LIKE '00000000-0000-0000-0000-%';

-- STEP 3: Insert Accurate Locations (including Clubs)
INSERT INTO public.locations (name, description, image_url, category, rating, visit_count, region)
VALUES 
  -- Nature & Sightseeing
  ('Sossusvlei', 'A salt and clay pan surrounded by high red dunes, located in the southern part of the Namib Desert.', 'https://images.unsplash.com/photo-1535941339077-2dd1c7963098?auto=format&fit=crop&q=80', 'nature', 4.9, 15400, 'Hardap Region'),
  ('Etosha National Park', 'One of Africa''s greatest wildlife parks, featuring a massive salt pan and abundant wildlife.', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&q=80', 'nature', 4.8, 12000, 'Kunene Region'),
  ('Swakopmund', 'A coastal city with German colonial architecture, known for adventure sports and beautiful beaches.', 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&q=80', 'city', 4.6, 9500, 'Erongo Region'),
  
  -- Windhoek Clubs & Nightlife
  ('Brewers Market', 'Popular spot in Windhoek for live music, craft beer, and a lively weekend crowd.', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80', 'club', 4.5, 3200, 'Khomas Region'),
  ('Chopsi''s Bar', 'Vibrant nightlife venue in the heart of Windhoek. Great music, cocktails, and dancing.', 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80', 'club', 4.6, 4500, 'Khomas Region'),
  ('The Social Club', 'Upscale lounge and nightclub perfect for Friday night hangouts and meeting locals.', 'https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&q=80', 'club', 4.4, 2800, 'Khomas Region'),
  ('Andy''s Pub', 'A relaxed pub with great food, cold drinks, and a welcoming atmosphere.', 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&q=80', 'restaurant', 4.3, 1500, 'Khomas Region');

-- STEP 4: Insert 15 Dummy Travel Buddies
INSERT INTO public.profiles (
  user_id, display_name, avatar_url, bio, location, availability_status, 
  trip_type, desired_destinations, verified, category, fun_fact
)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Elena K.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80', 'Photographer from Berlin. Heading to Sossusvlei for sunrise shots!', 'Windhoek', 'available', 'Photography Trip', ARRAY['Sossusvlei', 'Skeleton Coast'], true, 'has_both', 'I once spent 24 hours in a hide waiting for a desert lion.'),
  ('00000000-0000-0000-0000-000000000002', 'Johan S.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80', '4x4 enthusiast. I have a fully equipped Land Cruiser and space for 2!', 'Swakopmund', 'available', '4x4 Expedition', ARRAY['Fish River Canyon', 'Etosha'], true, 'has_means', 'My car has a built-in coffee machine for desert mornings.'),
  ('00000000-0000-0000-0000-000000000003', 'Sarah M.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80', 'Backpacker looking to join a group for Etosha. I make a great braai!', 'Windhoek', 'planning', 'Wildlife Safari', ARRAY['Etosha National Park'], false, 'needs_ride', 'I can identify 50 different bird species by their call.'),
  ('00000000-0000-0000-0000-000000000004', 'Markus W.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80', 'Climbing Spitzkoppe next week. Looking for a belay partner.', 'Windhoek', 'available', 'Rock Climbing', ARRAY['Spitzkoppe'], true, 'has_both', 'I''ve climbed on 5 different continents.'),
  ('00000000-0000-0000-0000-000000000005', 'Tangi N.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tangi', 'Local guide who loves showing people around Windhoek''s nightlife.', 'Windhoek', 'available', 'Club', ARRAY['Chopsi''s Bar', 'Brewers Market'], true, 'has_means', 'I know the bouncer at every club in town.'),
  ('00000000-0000-0000-0000-000000000006', 'Emma L.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80', 'Looking for dinner and drinks this Friday!', 'Windhoek', 'planning', 'Dinner', ARRAY['Andy''s Pub', 'The Social Club'], false, 'needs_ride', 'I rate restaurants purely by their dessert menu.'),
  ('00000000-0000-0000-0000-000000000007', 'David B.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80', 'Weekend warrior. Always up for a quick trip to the coast.', 'Windhoek', 'busy', 'Weekend', ARRAY['Swakopmund'], true, 'has_both', 'I surf sand dunes better than waves.'),
  ('00000000-0000-0000-0000-000000000008', 'Ndapanda H.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ndapanda', 'Anyone down for a chill lunch date? Let''s get Kapana.', 'Windhoek', 'available', 'Lunch', ARRAY['Single Quarters'], true, 'has_means', 'Kapana is my love language.'),
  ('00000000-0000-0000-0000-000000000009', 'Lukas T.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80', 'Just arrived in Namibia! Looking for a group to hit the clubs tonight.', 'Windhoek', 'planning', 'Club', ARRAY['The Social Club'], false, 'needs_ride', 'I''ve been practicing my afrobeats dance moves.'),
  ('00000000-0000-0000-0000-000000000010', 'Chloe F.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80', 'Planning a 5-day road trip down south. Need 1 more person.', 'Windhoek', 'planning', 'Road Trip', ARRAY['Fish River Canyon'], true, 'has_means', 'I make the best road trip playlists.'),
  ('00000000-0000-0000-0000-000000000011', 'Stefan O.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan', 'Who is going to Brewers Market tonight? Let''s link up.', 'Windhoek', 'available', 'Club', ARRAY['Brewers Market'], true, 'has_both', 'I am undefeated at pool.'),
  ('00000000-0000-0000-0000-000000000012', 'Amina Z.', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80', 'Craving sushi for dinner. Who''s in?', 'Windhoek', 'available', 'Dinner', ARRAY['Windhoek'], false, 'needs_ride', 'I own 4 different sets of chopsticks.'),
  ('00000000-0000-0000-0000-000000000013', 'Peter M.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80', 'Hitting Chopsi''s this weekend to celebrate my birthday!', 'Windhoek', 'available', 'Club', ARRAY['Chopsi''s Bar'], true, 'has_both', 'My birthday lasts the entire weekend.'),
  ('00000000-0000-0000-0000-000000000014', 'Jessica R.', 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80', 'I want to go to Swakopmund just for the oysters. Anyone driving?', 'Windhoek', 'planning', 'Weekend', ARRAY['Swakopmund'], false, 'needs_ride', 'I can eat two dozen oysters in one sitting.'),
  ('00000000-0000-0000-0000-000000000015', 'Kaleb V.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kaleb', 'Need a ride to Etosha! Will pay for gas and snacks.', 'Windhoek', 'planning', 'Wildlife Safari', ARRAY['Etosha National Park'], true, 'needs_ride', 'I brought too much biltong and I need help eating it.');
