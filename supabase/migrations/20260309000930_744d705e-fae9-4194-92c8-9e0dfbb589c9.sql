
-- 1. Add lat/lng to recipient_registrations
ALTER TABLE public.recipient_registrations
  ADD COLUMN latitude numeric,
  ADD COLUMN longitude numeric;

-- 2. Add total_kilometers to profiles
ALTER TABLE public.profiles
  ADD COLUMN total_kilometers integer NOT NULL DEFAULT 0;

-- 3. Haversine distance function (km)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 numeric, lon1 numeric,
  lat2 numeric, lon2 numeric
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  r numeric := 6371;
  dlat numeric;
  dlon numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat / 2) ^ 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ^ 2;
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  RETURN round(r * c);
END;
$$;

-- 4. Trigger function: on registration with coords, add distance to traveler's profile
CREATE OR REPLACE FUNCTION public.on_registration_add_kilometers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _traveler_id uuid;
  _dist integer;
BEGIN
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT traveler_user_id INTO _traveler_id
  FROM public.inventory_units
  WHERE id = NEW.inventory_unit_id;

  IF _traveler_id IS NULL THEN
    RETURN NEW;
  END IF;

  _dist := public.calculate_distance(52.2297, 21.0122, NEW.latitude, NEW.longitude)::integer;

  UPDATE public.profiles
  SET total_kilometers = total_kilometers + _dist
  WHERE user_id = _traveler_id;

  RETURN NEW;
END;
$$;

-- 5. Attach trigger
CREATE TRIGGER trg_registration_kilometers
  AFTER INSERT ON public.recipient_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.on_registration_add_kilometers();
