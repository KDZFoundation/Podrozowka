
-- 1. Replace the existing function with the canonical name and full logic
CREATE OR REPLACE FUNCTION public.calculate_user_impact_points(_user_id uuid)
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

-- 2. Update the existing registration trigger to use canonical function name
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
    PERFORM public.calculate_user_impact_points(_traveler_id);
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Trigger on inventory_units INSERT to recalculate for the assigned traveler
CREATE OR REPLACE FUNCTION public.on_inventory_unit_recalc_gamification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.traveler_user_id IS NOT NULL THEN
    PERFORM public.calculate_user_impact_points(NEW.traveler_user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_unit_gamification ON public.inventory_units;
CREATE TRIGGER trg_inventory_unit_gamification
AFTER INSERT ON public.inventory_units
FOR EACH ROW
EXECUTE FUNCTION public.on_inventory_unit_recalc_gamification();
