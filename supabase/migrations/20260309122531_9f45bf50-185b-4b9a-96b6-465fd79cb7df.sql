
-- 1. Drop the overly broad ranking policy that exposes PII (first_name, last_name, etc.)
DROP POLICY IF EXISTS "Authenticated can view profiles for ranking" ON public.profiles;

-- 2. Recreate profiles_public view as SECURITY DEFINER (security_invoker=false)
--    so it bypasses RLS with its own controlled column projection (no PII columns).
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

-- 3. Grant SELECT to authenticated and anon so ranking/community features work
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
