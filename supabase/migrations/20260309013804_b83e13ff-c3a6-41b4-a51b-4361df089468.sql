-- Create a view that masks recipient_email when contact_opt_in is false
-- This enforces privacy at the database level, preventing API bypasses
CREATE OR REPLACE VIEW public.traveler_registrations_view
WITH (security_invoker = true) AS
SELECT
  id,
  inventory_unit_id,
  recipient_name,
  recipient_message,
  CASE WHEN contact_opt_in = true THEN recipient_email ELSE NULL END AS recipient_email,
  contact_opt_in,
  registered_at,
  latitude,
  longitude,
  created_at
FROM public.recipient_registrations;