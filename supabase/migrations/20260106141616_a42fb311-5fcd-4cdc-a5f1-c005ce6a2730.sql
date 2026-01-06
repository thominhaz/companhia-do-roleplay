-- Create storage bucket for campaign whiteboard images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-images', 
  'campaign-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Allow campaign masters to upload images
CREATE POLICY "Campaign masters can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-images' 
  AND EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = (storage.foldername(name))[1]::uuid
    AND master_id = auth.uid()
  )
);

-- Allow anyone to view campaign images (public bucket)
CREATE POLICY "Anyone can view campaign images"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-images');

-- Allow campaign masters to delete their images
CREATE POLICY "Campaign masters can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'campaign-images' 
  AND EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = (storage.foldername(name))[1]::uuid
    AND master_id = auth.uid()
  )
);