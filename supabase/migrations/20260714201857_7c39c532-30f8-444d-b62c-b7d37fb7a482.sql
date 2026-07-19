CREATE POLICY "Admins can upload postcard photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'postcard-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update postcard photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'postcard-photos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'postcard-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete postcard photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'postcard-photos' AND public.has_role(auth.uid(), 'admin'));