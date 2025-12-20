-- Allow campaign members to view profiles of other campaign members
CREATE POLICY "Campaign members can view other members profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.campaign_players cp1
    JOIN public.campaign_players cp2 ON cp1.campaign_id = cp2.campaign_id
    WHERE cp1.user_id = auth.uid()
    AND cp2.user_id = profiles.id
  )
);