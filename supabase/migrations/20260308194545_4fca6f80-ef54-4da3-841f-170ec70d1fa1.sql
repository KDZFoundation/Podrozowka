
-- 1. Tabela countries
CREATE TABLE public.countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  flag TEXT,
  language_code TEXT NOT NULL,
  language_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Countries are viewable by everyone"
  ON public.countries FOR SELECT
  USING (true);

-- 2. Tabela designs
CREATE TABLE public.designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  view_name TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Designs are viewable by everyone"
  ON public.designs FOR SELECT
  USING (true);

-- 3. Usunięcie starej tabeli postcards (triggers, policies zostaną usunięte automatycznie)
DROP TABLE IF EXISTS public.postcards CASCADE;

-- 4. Nowa tabela postcards
CREATE TABLE public.postcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  design_id UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  serial_number INTEGER NOT NULL,
  qr_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'available',
  buyer_id UUID,
  buyer_display_name TEXT,
  purchased_at TIMESTAMPTZ,
  order_reference TEXT,
  recipient_name TEXT,
  recipient_message TEXT,
  recipient_email TEXT,
  registered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (design_id, serial_number)
);

-- Validation trigger instead of CHECK constraint for status
CREATE OR REPLACE FUNCTION public.validate_postcard_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('available', 'purchased', 'registered') THEN
    RAISE EXCEPTION 'Invalid postcard status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_postcard_status_trigger
  BEFORE INSERT OR UPDATE ON public.postcards
  FOR EACH ROW EXECUTE FUNCTION public.validate_postcard_status();

-- updated_at trigger
CREATE TRIGGER update_postcards_updated_at
  BEFORE UPDATE ON public.postcards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.postcards ENABLE ROW LEVEL SECURITY;

-- RLS: publiczny SELECT tylko dla kupionych/zarejestrowanych (ograniczone kolumny przez widok)
-- Właściciel widzi swoje kartki w pełni
CREATE POLICY "Buyers can view their own postcards"
  ON public.postcards FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

-- Publiczny SELECT (ograniczony - dane do widoków/statystyk)
CREATE POLICY "Public can view purchased and registered postcards"
  ON public.postcards FOR SELECT
  USING (status IN ('purchased', 'registered'));

-- Brak INSERT/UPDATE z klienta - tylko edge functions z service_role

-- 5. Aktualizacja platform_stats
ALTER TABLE public.platform_stats ADD COLUMN IF NOT EXISTS total_registered INTEGER NOT NULL DEFAULT 0;

-- 6. Aktualizacja profiles - zmiana nazwy kolumny
ALTER TABLE public.profiles RENAME COLUMN postcards_given TO postcards_purchased;
