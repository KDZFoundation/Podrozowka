
-- 1. Add pickup + shipping cost columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pickup_point_name text,
  ADD COLUMN IF NOT EXISTS pickup_point_address text,
  ADD COLUMN IF NOT EXISTS pickup_point_city text,
  ADD COLUMN IF NOT EXISTS shipping_cost numeric(10,2) NOT NULL DEFAULT 0;

-- 2. Drop old create_order (old signature with home shipping address)
DROP FUNCTION IF EXISTS public.create_order(jsonb, text, text, text, text, text);

-- 3. New create_order using InPost pickup + real prices from card_designs + server-side stock validation
CREATE OR REPLACE FUNCTION public.create_order(
  _items jsonb,
  _pickup_point_name text,
  _pickup_point_address text,
  _pickup_point_city text,
  _shipping_cost numeric
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
    pickup_point_name, pickup_point_address, pickup_point_city, shipping_cost
  ) VALUES (
    _uid, _total,
    _pickup_point_name, _pickup_point_address, _pickup_point_city, _shipping_cost
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

-- 4. Allow service_role to call reserve_inventory_for_order (for webhook)
CREATE OR REPLACE FUNCTION public.reserve_inventory_for_order(_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _order RECORD;
  _item RECORD;
  _reserved_count INTEGER;
  _available_count INTEGER;
  _unit_ids UUID[];
  _result JSONB := '{"reserved": []}'::jsonb;
  _errors JSONB := '[]'::jsonb;
  _is_service_role boolean := (current_setting('request.jwt.claim.role', true) = 'service_role')
                              OR (current_user = 'service_role');
BEGIN
  IF NOT _is_service_role AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  SELECT * INTO _order FROM public.orders WHERE id = _order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Zamówienie nie istnieje');
  END IF;
  IF _order.payment_status != 'paid' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Zamówienie nie jest opłacone');
  END IF;

  SELECT COUNT(*) INTO _reserved_count
  FROM public.inventory_units
  WHERE order_id = _order_id::text;

  IF _reserved_count > 0 THEN
    RETURN jsonb_build_object('success', true, 'details', jsonb_build_object('already_reserved', _reserved_count));
  END IF;

  FOR _item IN
    SELECT oi.id AS item_id, oi.card_design_id, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = _order_id
  LOOP
    SELECT COUNT(*) INTO _available_count
    FROM public.inventory_units
    WHERE card_design_id = _item.card_design_id
      AND fulfillment_status = 'in_stock'
      AND order_id IS NULL;

    IF _available_count < _item.quantity THEN
      _errors := _errors || jsonb_build_array(jsonb_build_object(
        'card_design_id', _item.card_design_id,
        'requested', _item.quantity,
        'available', _available_count
      ));
    END IF;
  END LOOP;

  IF jsonb_array_length(_errors) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Brak wystarczającej ilości sztuk w magazynie',
      'shortages', _errors
    );
  END IF;

  FOR _item IN
    SELECT oi.id AS item_id, oi.card_design_id, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = _order_id
  LOOP
    SELECT ARRAY_AGG(id) INTO _unit_ids
    FROM (
      SELECT id
      FROM public.inventory_units
      WHERE card_design_id = _item.card_design_id
        AND fulfillment_status = 'in_stock'
        AND order_id IS NULL
      ORDER BY created_at ASC
      LIMIT _item.quantity
      FOR UPDATE SKIP LOCKED
    ) sub;

    UPDATE public.inventory_units
    SET fulfillment_status = 'reserved',
        business_status = 'purchased',
        traveler_user_id = _order.user_id,
        order_id = _order_id::text,
        order_item_id = _item.item_id::text
    WHERE id = ANY(_unit_ids);

    _result := jsonb_set(_result, '{reserved}',
      (_result->'reserved') || jsonb_build_array(jsonb_build_object(
        'order_item_id', _item.item_id,
        'card_design_id', _item.card_design_id,
        'count', array_length(_unit_ids, 1)
      ))
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'details', _result);
END;
$function$;
