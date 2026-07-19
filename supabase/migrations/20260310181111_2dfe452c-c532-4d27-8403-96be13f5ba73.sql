
-- Recreate profiles_public as SECURITY DEFINER and re-grant access
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = false) AS
SELECT
  id,
  user_id,
  display_name,
  avatar_url,
  total_points,
  current_rank,
  total_kilometers,
  postcards_purchased,
  postcards_received
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
