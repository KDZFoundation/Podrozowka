
-- Restrict direct SELECT on sensitive recipient columns; force access via view/RPC
REVOKE SELECT (recipient_email, latitude, longitude) ON public.recipient_registrations FROM authenticated;
REVOKE SELECT (recipient_email, latitude, longitude) ON public.recipient_registrations FROM anon;

-- Ensure travelers can read the safe, opt-in aware view
GRANT SELECT ON public.traveler_registrations_view TO authenticated;
