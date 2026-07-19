
-- QR print job status enum
CREATE TYPE public.qr_print_job_status AS ENUM ('pending', 'generating', 'ready', 'printed', 'failed');

-- QR print jobs table
CREATE TABLE public.qr_print_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  shipment_id TEXT,
  order_id UUID REFERENCES public.orders(id),
  status public.qr_print_job_status NOT NULL DEFAULT 'pending',
  total_items INTEGER NOT NULL DEFAULT 0,
  generated_items INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QR print job items - links a print job to specific inventory units
CREATE TABLE public.qr_print_job_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  print_job_id UUID NOT NULL REFERENCES public.qr_print_jobs(id) ON DELETE CASCADE,
  inventory_unit_id UUID NOT NULL REFERENCES public.inventory_units(id) ON DELETE RESTRICT,
  public_claim_code TEXT NOT NULL,
  qr_url TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(print_job_id, inventory_unit_id)
);

-- Indexes
CREATE INDEX idx_qr_print_jobs_order ON public.qr_print_jobs(order_id);
CREATE INDEX idx_qr_print_jobs_status ON public.qr_print_jobs(status);
CREATE INDEX idx_qr_print_job_items_job ON public.qr_print_job_items(print_job_id);
CREATE INDEX idx_qr_print_job_items_unit ON public.qr_print_job_items(inventory_unit_id);

-- Updated_at trigger
CREATE TRIGGER update_qr_print_jobs_updated_at
  BEFORE UPDATE ON public.qr_print_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.qr_print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_print_job_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage qr_print_jobs" ON public.qr_print_jobs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage qr_print_job_items" ON public.qr_print_job_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to generate a public claim code in PDZ-XXXX-XXXX format
CREATE OR REPLACE FUNCTION public.generate_claim_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  code TEXT;
  cnt INTEGER;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INTEGER;
  part1 TEXT := '';
  part2 TEXT := '';
BEGIN
  LOOP
    part1 := '';
    part2 := '';
    FOR i IN 1..4 LOOP
      part1 := part1 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      part2 := part2 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    code := 'PDZ-' || part1 || '-' || part2;
    SELECT COUNT(*) INTO cnt FROM public.inventory_units WHERE public_claim_code = code;
    EXIT WHEN cnt = 0;
  END LOOP;
  RETURN code;
END;
$$;
