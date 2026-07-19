-- 1. Drop the permissive INSERT policy on recipient_registrations
DROP POLICY IF EXISTS "Anyone can register a postcard" ON public.recipient_registrations;

-- 2. Add validation triggers for input length on profiles
CREATE OR REPLACE FUNCTION public.validate_profile_input()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF length(NEW.display_name) > 100 THEN
    RAISE EXCEPTION 'display_name too long (max 100)';
  END IF;
  IF length(NEW.first_name) > 50 THEN
    RAISE EXCEPTION 'first_name too long (max 50)';
  END IF;
  IF length(NEW.last_name) > 50 THEN
    RAISE EXCEPTION 'last_name too long (max 50)';
  END IF;
  IF length(NEW.bio) > 1000 THEN
    RAISE EXCEPTION 'bio too long (max 1000)';
  END IF;
  IF length(NEW.city) > 100 THEN
    RAISE EXCEPTION 'city too long (max 100)';
  END IF;
  IF length(NEW.country) > 100 THEN
    RAISE EXCEPTION 'country too long (max 100)';
  END IF;
  IF length(NEW.avatar_url) > 500 THEN
    RAISE EXCEPTION 'avatar_url too long (max 500)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_profile_input
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_input();

-- 3. Add validation trigger for recipient_registrations
CREATE OR REPLACE FUNCTION public.validate_registration_input()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF length(NEW.recipient_name) > 100 THEN
    RAISE EXCEPTION 'recipient_name too long (max 100)';
  END IF;
  IF length(NEW.recipient_message) > 500 THEN
    RAISE EXCEPTION 'recipient_message too long (max 500)';
  END IF;
  IF length(NEW.recipient_email) > 255 THEN
    RAISE EXCEPTION 'recipient_email too long (max 255)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_registration_input
BEFORE INSERT OR UPDATE ON public.recipient_registrations
FOR EACH ROW EXECUTE FUNCTION public.validate_registration_input();