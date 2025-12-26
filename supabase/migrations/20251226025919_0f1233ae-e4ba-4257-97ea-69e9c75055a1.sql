-- Add index to campaign_documents for faster queries
CREATE INDEX IF NOT EXISTS idx_campaign_documents_campaign_id ON public.campaign_documents(campaign_id);

-- Add index to campaign_document_deliveries for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaign_document_deliveries_document_id ON public.campaign_document_deliveries(document_id);
CREATE INDEX IF NOT EXISTS idx_campaign_document_deliveries_character_id ON public.campaign_document_deliveries(character_id);