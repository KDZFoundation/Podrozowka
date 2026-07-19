
-- Enum for business status
CREATE TYPE public.business_status AS ENUM ('purchased', 'registered');

-- Enum for fulfillment status
CREATE TYPE public.fulfillment_status AS ENUM ('in_stock', 'reserved', 'qr_generated', 'qr_applied', 'shipped', 'voided', 'damaged');

-- Stock batches table
CREATE TABLE public.stock_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  card_design_id UUID NOT NULL REFERENCES public.card_designs(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory units table
CREATE TABLE public.inventory_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_batch_id UUID NOT NULL REFERENCES public.stock_batches(id) ON DELETE RESTRICT,
  card_design_id UUID NOT NULL REFERENCES public.card_designs(id) ON DELETE RESTRICT,
  internal_inventory_code TEXT NOT NULL UNIQUE,
  business_status public.business_status,
  fulfillment_status public.fulfillment_status NOT NULL DEFAULT 'in_stock',
  traveler_user_id UUID,
  order_id TEXT,
  order_item_id TEXT,
  shipment_id TEXT,
  public_claim_code TEXT UNIQUE,
  public_claim_token_hash TEXT,
  qr_generated_at TIMESTAMP WITH TIME ZONE,
  qr_applied_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  registered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_inventory_units_batch ON public.inventory_units(stock_batch_id);
CREATE INDEX idx_inventory_units_design ON public.inventory_units(card_design_id);
CREATE INDEX idx_inventory_units_fulfillment ON public.inventory_units(fulfillment_status);
CREATE INDEX idx_inventory_units_business ON public.inventory_units(business_status);
CREATE INDEX idx_inventory_units_claim_code ON public.inventory_units(public_claim_code);

-- Updated_at triggers
CREATE TRIGGER update_stock_batches_updated_at
  BEFORE UPDATE ON public.stock_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_units_updated_at
  BEFORE UPDATE ON public.inventory_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_units ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage stock_batches" ON public.stock_batches
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage inventory_units" ON public.inventory_units
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Travelers can view their own units
CREATE POLICY "Travelers can view own units" ON public.inventory_units
  FOR SELECT TO authenticated
  USING (auth.uid() = traveler_user_id);
