
CREATE OR REPLACE FUNCTION public.get_products_stock()
RETURNS TABLE(card_design_id uuid, in_stock int)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT iu.card_design_id, COUNT(*)::int AS in_stock
  FROM public.inventory_units iu
  JOIN public.card_designs cd ON cd.id = iu.card_design_id
  WHERE cd.active = true
    AND cd.price_grosze > 0
    AND iu.fulfillment_status = 'in_stock'
    AND iu.order_id IS NULL
  GROUP BY iu.card_design_id;
$$;

CREATE OR REPLACE FUNCTION public.get_product_stock(_id uuid)
RETURNS int
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.inventory_units iu
  JOIN public.card_designs cd ON cd.id = iu.card_design_id
  WHERE cd.id = _id
    AND cd.active = true
    AND cd.price_grosze > 0
    AND iu.fulfillment_status = 'in_stock'
    AND iu.order_id IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_products_stock() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_stock(uuid) TO anon, authenticated;
