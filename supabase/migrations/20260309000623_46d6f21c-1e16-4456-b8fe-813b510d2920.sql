
-- Feature Flags table
CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT false
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags
  FOR SELECT
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert feature flags"
  ON public.feature_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete feature flags"
  ON public.feature_flags
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default flags
INSERT INTO public.feature_flags (key, name, description, is_enabled) VALUES
  ('travel_stats', 'Statystyki Kilometrów', 'Liczenie dystansu kartek od Warszawy', false),
  ('wall_of_connections', 'Ściana Relacji', 'Galeria zdjęć z rejestracji', false),
  ('travelers_journal', 'Dziennik Ambasadora', 'Oś czasu relacji', false),
  ('cultural_missions', 'Misje Kulturowe', 'Wyzwania dla podróżników', false);
