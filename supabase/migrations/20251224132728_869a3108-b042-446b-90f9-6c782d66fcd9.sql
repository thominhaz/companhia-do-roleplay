-- Create storage bucket for campaign images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('campaign-images', 'campaign-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view campaign images (public bucket)
CREATE POLICY "Campaign images are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'campaign-images');

-- Policy: Authenticated users can upload images to campaign folders they have access to
CREATE POLICY "Campaign members can upload images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-images' 
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can update their own uploaded images
CREATE POLICY "Users can update own campaign images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'campaign-images' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Users can delete their own uploaded images, masters can delete any
CREATE POLICY "Users can delete own campaign images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'campaign-images' 
  AND auth.uid() IS NOT NULL
);