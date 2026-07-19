
ALTER TABLE public.card_designs
  ADD COLUMN IF NOT EXISTS price_grosze integer NOT NULL DEFAULT 0 CHECK (price_grosze >= 0),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'PLN',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS card_designs_updated_at ON public.card_designs;
CREATE TRIGGER card_designs_updated_at
  BEFORE UPDATE ON public.card_designs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.card_design_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_design_id uuid NOT NULL REFERENCES public.card_designs(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS card_design_images_design_idx
  ON public.card_design_images(card_design_id, sort_order);

GRANT SELECT ON public.card_design_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.card_design_images TO authenticated;
GRANT ALL ON public.card_design_images TO service_role;

ALTER TABLE public.card_design_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view images of active designs"
  ON public.card_design_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.card_designs cd
      WHERE cd.id = card_design_images.card_design_id
        AND cd.active = true
    )
  );

CREATE POLICY "Admins can manage card_design_images"
  ON public.card_design_images
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
