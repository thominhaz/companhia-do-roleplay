-- Add reply_to_id column for message replies/quotes
ALTER TABLE public.campaign_messages 
ADD COLUMN reply_to_id uuid REFERENCES public.campaign_messages(id) ON DELETE SET NULL;

-- Add index for faster querying of replies
CREATE INDEX idx_campaign_messages_reply_to ON public.campaign_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;