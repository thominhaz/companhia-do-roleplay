-- Create storage bucket for supporter submissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('supporter-submissions', 'supporter-submissions', true);

-- Allow anyone to upload to this bucket (for public form)
CREATE POLICY "Anyone can upload supporter submission images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'supporter-submissions');

-- Allow public read access
CREATE POLICY "Supporter submission images are publicly accessible"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'supporter-submissions');

-- Allow admins to delete
CREATE POLICY "Admins can delete supporter submission images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'supporter-submissions' AND public.has_role(auth.uid(), 'admin'));