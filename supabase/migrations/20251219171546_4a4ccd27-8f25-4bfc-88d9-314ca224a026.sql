-- Corrigir profiles: exigir autenticação
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Corrigir subscriptions: exigir autenticação
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Corrigir characters: exigir autenticação
DROP POLICY IF EXISTS "Users can view own characters" ON public.characters;
CREATE POLICY "Users can view own characters" ON public.characters
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create characters with limit" ON public.characters;
CREATE POLICY "Users can create characters with limit" ON public.characters
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id AND public.can_create_character(auth.uid()));

DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;
CREATE POLICY "Users can update own characters" ON public.characters
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own characters" ON public.characters;
CREATE POLICY "Users can delete own characters" ON public.characters
  FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Corrigir campaigns: exigir autenticação
DROP POLICY IF EXISTS "Members can view campaigns" ON public.campaigns;
CREATE POLICY "Members can view campaigns" ON public.campaigns
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = master_id OR
      EXISTS (
        SELECT 1 FROM public.campaign_players 
        WHERE campaign_id = campaigns.id AND user_id = auth.uid()
      )
    )
  );

-- Corrigir campaign_players: exigir autenticação
DROP POLICY IF EXISTS "Campaign members can view players" ON public.campaign_players;
CREATE POLICY "Campaign members can view players" ON public.campaign_players
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.campaigns 
        WHERE id = campaign_id AND master_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.campaign_players cp
        WHERE cp.campaign_id = campaign_players.campaign_id AND cp.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can join campaigns" ON public.campaign_players;
CREATE POLICY "Users can join campaigns" ON public.campaign_players
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave campaigns" ON public.campaign_players;
CREATE POLICY "Users can leave campaigns" ON public.campaign_players
  FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Corrigir sessions: exigir autenticação
DROP POLICY IF EXISTS "Users can view sessions of campaigns they are in" ON public.sessions;
CREATE POLICY "Users can view sessions of campaigns they are in" ON public.sessions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.campaign_players 
        WHERE campaign_id = sessions.campaign_id AND user_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM public.campaigns 
        WHERE id = sessions.campaign_id AND master_id = auth.uid()
      )
    )
  );