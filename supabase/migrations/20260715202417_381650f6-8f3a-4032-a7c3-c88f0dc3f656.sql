
-- Auth-only tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_unit_events TO authenticated;
GRANT ALL ON public.inventory_unit_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_units TO authenticated;
GRANT ALL ON public.inventory_units TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_print_job_items TO authenticated;
GRANT ALL ON public.qr_print_job_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_print_jobs TO authenticated;
GRANT ALL ON public.qr_print_jobs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipient_registrations TO authenticated;
GRANT ALL ON public.recipient_registrations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_batches TO authenticated;
GRANT ALL ON public.stock_batches TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.postcards TO authenticated;
GRANT ALL ON public.postcards TO service_role;

-- Public-read tables (also grant SELECT to anon)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_design_images TO authenticated;
GRANT ALL ON public.card_design_images TO service_role;
GRANT SELECT ON public.card_design_images TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_designs TO authenticated;
GRANT ALL ON public.card_designs TO service_role;
GRANT SELECT ON public.card_designs TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT SELECT ON public.categories TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.countries TO authenticated;
GRANT ALL ON public.countries TO service_role;
GRANT SELECT ON public.countries TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
GRANT SELECT ON public.feature_flags TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gamification_config TO authenticated;
GRANT ALL ON public.gamification_config TO service_role;
GRANT SELECT ON public.gamification_config TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gamification_tiers TO authenticated;
GRANT ALL ON public.gamification_tiers TO service_role;
GRANT SELECT ON public.gamification_tiers TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_stats TO authenticated;
GRANT ALL ON public.platform_stats TO service_role;
GRANT SELECT ON public.platform_stats TO anon;
