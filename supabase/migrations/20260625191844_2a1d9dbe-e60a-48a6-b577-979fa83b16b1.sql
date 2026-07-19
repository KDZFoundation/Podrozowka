
-- Fix 1: recipient_registrations — drop traveler SELECT on base table; access only via traveler_registrations_view
DROP POLICY IF EXISTS "Travelers can view own registrations (limited)" ON public.recipient_registrations;

-- Fix 2: postcards — drop buyer SELECT policy that exposes recipient_email. Legacy table; admin-only.
DROP POLICY IF EXISTS "Buyers can view their own postcards" ON public.postcards;

-- Fix 3: storage buckets are intentionally public; add explicit public SELECT policies for clarity.
CREATE POLICY "Public read access to avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Public read access to postcard-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'postcard-photos');
