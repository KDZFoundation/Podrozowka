
-- Fix #1, #4: Tighten profiles RLS — drop the overly-broad ranking SELECT policy.
-- "Users can view own profile" already exists and is correct. Public ranking
-- reads must go through the profiles_public view.
DROP POLICY IF EXISTS "Authenticated can view profiles for ranking" ON public.profiles;

-- Fix #8: profiles_public is not meant for anon; revoke that grant.
REVOKE SELECT ON public.profiles_public FROM anon;

-- Fix #2: Lock down direct INSERT to orders / order_items. From now on,
-- orders are created exclusively through the create_order RPC, which
-- computes price server-side from the catalog (no client manipulation).
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own order items" ON public.order_items;

CREATE OR REPLACE FUNCTION public.create_order(
  _items jsonb,
  _shipping_name text,
  _shipping_address text,
  _shipping_city text,
  _shipping_postal_code text,
  _shipping_country text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _order_id uuid;
  _item jsonb;
  _design_id uuid;
  _qty int;
  _unit_price numeric(10,2) := 9.99;
  _total numeric(10,2) := 0;
  _exists boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;
  IF jsonb_array_length(_items) > 100 THEN
    RAISE EXCEPTION 'Too many items';
  END IF;
  IF coalesce(length(_shipping_name), 0) = 0
     OR coalesce(length(_shipping_address), 0) = 0
     OR coalesce(length(_shipping_city), 0) = 0
     OR coalesce(length(_shipping_postal_code), 0) = 0
     OR coalesce(length(_shipping_country), 0) = 0 THEN
    RAISE EXCEPTION 'Shipping address required';
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _design_id := (_item->>'card_design_id')::uuid;
    _qty := (_item->>'quantity')::int;
    IF _qty IS NULL OR _qty < 1 OR _qty > 1000 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;
    SELECT EXISTS(SELECT 1 FROM public.card_designs WHERE id = _design_id AND active = true)
      INTO _exists;
    IF NOT _exists THEN
      RAISE EXCEPTION 'Invalid card_design_id';
    END IF;
    _total := _total + (_qty * _unit_price);
  END LOOP;

  INSERT INTO public.orders(
    user_id, total_amount,
    shipping_name, shipping_address, shipping_city, shipping_postal_code, shipping_country
  ) VALUES (
    _uid, _total,
    _shipping_name, _shipping_address, _shipping_city, _shipping_postal_code, _shipping_country
  )
  RETURNING id INTO _order_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _design_id := (_item->>'card_design_id')::uuid;
    _qty := (_item->>'quantity')::int;
    INSERT INTO public.order_items(order_id, card_design_id, quantity, unit_price, total_price)
    VALUES (_order_id, _design_id, _qty, _unit_price, _qty * _unit_price);
  END LOOP;

  RETURN jsonb_build_object('id', _order_id, 'total_amount', _total);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order(jsonb, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order(jsonb, text, text, text, text, text) TO authenticated;

-- Fix #11: Explicit Forbidden in admin RPC
CREATE OR REPLACE FUNCTION public.admin_list_recipient_registrations()
RETURNS SETOF public.recipient_registrations
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY SELECT * FROM public.recipient_registrations;
END;
$$;

-- Fix #3 + #5: Atomic register_recipient RPC (no race, saves lat/lon)
CREATE OR REPLACE FUNCTION public.register_recipient(
  _unit_id uuid,
  _recipient_name text,
  _recipient_message text,
  _recipient_email text,
  _contact_opt_in boolean,
  _latitude numeric,
  _longitude numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _status text;
BEGIN
  SELECT business_status INTO _status
  FROM public.inventory_units
  WHERE id = _unit_id
  FOR UPDATE;

  IF _status IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF _status = 'registered' THEN
    RAISE EXCEPTION 'already_registered';
  END IF;
  IF _status <> 'purchased' THEN
    RAISE EXCEPTION 'not_activated';
  END IF;

  INSERT INTO public.recipient_registrations(
    inventory_unit_id, recipient_name, recipient_message, recipient_email,
    contact_opt_in, latitude, longitude
  ) VALUES (
    _unit_id, _recipient_name, _recipient_message, _recipient_email,
    _contact_opt_in, _latitude, _longitude
  );

  UPDATE public.inventory_units
  SET business_status = 'registered', registered_at = now()
  WHERE id = _unit_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_recipient(uuid, text, text, text, boolean, numeric, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_recipient(uuid, text, text, text, boolean, numeric, numeric) TO service_role;
