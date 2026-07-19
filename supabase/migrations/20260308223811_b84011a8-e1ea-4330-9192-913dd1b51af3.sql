
-- 1. Add gamification columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_rank text NOT NULL DEFAULT 'Zwiadowca';

-- 2. Create the gamification stats view
CREATE OR REPLACE VIEW public.user_gamification_stats AS
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

-- 3. Create function to recalculate gamification points for a user
CREATE OR REPLACE FUNCTION public.recalculate_user_gamification(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _unit_count int;
  _unique_countries int;
  _reg_count int;
  _total int;
  _rank text;
BEGIN
  SELECT
    COUNT(*)::int,
    COUNT(DISTINCT cd.country_id)::int
  INTO _unit_count, _unique_countries
  FROM public.inventory_units iu
  JOIN public.card_designs cd ON cd.id = iu.card_design_id
  WHERE iu.traveler_user_id = _user_id;

  SELECT COUNT(*)::int INTO _reg_count
  FROM public.recipient_registrations rr
  JOIN public.inventory_units iu ON iu.id = rr.inventory_unit_id
  WHERE iu.traveler_user_id = _user_id;

  _total := (_unit_count * 10) + (_unique_countries * 50) + (_reg_count * 100);

  _rank := CASE
    WHEN _total >= 7500 THEN 'Legenda Podróżówki'
    WHEN _total >= 2500 THEN 'Misjonarz Kultury'
    WHEN _total >= 500 THEN 'Ambasador'
    ELSE 'Zwiadowca'
  END;

  UPDATE public.profiles
  SET total_points = _total,
      current_rank = _rank
  WHERE user_id = _user_id;
END;
$$;

-- 4. Trigger function on recipient_registrations insert
CREATE OR REPLACE FUNCTION public.on_registration_recalc_gamification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _traveler_id uuid;
BEGIN
  SELECT traveler_user_id INTO _traveler_id
  FROM public.inventory_units
  WHERE id = NEW.inventory_unit_id;

  IF _traveler_id IS NOT NULL THEN
    PERFORM public.recalculate_user_gamification(_traveler_id);
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Create the trigger
CREATE TRIGGER trg_registration_gamification
AFTER INSERT ON public.recipient_registrations
FOR EACH ROW
EXECUTE FUNCTION public.on_registration_recalc_gamification();
