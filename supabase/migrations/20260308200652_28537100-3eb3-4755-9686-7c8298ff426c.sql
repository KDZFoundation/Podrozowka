
-- 1. Rename designs to card_designs
ALTER TABLE public.designs RENAME TO card_designs;

-- 2. Alter countries: rename columns first
ALTER TABLE public.countries RENAME COLUMN name TO name_pl;
ALTER TABLE public.countries RENAME COLUMN code TO iso2;

-- Add new columns
ALTER TABLE public.countries ADD COLUMN iso3 TEXT;
ALTER TABLE public.countries ADD COLUMN slug TEXT;
ALTER TABLE public.countries ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- Drop old columns
ALTER TABLE public.countries DROP COLUMN IF EXISTS language_code;
ALTER TABLE public.countries DROP COLUMN IF EXISTS language_name;
ALTER TABLE public.countries DROP COLUMN IF EXISTS flag;

-- Add constraints
ALTER TABLE public.countries ADD CONSTRAINT countries_slug_unique UNIQUE (slug);

-- 3. Alter card_designs
ALTER TABLE public.card_designs ADD COLUMN language_code TEXT NOT NULL DEFAULT 'en';
ALTER TABLE public.card_designs ADD COLUMN view_no INTEGER;
ALTER TABLE public.card_designs ADD COLUMN title TEXT;
ALTER TABLE public.card_designs ADD COLUMN thank_you_text TEXT;
ALTER TABLE public.card_designs ADD COLUMN image_front_url TEXT;
ALTER TABLE public.card_designs ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- Populate from old columns
UPDATE public.card_designs SET view_no = sort_order + 1 WHERE view_no IS NULL;
UPDATE public.card_designs SET title = view_name WHERE title IS NULL;

-- Drop old columns
ALTER TABLE public.card_designs DROP COLUMN IF EXISTS view_name;
ALTER TABLE public.card_designs DROP COLUMN IF EXISTS image_url;
ALTER TABLE public.card_designs DROP COLUMN IF EXISTS sort_order;

-- Unique constraint
ALTER TABLE public.card_designs ADD CONSTRAINT card_designs_country_view_unique UNIQUE (country_id, view_no);
ALTER TABLE public.card_designs ALTER COLUMN view_no SET NOT NULL;

-- 4. RLS: drop old, create new
DROP POLICY IF EXISTS "Countries are viewable by everyone" ON public.countries;
DROP POLICY IF EXISTS "Designs are viewable by everyone" ON public.card_designs;

CREATE POLICY "Public can view active countries"
  ON public.countries FOR SELECT
  USING (active = true);

CREATE POLICY "Public can view active designs"
  ON public.card_designs FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Admins can manage designs" ON public.card_designs;
CREATE POLICY "Admins can manage card_designs"
  ON public.card_designs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage countries" ON public.countries;
CREATE POLICY "Admins can manage countries"
  ON public.countries FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
