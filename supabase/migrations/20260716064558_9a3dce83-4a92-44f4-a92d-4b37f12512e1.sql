
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'online';

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('online','cod'));

CREATE OR REPLACE FUNCTION public.create_order(
  _items jsonb,
  _pickup_point_name text,
  _pickup_point_address text,
  _pickup_point_city text,
  _shipping_cost numeric,
  _invoice_requested boolean DEFAULT false,
  _company_name text DEFAULT NULL::text,
  _company_nip text DEFAULT NULL::text,
  _company_address text DEFAULT NULL::text,
  _payment_method text DEFAULT 'online'
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  _expected_shipping numeric(10,2);
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

  IF _payment_method IS NULL OR _payment_method NOT IN ('online','cod') THEN
    RAISE EXCEPTION 'invalid_payment_method';
  END IF;

  IF _payment_method = 'online' THEN
    _expected_shipping := 13.99;
  ELSE
    _expected_shipping := 16.99;
  END IF;

  IF _shipping_cost <> _expected_shipping THEN
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
    invoice_requested, company_name, company_nip, company_address,
    payment_method
  ) VALUES (
    _uid, _total,
    _pickup_point_name, _pickup_point_address, _pickup_point_city, _shipping_cost,
    _invoice_requested, _company_name, _nip_clean, _company_address,
    _payment_method
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

  RETURN jsonb_build_object('id', _order_id, 'order_number', _order_number, 'total_amount', _total, 'payment_method', _payment_method);
END;
$function$;
