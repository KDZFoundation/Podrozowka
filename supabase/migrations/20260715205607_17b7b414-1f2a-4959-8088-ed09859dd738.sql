
-- === Audyt bezpieczeństwa: jedna migracja porządkująca ===

-- 1) REVOKE anon SELECT na widokach (są security_invoker, ale porządek grantów)
REVOKE SELECT ON public.traveler_registrations_view FROM anon;
REVOKE SELECT ON public.user_gamification_stats FROM anon;

-- 2) Ujednolicenie ról w politykach RLS: policy operujące na auth.uid()/adminie
-- powinny być adresowane do `authenticated`, nie `public` (spójność intencji).

-- card_design_images
DROP POLICY IF EXISTS "Admins can manage card_design_images" ON public.card_design_images;
CREATE POLICY "Admins can manage card_design_images"
  ON public.card_design_images
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- notifications
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3) REVOKE EXECUTE na funkcjach nieprzeznaczonych do wywołania z klienta.
-- To są funkcje triggerów (mimo SECURITY DEFINER lub bez) — nie powinny być
-- wywoływalne bezpośrednio przez PUBLIC/anon/authenticated.

REVOKE EXECUTE ON FUNCTION public.update_member_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_platform_stats_on_postcard() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_profile_stats_on_postcard() FROM PUBLIC, anon, authenticated;

-- Funkcje pozostają dostępne dla postgres/service_role (właściciel + service_role
-- mają EXECUTE nadane wprost). Triggery działają dalej — trigger wykonuje funkcję
-- z uprawnieniami właściciela/definiera, nie wywołującego.
