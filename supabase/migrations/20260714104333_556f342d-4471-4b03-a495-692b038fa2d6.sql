
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.card_designs
  ADD COLUMN category_id uuid NULL REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX idx_card_designs_category_id ON public.card_designs(category_id);

INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Natura', 'natura', 10),
  ('Architektura', 'architektura', 20),
  ('Sztuka', 'sztuka', 30),
  ('Wydarzenia', 'wydarzenia', 40),
  ('Postacie', 'postacie', 50);
