
-- 1. Extend orders with invoice + fiscal document fields
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS invoice_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS company_nip text,
  ADD COLUMN IF NOT EXISTS company_address text,
  ADD COLUMN IF NOT EXISTS fiscal_document_number text,
  ADD COLUMN IF NOT EXISTS fiscal_document_url text,
  ADD COLUMN IF NOT EXISTS fiscal_document_external_id text,
  ADD COLUMN IF NOT EXISTS fiscal_document_status text,
  ADD COLUMN IF NOT EXISTS fiscal_document_error text,
  ADD COLUMN IF NOT EXISTS fiscal_document_issued_at timestamptz;

-- 2. NIP validator (10 digits + checksum)
CREATE OR REPLACE FUNCTION public.is_valid_nip(_nip text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  clean text;
  weights int[] := ARRAY[6,5,7,2,3,4,5,6,7];
  s int := 0;
  i int;
  check_digit int;
BEGIN
  IF _nip IS NULL THEN RETURN false; END IF;
  clean := regexp_replace(_nip, '[^0-9]', '', 'g');
  IF length(clean) <> 10 THEN RETURN false; END IF;
  FOR i IN 1..9 LOOP
    s := s + weights[i] * (substr(clean, i, 1))::int;
  END LOOP;
  check_digit := s % 11;
  IF check_digit = 10 THEN RETURN false; END IF;
  RETURN check_digit = (substr(clean, 10, 1))::int;
END;
$$;

-- 3. Rewrite create_order with invoice fields
DROP FUNCTION IF EXISTS public.create_order(jsonb, text, text, text, numeric);

CREATE OR REPLACE FUNCTION public.create_order(
  _items jsonb,
  _pickup_point_name text,
  _pickup_point_address text,
  _pickup_point_city text,
  _shipping_cost numeric,
  _invoice_requested boolean DEFAULT false,
  _company_name text DEFAULT NULL,
  _company_nip text DEFAULT NULL,
  _company_address text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _order_id uuid;
  _order_number text;
  _item jsonb;
  _design_id uuid;
  _qty int;
  _unit_price numeric(10,2);
  _price_grosze int;
  _available int;
  _total numeric(10,2) := 0;
  _nip_clean text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart';
  END IF;
  IF jsonb_array_length(_items) > 100 THEN
    RAISE EXCEPTION 'too_many_items';
  END IF;
  IF coalesce(length(trim(_pickup_point_name)), 0) = 0 THEN
    RAISE EXCEPTION 'pickup_point_required';
  END IF;
  IF _shipping_cost IS NULL OR _shipping_cost < 0 THEN
    RAISE EXCEPTION 'invalid_shipping_cost';
  END IF;

  IF _invoice_requested THEN
    IF coalesce(length(trim(_company_name)), 0) = 0 THEN RAISE EXCEPTION 'invoice_company_name_required'; END IF;
    IF coalesce(length(trim(_company_address)), 0) = 0 THEN RAISE EXCEPTION 'invoice_company_address_required'; END IF;
    _nip_clean := regexp_replace(coalesce(_company_nip, ''), '[^0-9]', '', 'g');
    IF NOT public.is_valid_nip(_nip_clean) THEN RAISE EXCEPTION 'invoice_nip_invalid'; END IF;
    IF length(_company_name) > 200 THEN RAISE EXCEPTION 'invoice_company_name_too_long'; END IF;
    IF length(_company_address) > 500 THEN RAISE EXCEPTION 'invoice_company_address_too_long'; END IF;
  ELSE
    _company_name := NULL;
    _company_nip := NULL;
    _company_address := NULL;
    _nip_clean := NULL;
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _design_id := (_item->>'card_design_id')::uuid;
    _qty := (_item->>'quantity')::int;
    IF _qty IS NULL OR _qty < 1 OR _qty > 1000 THEN
      RAISE EXCEPTION 'invalid_quantity';
    END IF;

    SELECT price_grosze INTO _price_grosze
    FROM public.card_designs
    WHERE id = _design_id AND active = true AND price_grosze > 0;

    IF _price_grosze IS NULL THEN
      RAISE EXCEPTION 'invalid_design:%', _design_id;
    END IF;

    SELECT COUNT(*)::int INTO _available
    FROM public.inventory_units iu
    WHERE iu.card_design_id = _design_id
      AND iu.fulfillment_status = 'in_stock'
      AND iu.order_id IS NULL;

    IF _qty > _available THEN
      RAISE EXCEPTION 'out_of_stock:%:%:%', _design_id, _qty, _available;
    END IF;

    _unit_price := _price_grosze::numeric / 100.0;
    _total := _total + (_qty * _unit_price);
  END LOOP;

  _total := _total + _shipping_cost;

  INSERT INTO public.orders(
    user_id, total_amount,
    pickup_point_name, pickup_point_address, pickup_point_city, shipping_cost,
    invoice_requested, company_name, company_nip, company_address
  ) VALUES (
    _uid, _total,
    _pickup_point_name, _pickup_point_address, _pickup_point_city, _shipping_cost,
    _invoice_requested, _company_name, _nip_clean, _company_address
  )
  RETURNING id, order_number INTO _order_id, _order_number;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _design_id := (_item->>'card_design_id')::uuid;
    _qty := (_item->>'quantity')::int;
    SELECT price_grosze INTO _price_grosze FROM public.card_designs WHERE id = _design_id;
    _unit_price := _price_grosze::numeric / 100.0;
    INSERT INTO public.order_items(order_id, card_design_id, quantity, unit_price, total_price)
    VALUES (_order_id, _design_id, _qty, _unit_price, _qty * _unit_price);
  END LOOP;

  RETURN jsonb_build_object('id', _order_id, 'order_number', _order_number, 'total_amount', _total);
END;
$$;
