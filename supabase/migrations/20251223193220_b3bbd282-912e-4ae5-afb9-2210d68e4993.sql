-- Allow campaign masters to view characters of their campaign players
CREATE POLICY "Masters can view campaign players characters"
ON public.characters
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.campaign_players cp
    JOIN public.campaigns c ON c.id = cp.campaign_id
    WHERE cp.character_id = characters.id
    AND c.master_id = auth.uid()
  )
);

-- Also allow campaign members to see characters of players in the same campaign
CREATE POLICY "Campaign members can view co-players characters"
ON public.characters
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.campaign_players cp1
    JOIN public.campaign_players cp2 ON cp1.campaign_id = cp2.campaign_id
    WHERE cp1.character_id = characters.id
    AND cp2.user_id = auth.uid()
  )
);