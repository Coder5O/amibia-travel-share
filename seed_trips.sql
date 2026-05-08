-- ==========================================
-- SEED TRIPS — 10 Realistic Upcoming Trips
-- Uses dummy user IDs from dummy_data_seed_v3.sql
-- All dates are relative to CURRENT_DATE so they stay in the future
-- ==========================================

DELETE FROM public.trips WHERE user_id::text LIKE '00000000-0000-0000-0000-%';

INSERT INTO public.trips (
  user_id, destination, departure_date, return_date, departure_time,
  available_seats, budget, cost_split_method, trip_type, description, region, status
)
VALUES
  -- Weekend coastal trip
  (
    '00000000-0000-0000-0000-000000000002',
    'Swakopmund',
    (CURRENT_DATE + INTERVAL '3 days')::date,
    (CURRENT_DATE + INTERVAL '5 days')::date,
    '06:00',
    3, 3500, 'equal', 'Weekend',
    'Road trip to Swakop! Leaving early Friday morning. My Land Cruiser fits 3 more. Splitting fuel + accommodation equally.',
    'Erongo Region',
    'open'
  ),
  -- Friday nightlife outing
  (
    '00000000-0000-0000-0000-000000000005',
    'Chopsi''s Bar',
    (CURRENT_DATE + INTERVAL '2 days')::date,
    NULL,
    '20:00',
    5, 500, 'equal', 'Club',
    'Friday vibes at Chopsi''s! Pre-drinks at my place first, then we roll. Who''s in?',
    'Khomas Region',
    'open'
  ),
  -- Safari trip
  (
    '00000000-0000-0000-0000-000000000001',
    'Etosha National Park',
    (CURRENT_DATE + INTERVAL '10 days')::date,
    (CURRENT_DATE + INTERVAL '13 days')::date,
    '05:30',
    2, 8000, 'equal', 'Road Trip',
    'Photography trip to Etosha. Planning to camp at Halali and Okaukuejo. Need someone who doesn''t mind early mornings!',
    'Kunene Region',
    'open'
  ),
  -- Lunch outing
  (
    '00000000-0000-0000-0000-000000000008',
    'Single Quarters',
    (CURRENT_DATE + INTERVAL '1 day')::date,
    NULL,
    '12:00',
    4, 200, 'equal', 'Lunch',
    'Kapana run tomorrow! Meeting at the usual spot near Oshetu. The more the merrier 🍖',
    'Khomas Region',
    'open'
  ),
  -- Sossusvlei long haul
  (
    '00000000-0000-0000-0000-000000000010',
    'Sossusvlei',
    (CURRENT_DATE + INTERVAL '14 days')::date,
    (CURRENT_DATE + INTERVAL '17 days')::date,
    '04:00',
    1, 6000, 'equal', 'Long Haul',
    '5-day trip down south via Solitaire → Sossusvlei → Fish River Canyon. Need 1 more person to share fuel. You must be okay with camping.',
    'Hardap Region',
    'open'
  ),
  -- Brewers Market outing
  (
    '00000000-0000-0000-0000-000000000011',
    'Brewers Market',
    (CURRENT_DATE + INTERVAL '4 days')::date,
    NULL,
    '17:00',
    6, 300, 'equal', 'Club',
    'Saturday afternoon at Brewers! Live music lineup looks 🔥 this week. Let''s grab a table early.',
    'Khomas Region',
    'open'
  ),
  -- Dinner plan
  (
    '00000000-0000-0000-0000-000000000012',
    'The Stellenbosch Wine Bar',
    (CURRENT_DATE + INTERVAL '5 days')::date,
    NULL,
    '19:00',
    3, 800, 'equal', 'Dinner',
    'Sushi and wine evening! I''ve been craving this for weeks. Looking for fellow foodies.',
    'Khomas Region',
    'open'
  ),
  -- Day trip to Spitzkoppe
  (
    '00000000-0000-0000-0000-000000000004',
    'Spitzkoppe',
    (CURRENT_DATE + INTERVAL '7 days')::date,
    (CURRENT_DATE + INTERVAL '7 days')::date,
    '06:00',
    2, 1500, 'driver-pays-fuel', 'Day Trip',
    'Climbing day at Spitzkoppe! All skill levels welcome. I''ll bring the ropes and gear. You bring snacks.',
    'Erongo Region',
    'open'
  ),
  -- Birthday club crawl
  (
    '00000000-0000-0000-0000-000000000013',
    'The Social Club',
    (CURRENT_DATE + INTERVAL '6 days')::date,
    NULL,
    '21:00',
    8, 1000, 'percentage', 'Club',
    'Birthday weekend! Starting at Social Club, then hitting Chopsi''s. VIP table booked. Let''s make it legendary 🎂🎉',
    'Khomas Region',
    'open'
  ),
  -- Walvis Bay weekend
  (
    '00000000-0000-0000-0000-000000000014',
    'Walvis Bay',
    (CURRENT_DATE + INTERVAL '9 days')::date,
    (CURRENT_DATE + INTERVAL '10 days')::date,
    '07:00',
    2, 2500, 'equal', 'Weekend',
    'Oysters and flamingos! Quick weekend trip to Walvis Bay. Anyone driving from Windhoek? I''ll pay for fuel 🦩',
    'Erongo Region',
    'open'
  );
