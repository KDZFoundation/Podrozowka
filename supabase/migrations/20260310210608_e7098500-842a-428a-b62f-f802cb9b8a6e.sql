
CREATE OR REPLACE FUNCTION public.calculate_user_impact_points(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _unit_count int;
  _unique_countries int;
  _reg_count int;
  _total int;
  _rank text;
  _ppu int;
  _ppc int;
  _ppr int;
BEGIN
  -- Dynamically fetch scoring config
  SELECT points_per_unit, points_per_country, points_per_registration
  INTO _ppu, _ppc, _ppr
  FROM public.gamification_config
  WHERE id = 1;

  -- Fallback defaults
  _ppu := COALESCE(_ppu, 10);
  _ppc := COALESCE(_ppc, 50);
  _ppr := COALESCE(_ppr, 100);

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

  _total := (_unit_count * _ppu) + (_unique_countries * _ppc) + (_reg_count * _ppr);

  -- Dynamically determine rank from gamification_tiers
  SELECT name INTO _rank
  FROM public.gamification_tiers
  WHERE min_points <= _total
  ORDER BY min_points DESC
  LIMIT 1;

  _rank := COALESCE(_rank, 'Zwiadowca');

  UPDATE public.profiles
  SET total_points = _total,
      current_rank = _rank
  WHERE user_id = _user_id;
END;
$function$;
