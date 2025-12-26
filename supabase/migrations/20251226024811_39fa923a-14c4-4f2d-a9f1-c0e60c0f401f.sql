-- Create campaign_documents table
CREATE TABLE public.campaign_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  document_type TEXT NOT NULL DEFAULT 'letter', -- 'letter', 'scroll', 'contract'
  style TEXT DEFAULT 'parchment', -- 'parchment', 'elegant', 'dark', 'royal'
  is_signed BOOLEAN DEFAULT false,
  signature_data JSONB DEFAULT '[]'::jsonb, -- Array of {character_id, character_name, signed_at}
  requires_signature BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document deliveries table (who received which document)
CREATE TABLE public.campaign_document_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.campaign_documents(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  delivered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(document_id, character_id)
);

-- Enable RLS
ALTER TABLE public.campaign_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_document_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_documents
CREATE POLICY "Masters can manage their campaign documents"
ON public.campaign_documents
FOR ALL
USING (public.is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Players can view documents delivered to them"
ON public.campaign_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_document_deliveries cdd
    JOIN public.characters c ON c.id = cdd.character_id
    WHERE cdd.document_id = campaign_documents.id
    AND c.user_id = auth.uid()
  )
);

-- RLS Policies for deliveries
CREATE POLICY "Masters can manage deliveries for their campaigns"
ON public.campaign_document_deliveries
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_documents cd
    WHERE cd.id = document_id
    AND public.is_campaign_master(cd.campaign_id, auth.uid())
  )
);

CREATE POLICY "Players can view and update their own deliveries"
ON public.campaign_document_deliveries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.characters c
    WHERE c.id = character_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Players can update their own deliveries"
ON public.campaign_document_deliveries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.characters c
    WHERE c.id = character_id AND c.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_campaign_documents_updated_at
BEFORE UPDATE ON public.campaign_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_document_deliveries;