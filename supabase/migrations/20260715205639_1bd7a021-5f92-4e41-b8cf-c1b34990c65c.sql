
-- create_order: RPC wywoływane wyłącznie z edge function `create-payment` (service_role)
-- Funkcja i tak sprawdza auth.uid() wewnątrz, ale ograniczamy powierzchnię.
REVOKE EXECUTE ON FUNCTION public.create_order(jsonb, text, text, text, numeric, boolean, text, text, text)
  FROM PUBLIC, anon;

-- has_role: używane tylko po stronie serwera (edge functions z service_role)
-- oraz przez RLS wewnętrznie (SECURITY DEFINER omija grant sprawdzania). 
-- Klient nie ma powodu wołać tego RPC bezpośrednio.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)
  FROM PUBLIC, anon, authenticated;
