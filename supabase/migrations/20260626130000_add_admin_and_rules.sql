-- Add role column to profiles for admin permissions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Add banned flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Create a SECURITY DEFINER function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Allow admins to delete any post
CREATE POLICY "Admins can delete any post"
ON public.posts
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Allow admins to delete any trip
CREATE POLICY "Admins can delete any trip"
ON public.trips
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Allow admins to update any profile (for banning)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create community_rules table
CREATE TABLE IF NOT EXISTS public.community_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_rules ENABLE ROW LEVEL SECURITY;

-- Everyone can read community rules
CREATE POLICY "Community rules are viewable by all" 
ON public.community_rules FOR SELECT TO authenticated USING (true);

-- Only admins can modify rules
CREATE POLICY "Only admins can insert rules" 
ON public.community_rules FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update rules" 
ON public.community_rules FOR UPDATE TO authenticated 
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete rules" 
ON public.community_rules FOR DELETE TO authenticated USING (public.is_admin());

-- Insert default community rules
INSERT INTO public.community_rules (title, description, category, sort_order) VALUES
('Be Respectful', 'Treat all fellow travelers with kindness and respect. Harassment, hate speech, or discriminatory behavior of any kind will result in an immediate ban.', 'conduct', 1),
('Verify Your Identity', 'Upload a valid government-issued ID for verification. This keeps our community safe and builds trust between travel buddies.', 'safety', 2),
('No Scams or Fraud', 'Do not use VoyageBuddy to deceive, scam, or defraud other users. This includes fake trip listings, fraudulent payment requests, or misleading profiles.', 'conduct', 3),
('Share Real Information', 'Your profile, trip details, and vehicle information must be accurate and truthful. Misrepresentation puts others at risk.', 'safety', 4),
('Respect Privacy', 'Do not share other users'' personal information (phone numbers, addresses, photos) without their explicit consent.', 'privacy', 5),
('Safe Meeting Practices', 'Always meet in a public place first. Share your trip details with a trusted friend or family member. Use the SOS feature if you ever feel unsafe.', 'safety', 6),
('No Illegal Activities', 'Do not use VoyageBuddy to facilitate any illegal activities, including drug trafficking, smuggling, or unlicensed transportation services.', 'conduct', 7),
('Report Suspicious Behavior', 'If you encounter suspicious or dangerous behavior, report it immediately using the in-app reporting tools or contact local authorities.', 'safety', 8),
('Vehicle Safety Standards', 'If you are offering rides, ensure your vehicle is roadworthy, insured, and meets basic safety standards. Carry a first-aid kit and spare tire.', 'safety', 9),
('Fair Cost Sharing', 'When splitting travel costs, agree on amounts before the trip. VoyageBuddy is for cost-sharing, not commercial profit. Do not overcharge fellow travelers.', 'conduct', 10);
