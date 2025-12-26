-- Add recipient_id column for private messages
ALTER TABLE public.campaign_messages 
ADD COLUMN recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for faster querying of private messages
CREATE INDEX idx_campaign_messages_recipient ON public.campaign_messages(recipient_id) WHERE recipient_id IS NOT NULL;

-- Drop existing policies to recreate with private message support
DROP POLICY IF EXISTS "Campaign members can view messages" ON public.campaign_messages;
DROP POLICY IF EXISTS "Campaign members can send messages" ON public.campaign_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.campaign_messages;

-- Create new policy for viewing messages (public messages OR private messages to/from the user)
CREATE POLICY "Campaign members can view messages"
ON public.campaign_messages
FOR SELECT
USING (
  (public.is_campaign_member(campaign_id, auth.uid()) OR public.is_campaign_master(campaign_id, auth.uid()))
  AND (
    recipient_id IS NULL -- Public message
    OR recipient_id = auth.uid() -- Message sent TO current user
    OR user_id = auth.uid() -- Message sent BY current user
  )
);

-- Create policy for sending messages (any campaign member can send)
CREATE POLICY "Campaign members can send messages"
ON public.campaign_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (public.is_campaign_member(campaign_id, auth.uid()) OR public.is_campaign_master(campaign_id, auth.uid()))
);

-- Create policy for deleting own messages
CREATE POLICY "Users can delete their own messages"
ON public.campaign_messages
FOR DELETE
USING (auth.uid() = user_id);