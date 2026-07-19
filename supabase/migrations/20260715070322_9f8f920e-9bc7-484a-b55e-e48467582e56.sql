DROP POLICY IF EXISTS "Admins can upload postcard photos to any folder" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update postcard photos in any folder" ON storage.objects;

CREATE POLICY "Admins can upload postcard photos to any folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'postcard-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update postcard photos in any folder"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'postcard-photos' AND public.has_role(auth.uid(), 'admin'));