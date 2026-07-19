
-- 1. PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. RECIPIENT_REGISTRATIONS
DROP POLICY IF EXISTS "Travelers can view own registrations" ON public.recipient_registrations;
REVOKE SELECT ON public.recipient_registrations FROM authenticated, anon;
GRANT SELECT (id, inventory_unit_id, recipient_name, recipient_message, contact_opt_in, registered_at, created_at)
  ON public.recipient_registrations TO authenticated;
CREATE POLICY "Travelers can view own registrations (limited)" ON public.recipient_registrations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.inventory_units iu
    WHERE iu.id = recipient_registrations.inventory_unit_id
      AND iu.traveler_user_id = auth.uid()
  ));

-- 3. View
DROP VIEW IF EXISTS public.traveler_registrations_view;
CREATE VIEW public.traveler_registrations_view
WITH (security_invoker = true) AS
SELECT
  rr.id, rr.inventory_unit_id, rr.recipient_name, rr.recipient_message,
  CASE WHEN rr.contact_opt_in THEN rr.recipient_email ELSE NULL END AS recipient_email,
  rr.contact_opt_in, rr.registered_at, rr.created_at
FROM public.recipient_registrations rr
WHERE EXISTS (
  SELECT 1 FROM public.inventory_units iu
  WHERE iu.id = rr.inventory_unit_id AND iu.traveler_user_id = auth.uid()
);
GRANT SELECT ON public.traveler_registrations_view TO authenticated;

-- 4. Admin RPC
CREATE OR REPLACE FUNCTION public.admin_list_recipient_registrations()
RETURNS SETOF public.recipient_registrations
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.recipient_registrations
  WHERE public.has_role(auth.uid(), 'admin');
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_recipient_registrations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_recipient_registrations() TO authenticated;

-- 5. POSTCARDS legacy: revoke sensitive cols
REVOKE SELECT ON public.postcards FROM authenticated, anon;
GRANT SELECT (id, design_id, serial_number, qr_token, status, buyer_id, buyer_display_name, purchased_at, order_reference, registered_at, created_at, updated_at)
  ON public.postcards TO authenticated;

-- 6. STORAGE listing policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view postcard photos" ON storage.objects;

-- 7. STORAGE postcard-photos INSERT folder check
DROP POLICY IF EXISTS "Authenticated users can upload postcard photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload postcard photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'postcard-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 8. Revoke EXECUTE on SECURITY DEFINER funcs from clients
REVOKE EXECUTE ON FUNCTION public.reserve_inventory_for_order(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_user_gamification(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_user_impact_points(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_country_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_distance(numeric, numeric, numeric, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_claim_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_tracking_code() FROM PUBLIC, anon, authenticated;
