-- Allow players to update their own character_id in campaign_players
CREATE POLICY "Players can update own character"
ON public.campaign_players
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);