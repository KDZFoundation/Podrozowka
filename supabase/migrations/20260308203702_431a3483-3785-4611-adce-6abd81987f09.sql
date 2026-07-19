
-- Shipment status enum
CREATE TYPE public.shipment_status AS ENUM ('pending', 'packed', 'shipped', 'delivered', 'returned');

-- Shipments table
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  status public.shipment_status NOT NULL DEFAULT 'pending',
  tracking_number TEXT,
  carrier TEXT,
  shipping_method TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_shipments_order ON public.shipments(order_id);
CREATE INDEX idx_shipments_user ON public.shipments(user_id);
CREATE INDEX idx_shipments_status ON public.shipments(status);

-- Updated_at trigger
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all shipments" ON public.shipments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function: when shipment marked as shipped, update inventory_units
CREATE OR REPLACE FUNCTION public.on_shipment_shipped()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'shipped' AND (OLD.status IS DISTINCT FROM 'shipped') THEN
    -- Update shipped_at on shipment
    NEW.shipped_at := COALESCE(NEW.shipped_at, now());

    -- Update all inventory_units linked to this order
    UPDATE public.inventory_units
    SET fulfillment_status = 'shipped',
        shipped_at = now(),
        shipment_id = NEW.id::text
    WHERE order_id = NEW.order_id::text
      AND fulfillment_status IN ('reserved', 'qr_generated', 'qr_applied');
  END IF;

  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    NEW.delivered_at := COALESCE(NEW.delivered_at, now());
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shipment_shipped
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.on_shipment_shipped();
