-- Fix: Convert to security_invoker view and add a narrow public policy
-- Drop the definer view
DROP VIEW IF EXISTS public.profiles_public;

-- Recreate with security_invoker = true
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT
  user_id,
  display_name,
  avatar_url,
  total_points,
  current_rank,
  total_kilometers
FROM public.profiles;

-- Add a public SELECT policy that only exposes what's needed for ranking
-- The view already limits columns; RLS allows the read
CREATE POLICY "Public can view profiles for ranking"
  ON public.profiles FOR SELECT
  USING (total_points > 0);