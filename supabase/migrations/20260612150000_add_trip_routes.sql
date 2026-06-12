-- Add origin and waypoints to trips
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'Windhoek',
ADD COLUMN IF NOT EXISTS waypoints TEXT[] DEFAULT '{}';
