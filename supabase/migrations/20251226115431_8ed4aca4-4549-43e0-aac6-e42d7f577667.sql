-- Create a table to track read receipts for campaign messages
CREATE TABLE public.campaign_message_read_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  other_user_id UUID, -- null means public chat, otherwise tracks private chat with specific user
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id, other_user_id)
);

-- Enable RLS
ALTER TABLE public.campaign_message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own read receipts
CREATE POLICY "Users can view own read receipts"
ON public.campaign_message_read_receipts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own read receipts
CREATE POLICY "Users can insert own read receipts"
ON public.campaign_message_read_receipts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own read receipts
CREATE POLICY "Users can update own read receipts"
ON public.campaign_message_read_receipts
FOR UPDATE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_read_receipts_user_campaign ON public.campaign_message_read_receipts(user_id, campaign_id);