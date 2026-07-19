-- Fix 1: Revoke public EXECUTE on gamification functions (they're only called by triggers)
REVOKE EXECUTE ON FUNCTION public.recalculate_user_gamification(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_user_impact_points(uuid) FROM PUBLIC, anon, authenticated;

-- Fix 2: Secure profiles_public view - enable RLS and restrict to authenticated users
ALTER VIEW public.profiles_public SET (security_invoker = false);
DROP POLICY IF EXISTS "Public can view profiles for ranking" ON public.profiles;

-- Recreate the public ranking policy scoped to authenticated only
CREATE POLICY "Authenticated can view profiles for ranking"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (total_points > 0);