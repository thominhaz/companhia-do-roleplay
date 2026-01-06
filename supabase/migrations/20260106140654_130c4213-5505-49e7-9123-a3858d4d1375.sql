
-- Create whiteboard elements table (1 whiteboard per campaign, embedded in campaign)
CREATE TABLE public.campaign_whiteboard_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL CHECK (element_type IN ('sticky_note', 'text', 'image', 'connection')),
  
  -- Position and size
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  y DOUBLE PRECISION NOT NULL DEFAULT 0,
  width DOUBLE PRECISION,
  height DOUBLE PRECISION,
  rotation DOUBLE PRECISION DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  
  -- Content
  content TEXT,
  image_url TEXT,
  
  -- Styling
  background_color TEXT DEFAULT '#fef08a',
  text_color TEXT DEFAULT '#1f2937',
  font_size INTEGER DEFAULT 14,
  
  -- Connection specific (for lines between elements)
  connection_from UUID REFERENCES public.campaign_whiteboard_elements(id) ON DELETE CASCADE,
  connection_to UUID REFERENCES public.campaign_whiteboard_elements(id) ON DELETE CASCADE,
  connection_style TEXT DEFAULT 'straight',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_whiteboard_elements_campaign ON public.campaign_whiteboard_elements(campaign_id);

-- Enable RLS
ALTER TABLE public.campaign_whiteboard_elements ENABLE ROW LEVEL SECURITY;

-- Only campaign master can manage whiteboard elements
CREATE POLICY "Masters can manage whiteboard elements"
ON public.campaign_whiteboard_elements
FOR ALL
USING (public.is_campaign_master(campaign_id, auth.uid()))
WITH CHECK (public.is_campaign_master(campaign_id, auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_whiteboard_elements_updated_at
BEFORE UPDATE ON public.campaign_whiteboard_elements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
