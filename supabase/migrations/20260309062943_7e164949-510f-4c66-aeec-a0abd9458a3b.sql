-- Fix profiles_public view: recreate with security_invoker = true
DROP VIEW IF EXISTS public.profiles_public;

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