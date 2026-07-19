
-- Event types enum
CREATE TYPE public.inventory_event_type AS ENUM (
  'created_in_stock', 'reserved_for_order', 'qr_generated', 'qr_applied',
  'shipped', 'registered', 'voided', 'damaged'
);

-- Actor types enum
CREATE TYPE public.event_actor_type AS ENUM ('system', 'admin', 'traveler', 'recipient');

-- Events table
CREATE TABLE public.inventory_unit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_unit_id UUID NOT NULL REFERENCES public.inventory_units(id) ON DELETE CASCADE,
  event_type public.inventory_event_type NOT NULL,
  actor_type public.event_actor_type NOT NULL DEFAULT 'system',
  actor_id UUID,
  payload_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_unit_events_unit ON public.inventory_unit_events(inventory_unit_id);
CREATE INDEX idx_inventory_unit_events_type ON public.inventory_unit_events(event_type);

-- RLS
ALTER TABLE public.inventory_unit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage events"
  ON public.inventory_unit_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Travelers can view own unit events"
  ON public.inventory_unit_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.inventory_units iu
    WHERE iu.id = inventory_unit_events.inventory_unit_id
      AND iu.traveler_user_id = auth.uid()
  ));

-- Allow system inserts (for triggers using SECURITY DEFINER)
-- Trigger function to auto-log events
CREATE OR REPLACE FUNCTION public.log_inventory_unit_event()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _event_type inventory_event_type;
  _actor_type event_actor_type := 'system';
  _actor_id UUID;
  _payload JSONB := '{}'::jsonb;
BEGIN
  -- INSERT = created
  IF TG_OP = 'INSERT' THEN
    _event_type := 'created_in_stock';
    _payload := jsonb_build_object(
      'stock_batch_id', NEW.stock_batch_id,
      'card_design_id', NEW.card_design_id,
      'internal_inventory_code', NEW.internal_inventory_code
    );

    INSERT INTO public.inventory_unit_events (inventory_unit_id, event_type, actor_type, actor_id, payload_json)
    VALUES (NEW.id, _event_type, _actor_type, _actor_id, _payload);

    RETURN NEW;
  END IF;

  -- UPDATE: detect what changed
  IF TG_OP = 'UPDATE' THEN
    -- Reserved
    IF OLD.fulfillment_status = 'in_stock' AND NEW.fulfillment_status = 'reserved' THEN
      INSERT INTO public.inventory_unit_events (inventory_unit_id, event_type, actor_type, payload_json)
      VALUES (NEW.id, 'reserved_for_order', 'system', jsonb_build_object(
        'order_id', NEW.order_id,
        'traveler_user_id', NEW.traveler_user_id
      ));
    END IF;

    -- QR generated
    IF OLD.fulfillment_status IN ('in_stock', 'reserved') AND NEW.fulfillment_status = 'qr_generated' THEN
      INSERT INTO public.inventory_unit_events (inventory_unit_id, event_type, actor_type, payload_json)
      VALUES (NEW.id, 'qr_generated', 'admin', jsonb_build_object(
        'public_claim_code', NEW.public_claim_code
      ));
    END IF;

    -- QR applied
    IF OLD.fulfillment_status != 'qr_applied' AND NEW.fulfillment_status = 'qr_applied' THEN
      INSERT INTO public.inventory_unit_events (inventory_unit_id, event_type, actor_type, payload_json)
      VALUES (NEW.id, 'qr_applied', 'admin', '{}'::jsonb);
    END IF;

    -- Shipped
    IF OLD.fulfillment_status != 'shipped' AND NEW.fulfillment_status = 'shipped' THEN
      INSERT INTO public.inventory_unit_events (inventory_unit_id, event_type, actor_type, payload_json)
      VALUES (NEW.id, 'shipped', 'system', jsonb_build_object(
        'shipment_id', NEW.shipment_id
      ));
    END IF;

    -- Registered (business_status change)
    IF (OLD.business_status IS DISTINCT FROM 'registered') AND NEW.business_status = 'registered' THEN
      INSERT INTO public.inventory_unit_events (inventory_unit_id, event_type, actor_type, payload_json)
      VALUES (NEW.id, 'registered', 'recipient', '{}'::jsonb);
    END IF;

    -- Voided
    IF OLD.fulfillment_status != 'voided' AND NEW.fulfillment_status = 'voided' THEN
      INSERT INTO public.inventory_unit_events (inventory_unit_id, event_type, actor_type, payload_json)
      VALUES (NEW.id, 'voided', 'admin', jsonb_build_object(
        'previous_status', OLD.fulfillment_status
      ));
    END IF;

    -- Damaged
    IF OLD.fulfillment_status != 'damaged' AND NEW.fulfillment_status = 'damaged' THEN
      INSERT INTO public.inventory_unit_events (inventory_unit_id, event_type, actor_type, payload_json)
      VALUES (NEW.id, 'damaged', 'admin', jsonb_build_object(
        'previous_status', OLD.fulfillment_status
      ));
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER trg_inventory_unit_events
  AFTER INSERT OR UPDATE ON public.inventory_units
  FOR EACH ROW
  EXECUTE FUNCTION public.log_inventory_unit_event();
