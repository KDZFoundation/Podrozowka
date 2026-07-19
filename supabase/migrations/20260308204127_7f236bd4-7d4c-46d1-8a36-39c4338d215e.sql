
-- Table for recipient registrations
CREATE TABLE public.recipient_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_unit_id UUID NOT NULL REFERENCES public.inventory_units(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_message TEXT,
  recipient_email TEXT,
  contact_opt_in BOOLEAN NOT NULL DEFAULT false,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint so one unit = one registration
ALTER TABLE public.recipient_registrations
  ADD CONSTRAINT uq_recipient_registrations_unit UNIQUE (inventory_unit_id);

-- RLS
ALTER TABLE public.recipient_registrations ENABLE ROW LEVEL SECURITY;

-- Public can insert (anonymous registration via QR)
CREATE POLICY "Anyone can register a postcard"
  ON public.recipient_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins can manage all
CREATE POLICY "Admins can manage registrations"
  ON public.recipient_registrations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Travelers can view registrations for their own units
CREATE POLICY "Travelers can view own registrations"
  ON public.recipient_registrations
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.inventory_units iu
    WHERE iu.id = recipient_registrations.inventory_unit_id
      AND iu.traveler_user_id = auth.uid()
  ));
