-- Create campaign_notes table for shared notes
CREATE TABLE public.campaign_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Users can view their own notes
CREATE POLICY "Users can view own notes"
ON public.campaign_notes
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- Users can view public notes in campaigns they're part of
CREATE POLICY "Users can view public notes in their campaigns"
ON public.campaign_notes
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND is_public = true
  AND (is_campaign_master(campaign_id, auth.uid()) OR is_campaign_member(campaign_id, auth.uid()))
);

-- Users can create notes in campaigns they're part of
CREATE POLICY "Users can create notes in their campaigns"
ON public.campaign_notes
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  AND (is_campaign_master(campaign_id, auth.uid()) OR is_campaign_member(campaign_id, auth.uid()))
);

-- Users can update their own notes
CREATE POLICY "Users can update own notes"
ON public.campaign_notes
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes"
ON public.campaign_notes
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_campaign_notes_updated_at
BEFORE UPDATE ON public.campaign_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();