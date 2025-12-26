-- Create table for message reactions
CREATE TABLE public.campaign_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.campaign_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.campaign_message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reactions on messages they can see (campaign members)
CREATE POLICY "Campaign members can view message reactions"
ON public.campaign_message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_messages cm
    JOIN public.campaigns c ON c.id = cm.campaign_id
    LEFT JOIN public.campaign_players cp ON cp.campaign_id = c.id
    WHERE cm.id = message_id
    AND (c.master_id = auth.uid() OR cp.user_id = auth.uid())
  )
);

-- Policy: Users can add reactions to messages in their campaigns
CREATE POLICY "Campaign members can add reactions"
ON public.campaign_message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.campaign_messages cm
    JOIN public.campaigns c ON c.id = cm.campaign_id
    LEFT JOIN public.campaign_players cp ON cp.campaign_id = c.id
    WHERE cm.id = message_id
    AND (c.master_id = auth.uid() OR cp.user_id = auth.uid())
  )
);

-- Policy: Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
ON public.campaign_message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_message_reactions;