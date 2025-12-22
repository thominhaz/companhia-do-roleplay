-- Add policy allowing campaign members to view homebrew shares for their campaigns
CREATE POLICY "Campaign members can view campaign shares"
ON public.homebrew_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_players cp
    WHERE cp.campaign_id = homebrew_shares.campaign_id 
    AND cp.user_id = auth.uid()
  )
);