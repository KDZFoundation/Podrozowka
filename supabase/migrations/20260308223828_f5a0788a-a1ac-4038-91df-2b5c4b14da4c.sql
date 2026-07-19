
-- Fix: recreate the view with SECURITY INVOKER (default, explicit)
DROP VIEW IF EXISTS public.user_gamification_stats;

CREATE VIEW public.user_gamification_stats
WITH (security_invoker = true)
AS
SELECT
  p.user_id,
  p.display_name,
  COALESCE(unit_stats.unit_count, 0) AS unit_count,
  COALESCE(unit_stats.unique_countries, 0) AS unique_countries,
  COALESCE(reg_stats.registration_count, 0) AS registration_count,
  (
    COALESCE(unit_stats.unit_count, 0) * 10
    + COALESCE(unit_stats.unique_countries, 0) * 50
    + COALESCE(reg_stats.registration_count, 0) * 100
  ) AS total_points,
  CASE
    WHEN (
      COALESCE(unit_stats.unit_count, 0) * 10
      + COALESCE(unit_stats.unique_countries, 0) * 50
      + COALESCE(reg_stats.registration_count, 0) * 100
    ) >= 7500 THEN 'Legenda Podróżówki'
    WHEN (
      COALESCE(unit_stats.unit_count, 0) * 10
      + COALESCE(unit_stats.unique_countries, 0) * 50
      + COALESCE(reg_stats.registration_count, 0) * 100
    ) >= 2500 THEN 'Misjonarz Kultury'
    WHEN (
      COALESCE(unit_stats.unit_count, 0) * 10
      + COALESCE(unit_stats.unique_countries, 0) * 50
      + COALESCE(reg_stats.registration_count, 0) * 100
    ) >= 500 THEN 'Ambasador'
    ELSE 'Zwiadowca'
  END AS impact_rank
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int AS unit_count,
    COUNT(DISTINCT cd.country_id)::int AS unique_countries
  FROM public.inventory_units iu
  JOIN public.card_designs cd ON cd.id = iu.card_design_id
  WHERE iu.traveler_user_id = p.user_id
) unit_stats ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS registration_count
  FROM public.recipient_registrations rr
  JOIN public.inventory_units iu ON iu.id = rr.inventory_unit_id
  WHERE iu.traveler_user_id = p.user_id
) reg_stats ON true;
