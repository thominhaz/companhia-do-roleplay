-- Corrigir política de campanhas: apenas membros ou mestre podem ver
DROP POLICY IF EXISTS "Anyone can view campaigns" ON public.campaigns;

CREATE POLICY "Members can view campaigns" ON public.campaigns
  FOR SELECT USING (
    auth.uid() = master_id OR
    EXISTS (
      SELECT 1 FROM public.campaign_players 
      WHERE campaign_id = campaigns.id AND user_id = auth.uid()
    )
  );

-- Corrigir política de membros: apenas membros da campanha podem ver
DROP POLICY IF EXISTS "Users can view campaign players" ON public.campaign_players;

CREATE POLICY "Campaign members can view players" ON public.campaign_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND master_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.campaign_players cp
      WHERE cp.campaign_id = campaign_players.campaign_id AND cp.user_id = auth.uid()
    )
  );

-- Proteger subscriptions: apenas service role pode modificar
CREATE POLICY "No user insert on subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No user update on subscriptions" ON public.subscriptions
  FOR UPDATE USING (false);

CREATE POLICY "No user delete on subscriptions" ON public.subscriptions
  FOR DELETE USING (false);