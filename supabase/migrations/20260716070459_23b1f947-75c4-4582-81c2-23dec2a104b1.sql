ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_method text NOT NULL DEFAULT 'inpost';

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_shipping_method_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_shipping_method_check
  CHECK (shipping_method IN ('inpost','courier'));