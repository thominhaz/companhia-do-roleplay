-- Adicionar campos para marca d'água nos documentos
ALTER TABLE public.campaign_documents 
ADD COLUMN IF NOT EXISTS watermark_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS watermark_text TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS watermark_image_url TEXT DEFAULT NULL;