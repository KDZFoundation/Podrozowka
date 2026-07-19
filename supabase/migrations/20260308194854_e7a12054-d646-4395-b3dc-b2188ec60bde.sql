
-- Trigger: update platform stats on postcard status change
CREATE OR REPLACE FUNCTION public.update_platform_stats_on_postcard_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- On purchase
  IF TG_OP = 'UPDATE' AND OLD.status = 'available' AND NEW.status = 'purchased' THEN
    UPDATE public.platform_stats 
    SET total_purchased = total_purchased + 1;
  END IF;

  -- On registration
  IF TG_OP = 'UPDATE' AND OLD.status = 'purchased' AND NEW.status = 'registered' THEN
    UPDATE public.platform_stats 
    SET total_registered = total_registered + 1;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_platform_stats_trigger
  AFTER UPDATE ON public.postcards
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_stats_on_postcard_v2();

-- Trigger: update profile stats on purchase
CREATE OR REPLACE FUNCTION public.update_profile_stats_on_postcard_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'available' AND NEW.status = 'purchased' AND NEW.buyer_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET postcards_purchased = postcards_purchased + 1
    WHERE user_id = NEW.buyer_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profile_stats_trigger
  AFTER UPDATE ON public.postcards
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats_on_postcard_v2();

-- Update country count function (called periodically or on registration)
CREATE OR REPLACE FUNCTION public.update_country_count()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.platform_stats
  SET total_countries = (
    SELECT COUNT(DISTINCT c.id)
    FROM public.postcards p
    JOIN public.designs d ON p.design_id = d.id
    JOIN public.countries c ON d.country_id = c.id
    WHERE p.status IN ('purchased', 'registered')
  );
END;
$$;
