-- Create storage bucket for document watermarks/seals
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-seals', 'document-seals', true);

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload document seals"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'document-seals' 
  AND auth.uid() IS NOT NULL
);

-- Allow public read access for document seals
CREATE POLICY "Document seals are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'document-seals');

-- Allow users to update their own seals
CREATE POLICY "Users can update their own document seals"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'document-seals' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to delete their own seals
CREATE POLICY "Users can delete their own document seals"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'document-seals' 
  AND auth.uid() IS NOT NULL
);