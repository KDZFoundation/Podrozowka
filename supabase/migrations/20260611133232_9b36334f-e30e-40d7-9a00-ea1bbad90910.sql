
-- Revoke EXECUTE from anon/authenticated on all trigger / internal SECURITY DEFINER funcs
REVOKE EXECUTE ON FUNCTION public.on_registration_add_kilometers() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_rank_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_platform_stats_on_postcard_v2() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_profile_stats_on_postcard_v2() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_inventory_unit_recalc_gamification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_new_registration() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_shipment_shipped() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_inventory_unit_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_registration_recalc_gamification() FROM PUBLIC, anon, authenticated;

-- Switch shared views to security_invoker so they enforce caller's RLS
ALTER VIEW public.profiles_public SET (security_invoker = true);
ALTER VIEW public.user_gamification_stats SET (security_invoker = true);
