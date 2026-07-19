-- Create storage bucket for postcard photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('postcard-photos', 'postcard-photos', true);

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload postcard photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'postcard-photos');

-- Allow public to view photos
CREATE POLICY "Anyone can view postcard photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'postcard-photos');

-- Allow users to update their own photos
CREATE POLICY "Users can update their own postcard photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'postcard-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own postcard photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'postcard-photos' AND auth.uid()::text = (storage.foldername(name))[1]);