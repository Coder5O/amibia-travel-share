
-- Remove duplicate locations, keeping the oldest (smallest created_at)
DELETE FROM public.saved_places
WHERE location_id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) rn FROM public.locations
  ) t WHERE rn > 1
);

DELETE FROM public.locations
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) rn FROM public.locations
  ) t WHERE rn > 1
);

-- Fix broken / wrong destination images
UPDATE public.locations SET image_url = 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&q=80' WHERE name = 'Kolmanskop' OR name = 'Kolmanskop Ghost Town';
UPDATE public.locations SET image_url = 'https://images.unsplash.com/photo-1612278675615-7b093b07772d?w=1200&q=80' WHERE name = 'Fish River Canyon';
UPDATE public.locations SET image_url = 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=1200&q=80' WHERE name = 'Skeleton Coast';
UPDATE public.locations SET image_url = 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=80' WHERE name = 'Etosha National Park';
UPDATE public.locations SET image_url = 'https://images.unsplash.com/photo-1535941339077-2dd1c7963098?w=1200&q=80' WHERE name = 'Sossusvlei';
UPDATE public.locations SET image_url = 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=1200&q=80' WHERE name = 'Spitzkoppe';
UPDATE public.locations SET image_url = 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=1200&q=80' WHERE name = 'Damaraland';
UPDATE public.locations SET image_url = 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=80' WHERE name = 'Swakopmund';
