
-- Function to reserve inventory units for a paid order
-- Returns JSON with success status and details
CREATE OR REPLACE FUNCTION public.reserve_inventory_for_order(_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order RECORD;
  _item RECORD;
  _reserved_count INTEGER;
  _available_count INTEGER;
  _unit_ids UUID[];
  _result JSONB := '{"reserved": []}'::jsonb;
  _errors JSONB := '[]'::jsonb;
BEGIN
  -- Get order and validate
  SELECT * INTO _order FROM public.orders WHERE id = _order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Zamówienie nie istnieje');
  END IF;
  
  IF _order.payment_status != 'paid' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Zamówienie nie jest opłacone');
  END IF;

  -- Check if already reserved
  SELECT COUNT(*) INTO _reserved_count
  FROM public.inventory_units
  WHERE order_id = _order_id::text;
  
  IF _reserved_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Zamówienie ma już zarezerwowane sztuki (' || _reserved_count || ')');
  END IF;

  -- Loop through order items
  FOR _item IN
    SELECT oi.id AS item_id, oi.card_design_id, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = _order_id
  LOOP
    -- Check availability
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

  -- If any errors, abort
  IF jsonb_array_length(_errors) > 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Brak wystarczającej ilości sztuk w magazynie',
      'shortages', _errors
    );
  END IF;

  -- All checks passed, reserve units
  FOR _item IN
    SELECT oi.id AS item_id, oi.card_design_id, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = _order_id
  LOOP
    -- Select and lock units
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

    -- Update units
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
$$;
