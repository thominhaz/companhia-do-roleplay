-- Create campaign_messages table for real-time chat
CREATE TABLE public.campaign_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast message retrieval
CREATE INDEX idx_campaign_messages_campaign_id ON public.campaign_messages(campaign_id);
CREATE INDEX idx_campaign_messages_created_at ON public.campaign_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Campaign members can view messages
CREATE POLICY "Campaign members can view messages"
ON public.campaign_messages
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (is_campaign_master(campaign_id, auth.uid()) OR is_campaign_member(campaign_id, auth.uid()))
);

-- Campaign members can send messages
CREATE POLICY "Campaign members can send messages"
ON public.campaign_messages
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  AND (is_campaign_master(campaign_id, auth.uid()) OR is_campaign_member(campaign_id, auth.uid()))
);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.campaign_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_messages;