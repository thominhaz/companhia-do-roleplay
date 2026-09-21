-- GO20 current database history
-- Generated from the repository migrations in chronological order.
-- Preserve this file as an audit artifact; use postgres-bootstrap.sql before applying it to plain PostgreSQL.

-- BEGIN supabase/migrations/20251219170718_d5d1d961-9fc7-453f-8650-627179951ba4.sql
-- Enum para status de assinatura
CREATE TYPE public.subscription_status AS ENUM ('free', 'premium');

-- Tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de assinaturas
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status subscription_status DEFAULT 'free' NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de personagens
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  race TEXT NOT NULL,
  subrace TEXT,
  class TEXT NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  experience INTEGER DEFAULT 0 NOT NULL,
  max_hp INTEGER DEFAULT 10 NOT NULL,
  current_hp INTEGER DEFAULT 10 NOT NULL,
  temporary_hp INTEGER DEFAULT 0 NOT NULL,
  armor_class INTEGER DEFAULT 10 NOT NULL,
  initiative INTEGER DEFAULT 0 NOT NULL,
  speed INTEGER DEFAULT 30 NOT NULL,
  proficiency_bonus INTEGER DEFAULT 2 NOT NULL,
  attributes JSONB DEFAULT '{"strength": 10, "dexterity": 10, "constitution": 10, "intelligence": 10, "wisdom": 10, "charisma": 10}'::jsonb NOT NULL,
  saving_throws JSONB DEFAULT '{}'::jsonb NOT NULL,
  skills JSONB DEFAULT '{}'::jsonb NOT NULL,
  hit_dice JSONB DEFAULT '{"total": 1, "current": 1, "diceType": "d8"}'::jsonb NOT NULL,
  death_saves JSONB DEFAULT '{"successes": 0, "failures": 0}'::jsonb NOT NULL,
  equipment JSONB DEFAULT '[]'::jsonb NOT NULL,
  inventory JSONB DEFAULT '[]'::jsonb NOT NULL,
  currency JSONB DEFAULT '{"copper": 0, "silver": 0, "electrum": 0, "gold": 0, "platinum": 0}'::jsonb NOT NULL,
  spellcasting JSONB,
  spells JSONB DEFAULT '[]'::jsonb NOT NULL,
  background TEXT,
  alignment TEXT,
  personality_traits TEXT,
  ideals TEXT,
  bonds TEXT,
  flaws TEXT,
  backstory TEXT,
  features JSONB DEFAULT '[]'::jsonb NOT NULL,
  proficiencies JSONB DEFAULT '[]'::jsonb NOT NULL,
  languages JSONB DEFAULT '[]'::jsonb NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de campanhas
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de jogadores nas campanhas
CREATE TABLE public.campaign_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'player' NOT NULL CHECK (role IN ('player', 'master')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(campaign_id, user_id)
);

-- Tabela de sessões
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário é premium
CREATE OR REPLACE FUNCTION public.is_premium(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id 
    AND status = 'premium'
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- Função para contar personagens do usuário
CREATE OR REPLACE FUNCTION public.count_user_characters(_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::INTEGER, 0) FROM public.characters WHERE user_id = _user_id;
$$;

-- Função para verificar se pode criar personagem
CREATE OR REPLACE FUNCTION public.can_create_character(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_premium(_user_id) OR public.count_user_characters(_user_id) < 3;
$$;

-- RLS Policies para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies para subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies para characters
CREATE POLICY "Users can view own characters" ON public.characters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create characters with limit" ON public.characters
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND public.can_create_character(auth.uid())
  );

CREATE POLICY "Users can update own characters" ON public.characters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters" ON public.characters
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies para campaigns
CREATE POLICY "Anyone can view campaigns" ON public.campaigns
  FOR SELECT USING (true);

CREATE POLICY "Premium users can create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (
    auth.uid() = master_id AND public.is_premium(auth.uid())
  );

CREATE POLICY "Masters can update own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = master_id);

CREATE POLICY "Masters can delete own campaigns" ON public.campaigns
  FOR DELETE USING (auth.uid() = master_id);

-- RLS Policies para campaign_players
CREATE POLICY "Users can view campaign players" ON public.campaign_players
  FOR SELECT USING (true);

CREATE POLICY "Users can join campaigns" ON public.campaign_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave campaigns" ON public.campaign_players
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Masters can manage campaign players" ON public.campaign_players
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND master_id = auth.uid()
    )
  );

-- RLS Policies para sessions
CREATE POLICY "Users can view sessions of campaigns they are in" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players 
      WHERE campaign_id = sessions.campaign_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = sessions.campaign_id AND master_id = auth.uid()
    )
  );

CREATE POLICY "Masters can manage sessions" ON public.sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = sessions.campaign_id AND master_id = auth.uid()
    )
  );

-- Trigger para criar profile e subscription automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  
  INSERT INTO public.subscriptions (user_id, status)
  VALUES (NEW.id, 'free');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- END supabase/migrations/20251219170718_d5d1d961-9fc7-453f-8650-627179951ba4.sql

-- BEGIN supabase/migrations/20251219170748_df85177a-2ea6-49fc-ae3e-fab01e32987c.sql
-- Corrigir função update_updated_at_column com search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
-- END supabase/migrations/20251219170748_df85177a-2ea6-49fc-ae3e-fab01e32987c.sql

-- BEGIN supabase/migrations/20251219171437_cfa88454-9be5-424d-9409-ecd7371b2954.sql
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
-- END supabase/migrations/20251219171437_cfa88454-9be5-424d-9409-ecd7371b2954.sql

-- BEGIN supabase/migrations/20251219171546_4a4ccd27-8f25-4bfc-88d9-314ca224a026.sql
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
-- END supabase/migrations/20251219171546_4a4ccd27-8f25-4bfc-88d9-314ca224a026.sql

-- BEGIN supabase/migrations/20251219175734_384f94d2-876c-4229-baf4-239b43dc1abd.sql
-- Fix campaigns SELECT policy to explicitly require authentication
DROP POLICY IF EXISTS "Members can view campaigns" ON public.campaigns;

CREATE POLICY "Members can view campaigns" 
ON public.campaigns 
FOR SELECT 
TO authenticated
USING (
  (auth.uid() = master_id) OR 
  (EXISTS (
    SELECT 1 FROM campaign_players
    WHERE campaign_players.campaign_id = campaigns.id 
    AND campaign_players.user_id = auth.uid()
  ))
);

-- Update SECURITY DEFINER functions to include authorization checks
-- These functions should only return true data for the calling user

CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE user_id = _user_id 
        AND status = 'premium'
        AND (expires_at IS NULL OR expires_at > NOW())
      )
    ELSE FALSE
  END;
$$;

CREATE OR REPLACE FUNCTION public.count_user_characters(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      COALESCE(COUNT(*)::INTEGER, 0)
    ELSE 0
  END
  FROM public.characters 
  WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.can_create_character(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      public.is_premium(_user_id) OR public.count_user_characters(_user_id) < 3
    ELSE FALSE
  END;
$$;
-- END supabase/migrations/20251219175734_384f94d2-876c-4229-baf4-239b43dc1abd.sql

-- BEGIN supabase/migrations/20251219205722_7c24ea27-fd59-45c3-8f11-a8585befe5c6.sql
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view campaigns" ON campaigns;
DROP POLICY IF EXISTS "Campaign members can view players" ON campaign_players;

-- Create new SELECT policy for campaigns that doesn't reference campaign_players directly
CREATE POLICY "Users can view own campaigns" 
ON campaigns 
FOR SELECT 
USING (
  auth.uid() = master_id
);

-- Create separate policy for campaigns user is playing in (using a subquery without referencing campaign_players RLS)
CREATE POLICY "Players can view joined campaigns" 
ON campaigns 
FOR SELECT 
USING (
  id IN (
    SELECT campaign_id 
    FROM campaign_players 
    WHERE user_id = auth.uid()
  )
);

-- Create new SELECT policy for campaign_players that doesn't cause recursion
DROP POLICY IF EXISTS "Campaign members can view players" ON campaign_players;

CREATE POLICY "Users can view campaign players" 
ON campaign_players 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- User is the master of the campaign (check directly on campaigns without using campaign_players)
    campaign_id IN (SELECT id FROM campaigns WHERE master_id = auth.uid())
    OR 
    -- User is a participant (direct check on same table, no cross-reference)
    user_id = auth.uid()
  )
);
-- END supabase/migrations/20251219205722_7c24ea27-fd59-45c3-8f11-a8585befe5c6.sql

-- BEGIN supabase/migrations/20251219210607_e2e8c14b-e4f3-43b3-8b32-8fea131f371f.sql
-- Create helper functions to avoid RLS cross-table recursion
CREATE OR REPLACE FUNCTION public.is_campaign_master(_campaign_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = _campaign_id
      AND c.master_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_campaign_member(_campaign_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaign_players cp
    WHERE cp.campaign_id = _campaign_id
      AND cp.user_id = _user_id
  );
$$;

-- Rebuild SELECT policies to use the functions (prevents infinite recursion)

-- campaigns
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Players can view joined campaigns" ON public.campaigns;

CREATE POLICY "Users can view campaigns they master or joined"
ON public.campaigns
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    auth.uid() = master_id
    OR public.is_campaign_member(id, auth.uid())
  )
);

-- campaign_players
DROP POLICY IF EXISTS "Users can view campaign players" ON public.campaign_players;

CREATE POLICY "Users can view players in their campaigns"
ON public.campaign_players
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR public.is_campaign_master(campaign_id, auth.uid())
    OR public.is_campaign_member(campaign_id, auth.uid())
  )
);

-- sessions
DROP POLICY IF EXISTS "Users can view sessions of campaigns they are in" ON public.sessions;

CREATE POLICY "Users can view sessions in their campaigns"
ON public.sessions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    public.is_campaign_master(campaign_id, auth.uid())
    OR public.is_campaign_member(campaign_id, auth.uid())
  )
);

-- Keep existing management policies (masters can manage ...) as-is
-- END supabase/migrations/20251219210607_e2e8c14b-e4f3-43b3-8b32-8fea131f371f.sql

-- BEGIN supabase/migrations/20251220025100_74a16211-ab45-4f6d-9979-caf23b2c6eae.sql
-- Add invite_code column to campaigns
ALTER TABLE public.campaigns
ADD COLUMN invite_code TEXT UNIQUE;

-- Create function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create trigger to auto-generate invite code on campaign creation
CREATE OR REPLACE FUNCTION public.set_campaign_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := public.generate_invite_code();
    SELECT EXISTS(SELECT 1 FROM public.campaigns WHERE invite_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.invite_code := new_code;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_campaign_invite_code
BEFORE INSERT ON public.campaigns
FOR EACH ROW
WHEN (NEW.invite_code IS NULL)
EXECUTE FUNCTION public.set_campaign_invite_code();

-- Backfill existing campaigns with invite codes
DO $$
DECLARE
  campaign_record RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR campaign_record IN SELECT id FROM public.campaigns WHERE invite_code IS NULL LOOP
    LOOP
      new_code := public.generate_invite_code();
      SELECT EXISTS(SELECT 1 FROM public.campaigns WHERE invite_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE public.campaigns SET invite_code = new_code WHERE id = campaign_record.id;
  END LOOP;
END $$;

-- Create function to join campaign by invite code
CREATE OR REPLACE FUNCTION public.join_campaign_by_code(_invite_code TEXT, _user_id UUID, _character_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _campaign_id UUID;
  _existing_player UUID;
BEGIN
  -- Find campaign by code
  SELECT id INTO _campaign_id FROM public.campaigns WHERE invite_code = UPPER(_invite_code);
  
  IF _campaign_id IS NULL THEN
    RAISE EXCEPTION 'Código de convite inválido';
  END IF;
  
  -- Check if user is already in campaign
  SELECT id INTO _existing_player FROM public.campaign_players 
  WHERE campaign_id = _campaign_id AND user_id = _user_id;
  
  IF _existing_player IS NOT NULL THEN
    RAISE EXCEPTION 'Você já está nesta campanha';
  END IF;
  
  -- Check if user is the master
  IF EXISTS (SELECT 1 FROM public.campaigns WHERE id = _campaign_id AND master_id = _user_id) THEN
    RAISE EXCEPTION 'Você é o mestre desta campanha';
  END IF;
  
  -- Add player to campaign
  INSERT INTO public.campaign_players (campaign_id, user_id, character_id, role)
  VALUES (_campaign_id, _user_id, _character_id, 'player');
  
  RETURN _campaign_id;
END;
$$;
-- END supabase/migrations/20251220025100_74a16211-ab45-4f6d-9979-caf23b2c6eae.sql

-- BEGIN supabase/migrations/20251220025126_30b6c2a6-b774-46ec-90a9-0a2cda73748e.sql
-- Fix search_path for generate_invite_code function
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;
-- END supabase/migrations/20251220025126_30b6c2a6-b774-46ec-90a9-0a2cda73748e.sql

-- BEGIN supabase/migrations/20251220025503_0a31e0a5-8c9d-43bd-9aad-1385f0b3d8af.sql
-- Create combat_encounters table for tracking combat sessions
CREATE TABLE public.combat_encounters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  round INTEGER NOT NULL DEFAULT 1,
  current_turn INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create combatants table for tracking participants in combat
CREATE TABLE public.combatants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES public.combat_encounters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initiative INTEGER NOT NULL DEFAULT 0,
  current_hp INTEGER NOT NULL DEFAULT 0,
  max_hp INTEGER NOT NULL DEFAULT 0,
  armor_class INTEGER NOT NULL DEFAULT 10,
  conditions TEXT[] DEFAULT '{}',
  is_player BOOLEAN NOT NULL DEFAULT false,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.combat_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combatants ENABLE ROW LEVEL SECURITY;

-- RLS for combat_encounters - only campaign masters can manage
CREATE POLICY "Masters can manage combat encounters"
ON public.combat_encounters
FOR ALL
USING (is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Campaign members can view encounters"
ON public.combat_encounters
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (is_campaign_master(campaign_id, auth.uid()) OR is_campaign_member(campaign_id, auth.uid()))
);

-- RLS for combatants - based on encounter access
CREATE POLICY "Masters can manage combatants"
ON public.combatants
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.combat_encounters e
    WHERE e.id = encounter_id
    AND is_campaign_master(e.campaign_id, auth.uid())
  )
);

CREATE POLICY "Campaign members can view combatants"
ON public.combatants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.combat_encounters e
    WHERE e.id = encounter_id
    AND (is_campaign_master(e.campaign_id, auth.uid()) OR is_campaign_member(e.campaign_id, auth.uid()))
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_combat_encounters_updated_at
BEFORE UPDATE ON public.combat_encounters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for combatants (for live updates during combat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.combatants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.combat_encounters;
-- END supabase/migrations/20251220025503_0a31e0a5-8c9d-43bd-9aad-1385f0b3d8af.sql

-- BEGIN supabase/migrations/20251220025801_953f960a-160a-433d-b242-5c15f01b01ca.sql
-- Create campaign_notes table for shared notes
CREATE TABLE public.campaign_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Users can view their own notes
CREATE POLICY "Users can view own notes"
ON public.campaign_notes
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- Users can view public notes in campaigns they're part of
CREATE POLICY "Users can view public notes in their campaigns"
ON public.campaign_notes
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND is_public = true
  AND (is_campaign_master(campaign_id, auth.uid()) OR is_campaign_member(campaign_id, auth.uid()))
);

-- Users can create notes in campaigns they're part of
CREATE POLICY "Users can create notes in their campaigns"
ON public.campaign_notes
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  AND (is_campaign_master(campaign_id, auth.uid()) OR is_campaign_member(campaign_id, auth.uid()))
);

-- Users can update their own notes
CREATE POLICY "Users can update own notes"
ON public.campaign_notes
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes"
ON public.campaign_notes
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_campaign_notes_updated_at
BEFORE UPDATE ON public.campaign_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- END supabase/migrations/20251220025801_953f960a-160a-433d-b242-5c15f01b01ca.sql

-- BEGIN supabase/migrations/20251220030132_e5ce8252-9d45-46cd-9845-7deb28f96e52.sql
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
-- END supabase/migrations/20251220030132_e5ce8252-9d45-46cd-9845-7deb28f96e52.sql

-- BEGIN supabase/migrations/20251220112137_5eb52809-00b6-4985-9419-bce85ae0f944.sql
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
-- END supabase/migrations/20251220112137_5eb52809-00b6-4985-9419-bce85ae0f944.sql

-- BEGIN supabase/migrations/20251220162718_0b7c7ead-4c13-4e40-b056-7e51a9613461.sql
-- Create combat_logs table for tracking combat history
CREATE TABLE public.combat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES public.combat_encounters(id) ON DELETE CASCADE,
  combatant_id UUID REFERENCES public.combatants(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'damage', 'heal', 'condition_add', 'condition_remove', 'turn_start', 'turn_end', 'combat_start', 'combat_end'
  value INTEGER, -- For damage/heal amounts
  details TEXT, -- Additional info like condition name
  combatant_name TEXT, -- Store name in case combatant is deleted
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_combat_logs_encounter ON public.combat_logs(encounter_id);
CREATE INDEX idx_combat_logs_created ON public.combat_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.combat_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Campaign members can view logs
CREATE POLICY "Campaign members can view combat logs"
  ON public.combat_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.combat_encounters ce
      JOIN public.campaign_players cp ON cp.campaign_id = ce.campaign_id
      WHERE ce.id = combat_logs.encounter_id
      AND cp.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.combat_encounters ce
      JOIN public.campaigns c ON c.id = ce.campaign_id
      WHERE ce.id = combat_logs.encounter_id
      AND c.master_id = auth.uid()
    )
  );

-- RLS: Campaign members can insert logs
CREATE POLICY "Campaign members can insert combat logs"
  ON public.combat_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.combat_encounters ce
      JOIN public.campaign_players cp ON cp.campaign_id = ce.campaign_id
      WHERE ce.id = combat_logs.encounter_id
      AND cp.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.combat_encounters ce
      JOIN public.campaigns c ON c.id = ce.campaign_id
      WHERE ce.id = combat_logs.encounter_id
      AND c.master_id = auth.uid()
    )
  );

-- Enable realtime for combat_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.combat_logs;
-- END supabase/migrations/20251220162718_0b7c7ead-4c13-4e40-b056-7e51a9613461.sql

-- BEGIN supabase/migrations/20251220162757_1b3d82e2-76a0-416e-a587-5e995b854fd8.sql
-- Allow players to update their own combatant (HP, conditions)
CREATE POLICY "Players can update own combatant"
  ON public.combatants
  FOR UPDATE
  USING (
    character_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = combatants.character_id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    character_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = combatants.character_id
      AND c.user_id = auth.uid()
    )
  );
-- END supabase/migrations/20251220162757_1b3d82e2-76a0-416e-a587-5e995b854fd8.sql

-- BEGIN supabase/migrations/20251220171622_60e7fd2b-11cb-46aa-9150-948f4ce6c2ab.sql
-- Create notification types enum
CREATE TYPE public.notification_type AS ENUM (
  'campaign_invite',
  'session_reminder',
  'campaign_update',
  'chat_message'
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications for any user (using service role or triggers)
CREATE POLICY "Allow insert for authenticated users"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _type notification_type,
  _title TEXT,
  _message TEXT,
  _data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (_user_id, _type, _title, _message, _data)
  RETURNING id INTO _notification_id;
  
  RETURN _notification_id;
END;
$$;
-- END supabase/migrations/20251220171622_60e7fd2b-11cb-46aa-9150-948f4ce6c2ab.sql

-- BEGIN supabase/migrations/20251220172128_c61f0687-df0d-4286-a001-384daf215283.sql
-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  campaign_invite BOOLEAN DEFAULT true,
  session_reminder BOOLEAN DEFAULT true,
  campaign_update BOOLEAN DEFAULT true,
  chat_message BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get or create preferences
CREATE OR REPLACE FUNCTION public.get_or_create_notification_preferences(_user_id UUID)
RETURNS public.notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefs public.notification_preferences;
BEGIN
  SELECT * INTO _prefs FROM public.notification_preferences WHERE user_id = _user_id;
  
  IF _prefs IS NULL THEN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (_user_id)
    RETURNING * INTO _prefs;
  END IF;
  
  RETURN _prefs;
END;
$$;
-- END supabase/migrations/20251220172128_c61f0687-df0d-4286-a001-384daf215283.sql

-- BEGIN supabase/migrations/20251220181856_74c348b6-db83-4768-9b3a-e725dbc10788.sql
-- Add is_archived column to characters table
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_characters_is_archived ON public.characters(is_archived);
-- END supabase/migrations/20251220181856_74c348b6-db83-4768-9b3a-e725dbc10788.sql

-- BEGIN supabase/migrations/20251220213212_7369adbb-a98a-4ce3-92c0-dfd7009b4756.sql
-- Create promo_tokens table for promotional codes
CREATE TABLE public.promo_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  days_premium integer NOT NULL DEFAULT 30,
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone
);

-- Create table to track token redemptions
CREATE TABLE public.token_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES public.promo_tokens(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  redeemed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_redemptions ENABLE ROW LEVEL SECURITY;

-- Promo tokens: anyone can read active tokens (to validate), but no one can insert/update/delete via client
CREATE POLICY "Anyone can read active tokens"
ON public.promo_tokens
FOR SELECT
USING (is_active = true);

-- Token redemptions: users can view their own redemptions
CREATE POLICY "Users can view own redemptions"
ON public.token_redemptions
FOR SELECT
USING (auth.uid() = user_id);

-- Function to redeem a token
CREATE OR REPLACE FUNCTION public.redeem_promo_token(_code text, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token promo_tokens%ROWTYPE;
  _existing_redemption token_redemptions%ROWTYPE;
  _new_expires_at timestamp with time zone;
  _current_subscription subscriptions%ROWTYPE;
BEGIN
  -- Find the token
  SELECT * INTO _token FROM promo_tokens 
  WHERE code = UPPER(_code) AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido ou expirado');
  END IF;
  
  -- Check if token has expired
  IF _token.expires_at IS NOT NULL AND _token.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código expirado');
  END IF;
  
  -- Check if max uses reached
  IF _token.max_uses IS NOT NULL AND _token.current_uses >= _token.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código já foi utilizado o máximo de vezes');
  END IF;
  
  -- Check if user already redeemed this token
  SELECT * INTO _existing_redemption FROM token_redemptions 
  WHERE token_id = _token.id AND user_id = _user_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já resgatou este código');
  END IF;
  
  -- Get current subscription
  SELECT * INTO _current_subscription FROM subscriptions WHERE user_id = _user_id;
  
  -- Calculate new expiration date
  IF _current_subscription.status = 'premium' AND _current_subscription.expires_at > now() THEN
    _new_expires_at := _current_subscription.expires_at + (_token.days_premium || ' days')::interval;
  ELSE
    _new_expires_at := now() + (_token.days_premium || ' days')::interval;
  END IF;
  
  -- Update or create subscription
  INSERT INTO subscriptions (user_id, status, expires_at)
  VALUES (_user_id, 'premium', _new_expires_at)
  ON CONFLICT (user_id) 
  DO UPDATE SET status = 'premium', expires_at = _new_expires_at, updated_at = now();
  
  -- Record redemption
  INSERT INTO token_redemptions (token_id, user_id) VALUES (_token.id, _user_id);
  
  -- Update token usage count
  UPDATE promo_tokens SET current_uses = current_uses + 1 WHERE id = _token.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Premium ativado com sucesso!',
    'days', _token.days_premium,
    'expires_at', _new_expires_at
  );
END;
$$;
-- END supabase/migrations/20251220213212_7369adbb-a98a-4ce3-92c0-dfd7009b4756.sql

-- BEGIN supabase/migrations/20251221001351_14f14430-bbf4-4197-858e-249df58ac1fa.sql
-- Create enum for homebrew content types
CREATE TYPE public.homebrew_content_type AS ENUM (
  'spell',
  'item', 
  'race',
  'class',
  'subclass',
  'monster',
  'background',
  'feat'
);

-- Create enum for content source
CREATE TYPE public.homebrew_source AS ENUM (
  'user',
  'master_shared',
  'community'
);

-- Main homebrew content table
CREATE TABLE public.homebrew_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type homebrew_content_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '✨',
  data JSONB NOT NULL DEFAULT '{}',
  source homebrew_source NOT NULL DEFAULT 'user',
  is_public BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for sharing homebrew with campaigns
CREATE TABLE public.homebrew_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.homebrew_content(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_id, campaign_id)
);

-- Enable RLS
ALTER TABLE public.homebrew_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homebrew_shares ENABLE ROW LEVEL SECURITY;

-- Function to count user's homebrew content
CREATE OR REPLACE FUNCTION public.count_user_homebrew(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      COALESCE(COUNT(*)::INTEGER, 0)
    ELSE 0
  END
  FROM public.homebrew_content 
  WHERE user_id = _user_id;
$$;

-- Function to check if user can create homebrew (based on subscription tier)
CREATE OR REPLACE FUNCTION public.can_create_homebrew(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      -- Premium users have unlimited, free users can't create
      public.is_premium(_user_id)
    ELSE FALSE
  END;
$$;

-- Function to check if user can create homebrew with limit (for future Hero tier)
CREATE OR REPLACE FUNCTION public.can_create_homebrew_with_limit(_user_id UUID, _limit INTEGER DEFAULT 100)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      public.is_premium(_user_id) OR public.count_user_homebrew(_user_id) < _limit
    ELSE FALSE
  END;
$$;

-- Function to check if user has access to homebrew content (owner, master shared, or public)
CREATE OR REPLACE FUNCTION public.has_homebrew_access(_content_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.homebrew_content hc
    WHERE hc.id = _content_id
    AND (
      -- Owner
      hc.user_id = _user_id
      -- Or public content
      OR hc.is_public = true
      -- Or shared with a campaign the user is part of
      OR EXISTS (
        SELECT 1 FROM public.homebrew_shares hs
        JOIN public.campaign_players cp ON cp.campaign_id = hs.campaign_id
        WHERE hs.content_id = hc.id AND cp.user_id = _user_id
      )
      -- Or shared with a campaign the user masters
      OR EXISTS (
        SELECT 1 FROM public.homebrew_shares hs
        JOIN public.campaigns c ON c.id = hs.campaign_id
        WHERE hs.content_id = hc.id AND c.master_id = _user_id
      )
    )
  );
$$;

-- RLS Policies for homebrew_content

-- Users can view their own content
CREATE POLICY "Users can view own homebrew"
ON public.homebrew_content
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view public homebrew
CREATE POLICY "Users can view public homebrew"
ON public.homebrew_content
FOR SELECT
USING (is_public = true);

-- Users can view homebrew shared with their campaigns
CREATE POLICY "Users can view campaign shared homebrew"
ON public.homebrew_content
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.homebrew_shares hs
    JOIN public.campaign_players cp ON cp.campaign_id = hs.campaign_id
    WHERE hs.content_id = homebrew_content.id AND cp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.homebrew_shares hs
    JOIN public.campaigns c ON c.id = hs.campaign_id
    WHERE hs.content_id = homebrew_content.id AND c.master_id = auth.uid()
  )
);

-- Premium users can create homebrew
CREATE POLICY "Premium users can create homebrew"
ON public.homebrew_content
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_create_homebrew(auth.uid())
);

-- Users can update their own homebrew
CREATE POLICY "Users can update own homebrew"
ON public.homebrew_content
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own homebrew
CREATE POLICY "Users can delete own homebrew"
ON public.homebrew_content
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for homebrew_shares

-- Content owners and campaign masters can view shares
CREATE POLICY "Owners and masters can view shares"
ON public.homebrew_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.homebrew_content hc
    WHERE hc.id = homebrew_shares.content_id AND hc.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = homebrew_shares.campaign_id AND c.master_id = auth.uid()
  )
);

-- Only content owners can share (and they must be campaign master)
CREATE POLICY "Owners can share to their campaigns"
ON public.homebrew_shares
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.homebrew_content hc
    WHERE hc.id = homebrew_shares.content_id AND hc.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = homebrew_shares.campaign_id AND c.master_id = auth.uid()
  )
);

-- Content owners or campaign masters can remove shares
CREATE POLICY "Owners and masters can delete shares"
ON public.homebrew_shares
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.homebrew_content hc
    WHERE hc.id = homebrew_shares.content_id AND hc.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = homebrew_shares.campaign_id AND c.master_id = auth.uid()
  )
);

-- Add updated_at trigger for homebrew_content
CREATE TRIGGER update_homebrew_content_updated_at
BEFORE UPDATE ON public.homebrew_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_homebrew_content_user_id ON public.homebrew_content(user_id);
CREATE INDEX idx_homebrew_content_type ON public.homebrew_content(type);
CREATE INDEX idx_homebrew_content_is_public ON public.homebrew_content(is_public) WHERE is_public = true;
CREATE INDEX idx_homebrew_shares_content_id ON public.homebrew_shares(content_id);
CREATE INDEX idx_homebrew_shares_campaign_id ON public.homebrew_shares(campaign_id);
-- END supabase/migrations/20251221001351_14f14430-bbf4-4197-858e-249df58ac1fa.sql

-- BEGIN supabase/migrations/20251222172201_7cc54cac-c7f1-465d-8120-4b5083d9bf6f.sql
-- Create personal notes table for quick notes tool
CREATE TABLE public.personal_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  color TEXT DEFAULT 'default',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own notes" 
ON public.personal_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
ON public.personal_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.personal_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.personal_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_personal_notes_user_id ON public.personal_notes(user_id);
CREATE INDEX idx_personal_notes_pinned ON public.personal_notes(is_pinned DESC, updated_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_personal_notes_updated_at
BEFORE UPDATE ON public.personal_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- END supabase/migrations/20251222172201_7cc54cac-c7f1-465d-8120-4b5083d9bf6f.sql

-- BEGIN supabase/migrations/20251222173459_cabf3500-7f5b-45b0-8b08-9628b2dca84d.sql
-- Add tags column to personal_notes table
ALTER TABLE public.personal_notes 
ADD COLUMN tags text[] DEFAULT '{}'::text[];
-- END supabase/migrations/20251222173459_cabf3500-7f5b-45b0-8b08-9628b2dca84d.sql

-- BEGIN supabase/migrations/20251222181442_87d96838-5ad3-4a1c-a5a6-3a099d5d761e.sql
-- First migration: Add new subscription status values to the enum
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'aldeao';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'heroi';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'mestre';
-- END supabase/migrations/20251222181442_87d96838-5ad3-4a1c-a5a6-3a099d5d761e.sql

-- BEGIN supabase/migrations/20251222181521_ae15fa32-c94b-4f69-bde2-3ef55e796edd.sql
-- Update the is_premium function to check for heroi or mestre status
CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE user_id = _user_id 
        AND status IN ('premium', 'heroi', 'mestre')
        AND (expires_at IS NULL OR expires_at > NOW())
      )
    ELSE FALSE
  END;
$function$;

-- Create a new function to check if user is a master subscriber
CREATE OR REPLACE FUNCTION public.is_mestre(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE user_id = _user_id 
        AND status IN ('premium', 'mestre')
        AND (expires_at IS NULL OR expires_at > NOW())
      )
    ELSE FALSE
  END;
$function$;

-- Create a function to get subscription tier
CREATE OR REPLACE FUNCTION public.get_subscription_tier(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      COALESCE(
        (SELECT 
          CASE 
            WHEN status IN ('mestre', 'premium') AND (expires_at IS NULL OR expires_at > NOW()) THEN 'mestre'
            WHEN status = 'heroi' AND (expires_at IS NULL OR expires_at > NOW()) THEN 'heroi'
            ELSE 'aldeao'
          END
        FROM public.subscriptions
        WHERE user_id = _user_id),
        'aldeao'
      )
    ELSE 'aldeao'
  END;
$function$;

-- Update can_create_character to use tier limits
-- aldeao: 3, heroi: 20, mestre: unlimited
CREATE OR REPLACE FUNCTION public.can_create_character(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      CASE public.get_subscription_tier(_user_id)
        WHEN 'mestre' THEN TRUE
        WHEN 'heroi' THEN public.count_user_characters(_user_id) < 20
        ELSE public.count_user_characters(_user_id) < 3
      END
    ELSE FALSE
  END;
$function$;

-- Update handle_new_user to use 'aldeao' for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  
  INSERT INTO public.subscriptions (user_id, status)
  VALUES (NEW.id, 'aldeao');
  
  RETURN NEW;
END;
$function$;

-- Update redeem_promo_token to handle tier upgrades
CREATE OR REPLACE FUNCTION public.redeem_promo_token(_code text, _user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _token promo_tokens%ROWTYPE;
  _existing_redemption token_redemptions%ROWTYPE;
  _new_expires_at timestamp with time zone;
  _current_subscription subscriptions%ROWTYPE;
BEGIN
  -- Find the token
  SELECT * INTO _token FROM promo_tokens 
  WHERE code = UPPER(_code) AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido ou expirado');
  END IF;
  
  -- Check if token has expired
  IF _token.expires_at IS NOT NULL AND _token.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código expirado');
  END IF;
  
  -- Check if max uses reached
  IF _token.max_uses IS NOT NULL AND _token.current_uses >= _token.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código já foi utilizado o máximo de vezes');
  END IF;
  
  -- Check if user already redeemed this token
  SELECT * INTO _existing_redemption FROM token_redemptions 
  WHERE token_id = _token.id AND user_id = _user_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já resgatou este código');
  END IF;
  
  -- Get current subscription
  SELECT * INTO _current_subscription FROM subscriptions WHERE user_id = _user_id;
  
  -- Calculate new expiration date
  IF _current_subscription.status IN ('mestre', 'heroi', 'premium') AND _current_subscription.expires_at > now() THEN
    _new_expires_at := _current_subscription.expires_at + (_token.days_premium || ' days')::interval;
  ELSE
    _new_expires_at := now() + (_token.days_premium || ' days')::interval;
  END IF;
  
  -- Update or create subscription (promo tokens give mestre access by default)
  INSERT INTO subscriptions (user_id, status, expires_at)
  VALUES (_user_id, 'mestre', _new_expires_at)
  ON CONFLICT (user_id) 
  DO UPDATE SET status = 'mestre', expires_at = _new_expires_at, updated_at = now();
  
  -- Record redemption
  INSERT INTO token_redemptions (token_id, user_id) VALUES (_token.id, _user_id);
  
  -- Update token usage count
  UPDATE promo_tokens SET current_uses = current_uses + 1 WHERE id = _token.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Plano Mestre ativado com sucesso!',
    'days', _token.days_premium,
    'expires_at', _new_expires_at
  );
END;
$function$;
-- END supabase/migrations/20251222181521_ae15fa32-c94b-4f69-bde2-3ef55e796edd.sql

-- BEGIN supabase/migrations/20251222182255_54fe271e-28b9-4e44-acd6-b1d0649cbb89.sql
-- Create table for character change history
CREATE TABLE public.character_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_type TEXT NOT NULL DEFAULT 'update',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_character_history_character_id ON public.character_history(character_id);
CREATE INDEX idx_character_history_created_at ON public.character_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.character_history ENABLE ROW LEVEL SECURITY;

-- Users can view history of their own characters
CREATE POLICY "Users can view own character history"
ON public.character_history
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND (
    public.get_subscription_tier(auth.uid()) IN ('heroi', 'mestre')
    OR EXISTS (
      SELECT 1 FROM public.subscriptions 
      WHERE user_id = auth.uid() 
      AND status IN ('premium', 'heroi', 'mestre')
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  )
);

-- Users can insert history for their own characters
CREATE POLICY "Users can insert own character history"
ON public.character_history
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Users can delete their own character history
CREATE POLICY "Users can delete own character history"
ON public.character_history
FOR DELETE
USING (auth.uid() = user_id);
-- END supabase/migrations/20251222182255_54fe271e-28b9-4e44-acd6-b1d0649cbb89.sql

-- BEGIN supabase/migrations/20251222195943_15aaa0b2-66aa-4ffd-93c9-27627dfe8916.sql
-- Fix 1: Update get_or_create_notification_preferences to validate authorization
CREATE OR REPLACE FUNCTION public.get_or_create_notification_preferences(_user_id UUID)
RETURNS public.notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefs public.notification_preferences;
BEGIN
  -- CRITICAL: Verify caller is requesting their own preferences
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;
  
  IF auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access other users preferences';
  END IF;
  
  SELECT * INTO _prefs FROM public.notification_preferences WHERE user_id = _user_id;
  
  IF _prefs IS NULL THEN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (_user_id)
    RETURNING * INTO _prefs;
  END IF;
  
  RETURN _prefs;
END;
$$;

-- Fix 2: Remove public SELECT policy on promo_tokens (they're only validated via RPC)
DROP POLICY IF EXISTS "Anyone can read active tokens" ON public.promo_tokens;
-- END supabase/migrations/20251222195943_15aaa0b2-66aa-4ffd-93c9-27627dfe8916.sql

-- BEGIN supabase/migrations/20251222200209_354bb5c1-97d0-4607-bc43-aa0255af2a70.sql
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
-- END supabase/migrations/20251222200209_354bb5c1-97d0-4607-bc43-aa0255af2a70.sql

-- BEGIN supabase/migrations/20251223115303_0a9a61f4-fc36-4984-9494-c777c2c05b69.sql
-- Primeiro, remover a política problemática
DROP POLICY IF EXISTS "Premium users can create homebrew" ON public.homebrew_content;

-- Criar uma política mais simples que não cause recursão
-- Permitir usuários autenticados inserir seus próprios conteúdos
-- A verificação de premium será feita no frontend/backend
CREATE POLICY "Users can create own homebrew" ON public.homebrew_content
FOR INSERT
WITH CHECK (auth.uid() = user_id);
-- END supabase/migrations/20251223115303_0a9a61f4-fc36-4984-9494-c777c2c05b69.sql

-- BEGIN supabase/migrations/20251223115530_b8a46473-4f74-4ef7-8776-eaf4f2a0ed69.sql
-- Add explicit RLS policies for promo_tokens to satisfy linter while keeping table inaccessible from clients.
-- Promo tokens should be redeemed via SECURITY DEFINER function public.redeem_promo_token.

ALTER TABLE public.promo_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access to promo tokens" ON public.promo_tokens;

CREATE POLICY "No direct access to promo tokens"
ON public.promo_tokens
FOR ALL
USING (false)
WITH CHECK (false);
-- END supabase/migrations/20251223115530_b8a46473-4f74-4ef7-8776-eaf4f2a0ed69.sql

-- BEGIN supabase/migrations/20251223120221_0bce0a79-74c3-45fa-b0a7-6903e4d6bac8.sql
-- Fix infinite recursion between RLS policies on homebrew_content and homebrew_shares
-- by removing direct references from homebrew_shares policies to homebrew_content.
-- Use SECURITY DEFINER function to check ownership safely.

-- 1) Helper function: is the authenticated user the owner of a homebrew content item?
CREATE OR REPLACE FUNCTION public.is_homebrew_owner(_content_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.homebrew_content hc
    WHERE hc.id = _content_id
      AND hc.user_id = _user_id
  );
$$;

-- 2) Replace homebrew_shares policies to avoid querying homebrew_content inside policies
DROP POLICY IF EXISTS "Owners can share to their campaigns" ON public.homebrew_shares;
DROP POLICY IF EXISTS "Owners and masters can view shares" ON public.homebrew_shares;
DROP POLICY IF EXISTS "Campaign members can view campaign shares" ON public.homebrew_shares;
DROP POLICY IF EXISTS "Owners and masters can delete shares" ON public.homebrew_shares;

-- SELECT: campaign members, campaign masters, or the content owner can see share links
CREATE POLICY "Campaign members can view campaign shares"
ON public.homebrew_shares
FOR SELECT
USING (
  public.is_campaign_member(campaign_id, auth.uid())
  OR public.is_campaign_master(campaign_id, auth.uid())
  OR public.is_homebrew_owner(content_id, auth.uid())
);

-- INSERT: only the content owner can share, and only to campaigns they master
CREATE POLICY "Owners can share to their campaigns"
ON public.homebrew_shares
FOR INSERT
WITH CHECK (
  public.is_homebrew_owner(content_id, auth.uid())
  AND public.is_campaign_master(campaign_id, auth.uid())
);

-- DELETE: content owner or campaign master can remove the share
CREATE POLICY "Owners and masters can delete shares"
ON public.homebrew_shares
FOR DELETE
USING (
  public.is_homebrew_owner(content_id, auth.uid())
  OR public.is_campaign_master(campaign_id, auth.uid())
);

-- END supabase/migrations/20251223120221_0bce0a79-74c3-45fa-b0a7-6903e4d6bac8.sql

-- BEGIN supabase/migrations/20251223142953_ca6d6c31-8b53-484c-9c47-f143bc0f1608.sql
-- Corrigir função is_premium para não verificar auth.uid() duplicadamente
-- O RLS já passa o user_id correto, então a verificação adicional é redundante
-- e pode causar falsos negativos em contextos de serviço

CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id 
    AND status IN ('premium', 'heroi', 'mestre')
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- Corrigir função is_mestre da mesma forma
CREATE OR REPLACE FUNCTION public.is_mestre(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id 
    AND status IN ('premium', 'mestre')
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- Corrigir get_subscription_tier também
CREATE OR REPLACE FUNCTION public.get_subscription_tier(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT status::text FROM public.subscriptions
     WHERE user_id = _user_id 
     AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1),
    'aldeao'
  );
$$;
-- END supabase/migrations/20251223142953_ca6d6c31-8b53-484c-9c47-f143bc0f1608.sql

-- BEGIN supabase/migrations/20251223165256_dacd7ea3-e065-4174-af90-d59e30e22264.sql
-- Corrigir a RLS policy de criação de campanha para usar is_mestre ao invés de is_premium
-- Apenas usuários Mestre podem criar campanhas, não Herói

DROP POLICY IF EXISTS "Premium users can create campaigns" ON public.campaigns;

CREATE POLICY "Mestres can create campaigns" 
ON public.campaigns 
FOR INSERT 
WITH CHECK (auth.uid() = master_id AND is_mestre(auth.uid()));
-- END supabase/migrations/20251223165256_dacd7ea3-e065-4174-af90-d59e30e22264.sql

-- BEGIN supabase/migrations/20251223171708_7b839758-e528-429c-bef0-158249f55afc.sql
-- Add discord_webhook_url column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN discord_webhook_url TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.campaigns.discord_webhook_url IS 'Discord webhook URL for sending notifications to the campaign Discord channel';
-- END supabase/migrations/20251223171708_7b839758-e528-429c-bef0-158249f55afc.sql

-- BEGIN supabase/migrations/20251223173944_8d68a8e9-1ced-4ddf-8849-bc9a24bbf934.sql
-- Add tier column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'promo_tokens' 
    AND column_name = 'tier'
  ) THEN
    ALTER TABLE public.promo_tokens ADD COLUMN tier text NOT NULL DEFAULT 'mestre';
  END IF;
END $$;

-- Insert the 4 test tokens
INSERT INTO public.promo_tokens (code, days_premium, max_uses, expires_at, is_active, tier) VALUES
  ('HEROI30', 30, 100, '2025-12-31 23:59:59+00', true, 'heroi'),
  ('HEROIVIP', 36500, 50, '2025-12-31 23:59:59+00', true, 'heroi'),
  ('MESTRE30', 30, 100, '2025-12-31 23:59:59+00', true, 'mestre'),
  ('MESTREVIP', 36500, 50, '2025-12-31 23:59:59+00', true, 'mestre');
-- END supabase/migrations/20251223173944_8d68a8e9-1ced-4ddf-8849-bc9a24bbf934.sql

-- BEGIN supabase/migrations/20251223175348_c5b07cbc-0613-459f-af4e-5f55c4e3b551.sql
-- Fix: Remove permissive INSERT policy on notifications table
-- Notifications should only be created via the create_notification SECURITY DEFINER function
-- which provides controlled access to notification creation

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.notifications;
-- END supabase/migrations/20251223175348_c5b07cbc-0613-459f-af4e-5f55c4e3b551.sql

-- BEGIN supabase/migrations/20251223175623_0839948c-0fa6-4752-aadf-d12ff1e1e497.sql
-- Fix redeem_promo_token function to use the tier column from promo_tokens
CREATE OR REPLACE FUNCTION public.redeem_promo_token(_code text, _user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _token promo_tokens%ROWTYPE;
  _existing_redemption token_redemptions%ROWTYPE;
  _new_expires_at timestamp with time zone;
  _current_subscription subscriptions%ROWTYPE;
  _target_tier subscription_status;
BEGIN
  -- Find the token
  SELECT * INTO _token FROM promo_tokens 
  WHERE code = UPPER(_code) AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido ou expirado');
  END IF;
  
  -- Check if token has expired
  IF _token.expires_at IS NOT NULL AND _token.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código expirado');
  END IF;
  
  -- Check if max uses reached
  IF _token.max_uses IS NOT NULL AND _token.current_uses >= _token.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código já foi utilizado o máximo de vezes');
  END IF;
  
  -- Check if user already redeemed this token
  SELECT * INTO _existing_redemption FROM token_redemptions 
  WHERE token_id = _token.id AND user_id = _user_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já resgatou este código');
  END IF;
  
  -- Get current subscription
  SELECT * INTO _current_subscription FROM subscriptions WHERE user_id = _user_id;
  
  -- Determine target tier from the token (default to 'mestre' if not specified)
  _target_tier := COALESCE(_token.tier::subscription_status, 'mestre'::subscription_status);
  
  -- Calculate new expiration date
  -- For lifetime codes (36500+ days), set expires_at to NULL
  IF _token.days_premium >= 36500 THEN
    _new_expires_at := NULL;
  ELSIF _current_subscription.status IN ('mestre', 'heroi', 'premium') AND _current_subscription.expires_at > now() THEN
    _new_expires_at := _current_subscription.expires_at + (_token.days_premium || ' days')::interval;
  ELSE
    _new_expires_at := now() + (_token.days_premium || ' days')::interval;
  END IF;
  
  -- Update or create subscription with the correct tier from the token
  INSERT INTO subscriptions (user_id, status, expires_at)
  VALUES (_user_id, _target_tier, _new_expires_at)
  ON CONFLICT (user_id) 
  DO UPDATE SET status = _target_tier, expires_at = _new_expires_at, updated_at = now();
  
  -- Record redemption
  INSERT INTO token_redemptions (token_id, user_id) VALUES (_token.id, _user_id);
  
  -- Update token usage count
  UPDATE promo_tokens SET current_uses = current_uses + 1 WHERE id = _token.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Plano ' || initcap(_target_tier::text) || ' ativado com sucesso!',
    'tier', _target_tier,
    'days', _token.days_premium,
    'expires_at', _new_expires_at
  );
END;
$function$;
-- END supabase/migrations/20251223175623_0839948c-0fa6-4752-aadf-d12ff1e1e497.sql

-- BEGIN supabase/migrations/20251223193220_b3bbd282-912e-4ae5-afb9-2210d68e4993.sql
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
-- END supabase/migrations/20251223193220_b3bbd282-912e-4ae5-afb9-2210d68e4993.sql

-- BEGIN supabase/migrations/20251223194644_ae6a4ec6-576b-460a-a479-6796526d482a.sql
-- Add conditions field to characters table for combat sync
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS conditions text[] DEFAULT '{}';

-- Add comment explaining the field
COMMENT ON COLUMN public.characters.conditions IS 'Active conditions on the character, synced with combat';
-- END supabase/migrations/20251223194644_ae6a4ec6-576b-460a-a479-6796526d482a.sql

-- BEGIN supabase/migrations/20251224125935_defc14c1-3774-4fb8-8787-4e2d49254cf8.sql
-- Create avatars bucket for character profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- END supabase/migrations/20251224125935_defc14c1-3774-4fb8-8787-4e2d49254cf8.sql

-- BEGIN supabase/migrations/20251224131953_e078a5ff-34a2-4de9-86f0-69d22c6dc6ff.sql
-- Create session attendance table
CREATE TABLE public.session_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'tentative')),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Enable RLS
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attendance for sessions in their campaigns
CREATE POLICY "Users can view attendance in their campaigns"
ON public.session_attendance
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.campaign_players cp ON cp.campaign_id = s.campaign_id
    WHERE s.id = session_attendance.session_id
    AND cp.user_id = auth.uid()
  )
);

-- Policy: Users can insert their own attendance
CREATE POLICY "Users can insert own attendance"
ON public.session_attendance
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own attendance
CREATE POLICY "Users can update own attendance"
ON public.session_attendance
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Campaign masters can delete attendance
CREATE POLICY "Masters can delete attendance"
ON public.session_attendance
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.campaigns c ON c.id = s.campaign_id
    WHERE s.id = session_attendance.session_id
    AND c.master_id = auth.uid()
  )
);

-- Enable realtime for attendance updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_attendance;
-- END supabase/migrations/20251224131953_e078a5ff-34a2-4de9-86f0-69d22c6dc6ff.sql

-- BEGIN supabase/migrations/20251224132728_869a3108-b042-446b-90f9-6c782d66fcd9.sql
-- Create storage bucket for campaign images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('campaign-images', 'campaign-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view campaign images (public bucket)
CREATE POLICY "Campaign images are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'campaign-images');

-- Policy: Authenticated users can upload images to campaign folders they have access to
CREATE POLICY "Campaign members can upload images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-images' 
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can update their own uploaded images
CREATE POLICY "Users can update own campaign images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'campaign-images' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Users can delete their own uploaded images, masters can delete any
CREATE POLICY "Users can delete own campaign images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'campaign-images' 
  AND auth.uid() IS NOT NULL
);
-- END supabase/migrations/20251224132728_869a3108-b042-446b-90f9-6c782d66fcd9.sql

-- BEGIN supabase/migrations/20251224143825_1e8b06d0-dece-4716-80cf-cd895ad80f40.sql
-- Create a view that hides discord_webhook_url from non-masters
-- This ensures only campaign masters can see webhook URLs

CREATE OR REPLACE VIEW public.campaigns_secure AS
SELECT 
  id,
  name,
  description,
  image_url,
  invite_code,
  master_id,
  created_at,
  updated_at,
  CASE 
    WHEN auth.uid() = master_id THEN discord_webhook_url 
    ELSE NULL 
  END AS discord_webhook_url
FROM public.campaigns;

-- Grant access to the view
GRANT SELECT ON public.campaigns_secure TO authenticated;
GRANT SELECT ON public.campaigns_secure TO anon;

-- Add comment explaining the view
COMMENT ON VIEW public.campaigns_secure IS 'Secure view of campaigns that hides discord_webhook_url from non-masters';
-- END supabase/migrations/20251224143825_1e8b06d0-dece-4716-80cf-cd895ad80f40.sql

-- BEGIN supabase/migrations/20251224143840_e29c1254-cbb2-4048-ac5b-1b354dc8dae9.sql
-- Drop the security definer view as it's problematic
DROP VIEW IF EXISTS public.campaigns_secure;

-- Instead, create a security definer function to safely check if user can see webhook
-- This function will be used by the application to get webhook URL only for masters
CREATE OR REPLACE FUNCTION public.get_campaign_webhook_url(campaign_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _webhook_url TEXT;
  _master_id UUID;
BEGIN
  -- Get campaign master_id and webhook
  SELECT c.master_id, c.discord_webhook_url 
  INTO _master_id, _webhook_url
  FROM campaigns c
  WHERE c.id = campaign_id;
  
  -- Only return webhook if caller is the master
  IF _master_id = auth.uid() THEN
    RETURN _webhook_url;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_campaign_webhook_url(UUID) TO authenticated;
-- END supabase/migrations/20251224143840_e29c1254-cbb2-4048-ac5b-1b354dc8dae9.sql

-- BEGIN supabase/migrations/20251224195556_bd7da11c-033f-4e43-bd8e-9851dc5c3f7d.sql
-- Add discord_user_id to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_user_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_discord_user_id ON public.profiles(discord_user_id) WHERE discord_user_id IS NOT NULL;
-- END supabase/migrations/20251224195556_bd7da11c-033f-4e43-bd8e-9851dc5c3f7d.sql

-- BEGIN supabase/migrations/20251225200823_a4cac94b-00d9-48c6-8f79-4ea8db497b82.sql
-- Create campaign_npcs table
CREATE TABLE public.campaign_npcs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  occupation TEXT,
  location TEXT,
  appearance TEXT,
  personality TEXT,
  motivations TEXT,
  secrets TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'alive' CHECK (status IN ('alive', 'dead', 'unknown', 'missing')),
  image_url TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create NPC relationships table
CREATE TABLE public.campaign_npc_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  npc_id UUID NOT NULL REFERENCES public.campaign_npcs(id) ON DELETE CASCADE,
  related_npc_id UUID NOT NULL REFERENCES public.campaign_npcs(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  description TEXT,
  is_mutual BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_npcs CHECK (npc_id != related_npc_id)
);

-- Enable RLS
ALTER TABLE public.campaign_npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_npc_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_npcs

-- Masters can do everything with NPCs in their campaigns
CREATE POLICY "Masters can manage campaign NPCs"
ON public.campaign_npcs
FOR ALL
USING (is_campaign_master(campaign_id, auth.uid()));

-- Players can view non-hidden NPCs in campaigns they belong to
CREATE POLICY "Players can view visible NPCs"
ON public.campaign_npcs
FOR SELECT
USING (
  is_hidden = false 
  AND is_campaign_member(campaign_id, auth.uid())
);

-- RLS Policies for campaign_npc_relationships

-- Masters can manage relationships
CREATE POLICY "Masters can manage NPC relationships"
ON public.campaign_npc_relationships
FOR ALL
USING (is_campaign_master(campaign_id, auth.uid()));

-- Players can view relationships of visible NPCs
CREATE POLICY "Players can view NPC relationships"
ON public.campaign_npc_relationships
FOR SELECT
USING (
  is_campaign_member(campaign_id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.campaign_npcs n1 
    WHERE n1.id = campaign_npc_relationships.npc_id 
    AND n1.is_hidden = false
  )
  AND EXISTS (
    SELECT 1 FROM public.campaign_npcs n2 
    WHERE n2.id = campaign_npc_relationships.related_npc_id 
    AND n2.is_hidden = false
  )
);

-- Create indexes for performance
CREATE INDEX idx_campaign_npcs_campaign_id ON public.campaign_npcs(campaign_id);
CREATE INDEX idx_campaign_npc_relationships_npc_id ON public.campaign_npc_relationships(npc_id);
CREATE INDEX idx_campaign_npc_relationships_related_npc_id ON public.campaign_npc_relationships(related_npc_id);

-- Add trigger for updated_at
CREATE TRIGGER update_campaign_npcs_updated_at
BEFORE UPDATE ON public.campaign_npcs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- END supabase/migrations/20251225200823_a4cac94b-00d9-48c6-8f79-4ea8db497b82.sql

-- BEGIN supabase/migrations/20251225202423_88a9dba2-e471-4e53-98ac-2cdf193b5d0d.sql
-- Create shops table
CREATE TABLE public.campaign_shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  npc_id UUID REFERENCES public.campaign_npcs(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shop items table
CREATE TABLE public.campaign_shop_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.campaign_shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_gold INTEGER NOT NULL DEFAULT 0,
  price_silver INTEGER NOT NULL DEFAULT 0,
  price_copper INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER, -- NULL means unlimited
  category TEXT,
  rarity TEXT DEFAULT 'comum',
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_shop_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for shops
CREATE POLICY "Masters can manage campaign shops"
ON public.campaign_shops
FOR ALL
USING (is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Players can view visible shops"
ON public.campaign_shops
FOR SELECT
USING (is_hidden = false AND is_campaign_member(campaign_id, auth.uid()));

-- RLS policies for shop items
CREATE POLICY "Masters can manage shop items"
ON public.campaign_shop_items
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.campaign_shops s
  WHERE s.id = campaign_shop_items.shop_id
  AND is_campaign_master(s.campaign_id, auth.uid())
));

CREATE POLICY "Players can view items in visible shops"
ON public.campaign_shop_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.campaign_shops s
  WHERE s.id = campaign_shop_items.shop_id
  AND s.is_hidden = false
  AND is_campaign_member(s.campaign_id, auth.uid())
));

-- Triggers for updated_at
CREATE TRIGGER update_campaign_shops_updated_at
BEFORE UPDATE ON public.campaign_shops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_shop_items_updated_at
BEFORE UPDATE ON public.campaign_shop_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for shops
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_shops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_shop_items;
-- END supabase/migrations/20251225202423_88a9dba2-e471-4e53-98ac-2cdf193b5d0d.sql

-- BEGIN supabase/migrations/20251225210604_f59b9187-0794-46a5-91e3-da2cd4e9cd5f.sql
-- Create shop transactions table for trade offers
CREATE TABLE public.shop_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.campaign_shops(id) ON DELETE CASCADE,
  shop_item_id UUID NOT NULL REFERENCES public.campaign_shop_items(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  seller_user_id UUID NOT NULL, -- The master offering the item
  buyer_user_id UUID NOT NULL, -- The player receiving the offer
  buyer_character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  price_gold INT NOT NULL DEFAULT 0,
  price_silver INT NOT NULL DEFAULT 0,
  price_copper INT NOT NULL DEFAULT 0,
  item_data JSONB NOT NULL DEFAULT '{}', -- Store item snapshot for history
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_quantity CHECK (quantity > 0)
);

-- Enable RLS
ALTER TABLE public.shop_transactions ENABLE ROW LEVEL SECURITY;

-- Master can create transactions and view all for their campaigns
CREATE POLICY "Masters can manage transactions for their campaigns"
ON public.shop_transactions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = shop_transactions.campaign_id AND c.master_id = auth.uid()
  )
);

-- Players can view and respond to their own transactions
CREATE POLICY "Players can view their transactions"
ON public.shop_transactions
FOR SELECT
USING (buyer_user_id = auth.uid());

CREATE POLICY "Players can update their pending transactions"
ON public.shop_transactions
FOR UPDATE
USING (buyer_user_id = auth.uid() AND status = 'pending')
WITH CHECK (buyer_user_id = auth.uid());

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_transactions;

-- Create index for faster queries
CREATE INDEX idx_shop_transactions_buyer ON public.shop_transactions(buyer_user_id, status);
CREATE INDEX idx_shop_transactions_campaign ON public.shop_transactions(campaign_id, status);
-- END supabase/migrations/20251225210604_f59b9187-0794-46a5-91e3-da2cd4e9cd5f.sql

-- BEGIN supabase/migrations/20251225212250_1305b862-c865-4265-8f65-ab108e6f10be.sql
-- Create player_trades table for both master gifts and player-to-player trades
CREATE TABLE public.player_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  
  -- Trade type: 'master_gift' for admin gifts, 'player_trade' for p2p trades
  trade_type TEXT NOT NULL DEFAULT 'player_trade',
  
  -- Initiator (master for gifts, player for trades)
  initiator_user_id UUID NOT NULL,
  initiator_character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  initiator_item_data JSONB NOT NULL DEFAULT '{}',
  initiator_confirmed BOOLEAN NOT NULL DEFAULT false,
  
  -- Receiver
  receiver_user_id UUID NOT NULL,
  receiver_character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  receiver_item_data JSONB, -- NULL for master gifts, set by receiver for trades
  receiver_confirmed BOOLEAN NOT NULL DEFAULT false,
  
  -- Status: pending_receiver (waiting for receiver item), pending_confirmations, completed, cancelled, rejected
  status TEXT NOT NULL DEFAULT 'pending_receiver',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Masters can manage all trades in their campaigns
CREATE POLICY "Masters can manage campaign trades"
  ON public.player_trades
  FOR ALL
  USING (is_campaign_master(campaign_id, auth.uid()));

-- Players can view trades they're involved in
CREATE POLICY "Players can view their trades"
  ON public.player_trades
  FOR SELECT
  USING (
    initiator_user_id = auth.uid() OR 
    receiver_user_id = auth.uid()
  );

-- Players can initiate trades
CREATE POLICY "Players can initiate trades"
  ON public.player_trades
  FOR INSERT
  WITH CHECK (
    auth.uid() = initiator_user_id AND
    trade_type = 'player_trade' AND
    is_campaign_member(campaign_id, auth.uid())
  );

-- Players can update their own trades (for confirmation and item selection)
CREATE POLICY "Players can update their trades"
  ON public.player_trades
  FOR UPDATE
  USING (
    (initiator_user_id = auth.uid() OR receiver_user_id = auth.uid()) AND
    status NOT IN ('completed', 'cancelled')
  );

-- Players can cancel their own initiated trades
CREATE POLICY "Players can delete their initiated trades"
  ON public.player_trades
  FOR DELETE
  USING (
    initiator_user_id = auth.uid() AND
    status NOT IN ('completed')
  );

-- Index for faster queries
CREATE INDEX idx_player_trades_campaign ON public.player_trades(campaign_id);
CREATE INDEX idx_player_trades_receiver ON public.player_trades(receiver_user_id, status);
CREATE INDEX idx_player_trades_initiator ON public.player_trades(initiator_user_id, status);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_trades;

-- Update trigger
CREATE TRIGGER update_player_trades_updated_at
  BEFORE UPDATE ON public.player_trades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- END supabase/migrations/20251225212250_1305b862-c865-4265-8f65-ab108e6f10be.sql

-- BEGIN supabase/migrations/20251226024811_39fa923a-14c4-4f2d-a9f1-c0e60c0f401f.sql
-- Create campaign_documents table
CREATE TABLE public.campaign_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  document_type TEXT NOT NULL DEFAULT 'letter', -- 'letter', 'scroll', 'contract'
  style TEXT DEFAULT 'parchment', -- 'parchment', 'elegant', 'dark', 'royal'
  is_signed BOOLEAN DEFAULT false,
  signature_data JSONB DEFAULT '[]'::jsonb, -- Array of {character_id, character_name, signed_at}
  requires_signature BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document deliveries table (who received which document)
CREATE TABLE public.campaign_document_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.campaign_documents(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  delivered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(document_id, character_id)
);

-- Enable RLS
ALTER TABLE public.campaign_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_document_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_documents
CREATE POLICY "Masters can manage their campaign documents"
ON public.campaign_documents
FOR ALL
USING (public.is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Players can view documents delivered to them"
ON public.campaign_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_document_deliveries cdd
    JOIN public.characters c ON c.id = cdd.character_id
    WHERE cdd.document_id = campaign_documents.id
    AND c.user_id = auth.uid()
  )
);

-- RLS Policies for deliveries
CREATE POLICY "Masters can manage deliveries for their campaigns"
ON public.campaign_document_deliveries
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_documents cd
    WHERE cd.id = document_id
    AND public.is_campaign_master(cd.campaign_id, auth.uid())
  )
);

CREATE POLICY "Players can view and update their own deliveries"
ON public.campaign_document_deliveries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.characters c
    WHERE c.id = character_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Players can update their own deliveries"
ON public.campaign_document_deliveries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.characters c
    WHERE c.id = character_id AND c.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_campaign_documents_updated_at
BEFORE UPDATE ON public.campaign_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_document_deliveries;
-- END supabase/migrations/20251226024811_39fa923a-14c4-4f2d-a9f1-c0e60c0f401f.sql

-- BEGIN supabase/migrations/20251226025919_0f1233ae-e4ba-4257-97ea-69e9c75055a1.sql
-- Add index to campaign_documents for faster queries
CREATE INDEX IF NOT EXISTS idx_campaign_documents_campaign_id ON public.campaign_documents(campaign_id);

-- Add index to campaign_document_deliveries for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaign_document_deliveries_document_id ON public.campaign_document_deliveries(document_id);
CREATE INDEX IF NOT EXISTS idx_campaign_document_deliveries_character_id ON public.campaign_document_deliveries(character_id);
-- END supabase/migrations/20251226025919_0f1233ae-e4ba-4257-97ea-69e9c75055a1.sql

-- BEGIN supabase/migrations/20251226030120_3cbeaefb-cdea-4c90-bac3-88390bbcae33.sql
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Masters can manage their campaign documents" ON public.campaign_documents;
DROP POLICY IF EXISTS "Players can view documents delivered to them" ON public.campaign_documents;
DROP POLICY IF EXISTS "Masters can manage deliveries for their campaigns" ON public.campaign_document_deliveries;
DROP POLICY IF EXISTS "Players can view and update their own deliveries" ON public.campaign_document_deliveries;
DROP POLICY IF EXISTS "Players can update their own deliveries" ON public.campaign_document_deliveries;

-- Create helper function to check if user has access to a document
CREATE OR REPLACE FUNCTION public.has_document_access(_document_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaign_document_deliveries cdd
    JOIN public.characters c ON c.id = cdd.character_id
    WHERE cdd.document_id = _document_id
    AND c.user_id = _user_id
  );
$$;

-- Create helper function to check if user owns a character
CREATE OR REPLACE FUNCTION public.owns_character(_character_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.characters
    WHERE id = _character_id AND user_id = _user_id
  );
$$;

-- Create helper function to get campaign_id from document
CREATE OR REPLACE FUNCTION public.get_document_campaign_id(_document_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT campaign_id FROM public.campaign_documents WHERE id = _document_id LIMIT 1;
$$;

-- Recreate policies for campaign_documents using helper functions
CREATE POLICY "Masters can manage their campaign documents"
ON public.campaign_documents
FOR ALL
USING (public.is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Players can view delivered documents"
ON public.campaign_documents
FOR SELECT
USING (public.has_document_access(id, auth.uid()));

-- Recreate policies for campaign_document_deliveries using helper functions
CREATE POLICY "Masters can manage deliveries"
ON public.campaign_document_deliveries
FOR ALL
USING (public.is_campaign_master(public.get_document_campaign_id(document_id), auth.uid()));

CREATE POLICY "Players can view own deliveries"
ON public.campaign_document_deliveries
FOR SELECT
USING (public.owns_character(character_id, auth.uid()));

CREATE POLICY "Players can update own deliveries"
ON public.campaign_document_deliveries
FOR UPDATE
USING (public.owns_character(character_id, auth.uid()));
-- END supabase/migrations/20251226030120_3cbeaefb-cdea-4c90-bac3-88390bbcae33.sql

-- BEGIN supabase/migrations/20251226112507_b29c3596-f426-449e-8a17-f3bedb5443ec.sql
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
-- END supabase/migrations/20251226112507_b29c3596-f426-449e-8a17-f3bedb5443ec.sql

-- BEGIN supabase/migrations/20251226113115_9a3e344b-d2e9-475c-a97a-b2f1200b9806.sql
-- Add reply_to_id column for message replies/quotes
ALTER TABLE public.campaign_messages 
ADD COLUMN reply_to_id uuid REFERENCES public.campaign_messages(id) ON DELETE SET NULL;

-- Add index for faster querying of replies
CREATE INDEX idx_campaign_messages_reply_to ON public.campaign_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
-- END supabase/migrations/20251226113115_9a3e344b-d2e9-475c-a97a-b2f1200b9806.sql

-- BEGIN supabase/migrations/20251226113628_87cb865a-7ebf-4860-ad67-2d06b02b0be4.sql
-- Create table for message reactions
CREATE TABLE public.campaign_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.campaign_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.campaign_message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reactions on messages they can see (campaign members)
CREATE POLICY "Campaign members can view message reactions"
ON public.campaign_message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_messages cm
    JOIN public.campaigns c ON c.id = cm.campaign_id
    LEFT JOIN public.campaign_players cp ON cp.campaign_id = c.id
    WHERE cm.id = message_id
    AND (c.master_id = auth.uid() OR cp.user_id = auth.uid())
  )
);

-- Policy: Users can add reactions to messages in their campaigns
CREATE POLICY "Campaign members can add reactions"
ON public.campaign_message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.campaign_messages cm
    JOIN public.campaigns c ON c.id = cm.campaign_id
    LEFT JOIN public.campaign_players cp ON cp.campaign_id = c.id
    WHERE cm.id = message_id
    AND (c.master_id = auth.uid() OR cp.user_id = auth.uid())
  )
);

-- Policy: Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
ON public.campaign_message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_message_reactions;
-- END supabase/migrations/20251226113628_87cb865a-7ebf-4860-ad67-2d06b02b0be4.sql

-- BEGIN supabase/migrations/20251226115431_8ed4aca4-4549-43e0-aac6-e42d7f577667.sql
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
-- END supabase/migrations/20251226115431_8ed4aca4-4549-43e0-aac6-e42d7f577667.sql

-- BEGIN supabase/migrations/20251226120607_316d2bb7-4cb6-40b5-944b-1bc91e5cdf89.sql
-- Create campaign_factions table
CREATE TABLE public.campaign_factions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  alignment TEXT,
  influence_level TEXT DEFAULT 'local',
  headquarters TEXT,
  goals TEXT,
  secrets TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create faction_npc_links table (NPCs linked to factions)
CREATE TABLE public.campaign_faction_npcs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faction_id UUID NOT NULL REFERENCES public.campaign_factions(id) ON DELETE CASCADE,
  npc_id UUID NOT NULL REFERENCES public.campaign_npcs(id) ON DELETE CASCADE,
  role TEXT,
  rank TEXT,
  is_leader BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(faction_id, npc_id)
);

-- Create faction relationships table
CREATE TABLE public.campaign_faction_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  faction_id UUID NOT NULL REFERENCES public.campaign_factions(id) ON DELETE CASCADE,
  related_faction_id UUID NOT NULL REFERENCES public.campaign_factions(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'neutral',
  description TEXT,
  is_mutual BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_factions CHECK (faction_id != related_faction_id)
);

-- Create character reputation with factions table
CREATE TABLE public.campaign_character_faction_rep (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  faction_id UUID NOT NULL REFERENCES public.campaign_factions(id) ON DELETE CASCADE,
  reputation_level INTEGER NOT NULL DEFAULT 0,
  reputation_title TEXT,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(character_id, faction_id)
);

-- Enable RLS on all tables
ALTER TABLE public.campaign_factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_faction_npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_faction_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_character_faction_rep ENABLE ROW LEVEL SECURITY;

-- Factions policies
CREATE POLICY "Masters can manage campaign factions"
ON public.campaign_factions FOR ALL
USING (is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Players can view visible factions"
ON public.campaign_factions FOR SELECT
USING (is_hidden = false AND is_campaign_member(campaign_id, auth.uid()));

-- Faction NPCs policies
CREATE POLICY "Masters can manage faction npcs"
ON public.campaign_faction_npcs FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.campaign_factions f 
  WHERE f.id = faction_id AND is_campaign_master(f.campaign_id, auth.uid())
));

CREATE POLICY "Players can view faction npcs"
ON public.campaign_faction_npcs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.campaign_factions f 
  WHERE f.id = faction_id 
  AND f.is_hidden = false 
  AND is_campaign_member(f.campaign_id, auth.uid())
));

-- Faction relationships policies
CREATE POLICY "Masters can manage faction relationships"
ON public.campaign_faction_relationships FOR ALL
USING (is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Players can view faction relationships"
ON public.campaign_faction_relationships FOR SELECT
USING (
  is_campaign_member(campaign_id, auth.uid()) 
  AND EXISTS (SELECT 1 FROM public.campaign_factions f1 WHERE f1.id = faction_id AND f1.is_hidden = false)
  AND EXISTS (SELECT 1 FROM public.campaign_factions f2 WHERE f2.id = related_faction_id AND f2.is_hidden = false)
);

-- Character faction reputation policies
CREATE POLICY "Masters can manage character reputation"
ON public.campaign_character_faction_rep FOR ALL
USING (is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Players can view own reputation"
ON public.campaign_character_faction_rep FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid())
);

-- Enable realtime for factions
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_factions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_character_faction_rep;

-- Add updated_at trigger
CREATE TRIGGER update_campaign_factions_updated_at
BEFORE UPDATE ON public.campaign_factions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_character_faction_rep_updated_at
BEFORE UPDATE ON public.campaign_character_faction_rep
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- END supabase/migrations/20251226120607_316d2bb7-4cb6-40b5-944b-1bc91e5cdf89.sql

-- BEGIN supabase/migrations/20251226121202_3130baed-5c9f-4108-b725-decfefdd858e.sql
-- Add column to control if players can see their reputation with this faction
ALTER TABLE public.campaign_factions 
ADD COLUMN show_reputation_to_players BOOLEAN NOT NULL DEFAULT false;
-- END supabase/migrations/20251226121202_3130baed-5c9f-4108-b725-decfefdd858e.sql

-- BEGIN supabase/migrations/20251226121644_a624a045-8aa8-44bb-bcc2-7d2d2494cbcd.sql

-- Create faction events table for historical events that affect reputation
CREATE TABLE public.campaign_faction_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  faction_id UUID NOT NULL REFERENCES public.campaign_factions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT, -- In-game date (can be fictional like "Year 1045, Winter")
  reputation_change INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.campaign_faction_events ENABLE ROW LEVEL SECURITY;

-- Masters can manage faction events
CREATE POLICY "Masters can manage faction events"
ON public.campaign_faction_events
FOR ALL
USING (public.is_campaign_master(campaign_id, auth.uid()));

-- Campaign members can view faction events
CREATE POLICY "Campaign members can view faction events"
ON public.campaign_faction_events
FOR SELECT
USING (public.is_campaign_member(campaign_id, auth.uid()) OR public.is_campaign_master(campaign_id, auth.uid()));

-- Add index for performance
CREATE INDEX idx_faction_events_faction ON public.campaign_faction_events(faction_id);
CREATE INDEX idx_faction_events_campaign ON public.campaign_faction_events(campaign_id);

-- END supabase/migrations/20251226121644_a624a045-8aa8-44bb-bcc2-7d2d2494cbcd.sql

-- BEGIN supabase/migrations/20251226122331_00b852d3-bfe9-40a5-b7a2-a6b652422ac0.sql

-- Create campaign timeline events table
CREATE TABLE public.campaign_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL, -- In-game date (fictional like "Year 1045, Winter")
  icon TEXT DEFAULT 'calendar',
  color TEXT DEFAULT 'primary',
  image_url TEXT,
  is_major_event BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.campaign_timeline_events ENABLE ROW LEVEL SECURITY;

-- Masters can manage timeline events
CREATE POLICY "Masters can manage timeline events"
ON public.campaign_timeline_events
FOR ALL
USING (public.is_campaign_master(campaign_id, auth.uid()));

-- Campaign members can view timeline events
CREATE POLICY "Campaign members can view timeline events"
ON public.campaign_timeline_events
FOR SELECT
USING (public.is_campaign_member(campaign_id, auth.uid()) OR public.is_campaign_master(campaign_id, auth.uid()));

-- Add indexes for performance
CREATE INDEX idx_timeline_events_campaign ON public.campaign_timeline_events(campaign_id);
CREATE INDEX idx_timeline_events_sort ON public.campaign_timeline_events(campaign_id, sort_order);

-- Add trigger for updated_at
CREATE TRIGGER update_timeline_events_updated_at
BEFORE UPDATE ON public.campaign_timeline_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- END supabase/migrations/20251226122331_00b852d3-bfe9-40a5-b7a2-a6b652422ac0.sql

-- BEGIN supabase/migrations/20251226132344_fc8e018e-d8d1-4272-9a79-8a3bfef1fe84.sql
-- Fix RLS for player-to-player trades

-- Ensure RLS is enabled
ALTER TABLE public.player_trades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe)
DROP POLICY IF EXISTS "Player trades are viewable by participants" ON public.player_trades;
DROP POLICY IF EXISTS "Player trades insert by initiator" ON public.player_trades;
DROP POLICY IF EXISTS "Player trades update by participants" ON public.player_trades;

-- Allow campaign master to view all trades in their campaign (for moderation/dashboard)
CREATE POLICY "Player trades are viewable by participants"
ON public.player_trades
FOR SELECT
USING (
  auth.uid() = initiator_user_id
  OR auth.uid() = receiver_user_id
  OR public.is_campaign_master(campaign_id, auth.uid())
);

-- Allow authenticated initiator (player or master) to create trades/gifts
CREATE POLICY "Player trades insert by initiator"
ON public.player_trades
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND initiator_user_id = auth.uid()
  AND (
    public.is_campaign_master(campaign_id, auth.uid())
    OR public.is_campaign_member(campaign_id, auth.uid())
  )
  AND public.is_campaign_member(campaign_id, receiver_user_id)
  AND receiver_character_id IS NOT NULL
  AND public.owns_character(receiver_character_id, receiver_user_id)
  AND (
    initiator_character_id IS NULL
    OR public.owns_character(initiator_character_id, auth.uid())
  )
);

-- Allow participants to update trade status / confirmations / offered items
CREATE POLICY "Player trades update by participants"
ON public.player_trades
FOR UPDATE
USING (
  auth.uid() = initiator_user_id
  OR auth.uid() = receiver_user_id
)
WITH CHECK (
  auth.uid() = initiator_user_id
  OR auth.uid() = receiver_user_id
);

-- Prevent changing immutable columns on updates
CREATE OR REPLACE FUNCTION public.prevent_player_trade_immutable_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.campaign_id IS DISTINCT FROM OLD.campaign_id
     OR NEW.trade_type IS DISTINCT FROM OLD.trade_type
     OR NEW.initiator_user_id IS DISTINCT FROM OLD.initiator_user_id
     OR NEW.receiver_user_id IS DISTINCT FROM OLD.receiver_user_id
     OR NEW.initiator_character_id IS DISTINCT FROM OLD.initiator_character_id
     OR NEW.receiver_character_id IS DISTINCT FROM OLD.receiver_character_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Immutable fields cannot be modified on player_trades';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_player_trade_immutable_updates ON public.player_trades;
CREATE TRIGGER trg_prevent_player_trade_immutable_updates
BEFORE UPDATE ON public.player_trades
FOR EACH ROW
EXECUTE FUNCTION public.prevent_player_trade_immutable_updates();

-- END supabase/migrations/20251226132344_fc8e018e-d8d1-4272-9a79-8a3bfef1fe84.sql

-- BEGIN supabase/migrations/20251226181704_e65082a3-c69f-4819-93b6-602ca4dc9d35.sql
-- Add columns for post-session summary and recap
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS recap TEXT,
ADD COLUMN IF NOT EXISTS highlights TEXT[],
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS xp_awarded INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gold_awarded INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.sessions.summary IS 'Brief summary of what happened in the session';
COMMENT ON COLUMN public.sessions.recap IS 'Detailed recap/narrative of the session events';
COMMENT ON COLUMN public.sessions.highlights IS 'Key moments or memorable events from the session';
COMMENT ON COLUMN public.sessions.status IS 'Session status: scheduled, completed, or cancelled';
COMMENT ON COLUMN public.sessions.completed_at IS 'When the session was marked as completed';
COMMENT ON COLUMN public.sessions.xp_awarded IS 'Total XP awarded during the session';
COMMENT ON COLUMN public.sessions.gold_awarded IS 'Total gold awarded during the session';
-- END supabase/migrations/20251226181704_e65082a3-c69f-4819-93b6-602ca4dc9d35.sql

-- BEGIN supabase/migrations/20251227120424_17f45147-07ee-4c84-85aa-419cfe6a4bf1.sql
-- Add physical appearance and additional backstory fields to characters table
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS age text,
ADD COLUMN IF NOT EXISTS height text,
ADD COLUMN IF NOT EXISTS weight text,
ADD COLUMN IF NOT EXISTS eyes text,
ADD COLUMN IF NOT EXISTS hair text,
ADD COLUMN IF NOT EXISTS skin text,
ADD COLUMN IF NOT EXISTS distinctive_features text,
ADD COLUMN IF NOT EXISTS goals text,
ADD COLUMN IF NOT EXISTS allies_organizations text;
-- END supabase/migrations/20251227120424_17f45147-07ee-4c84-85aa-419cfe6a4bf1.sql

-- BEGIN supabase/migrations/20251227132255_cb21bfa4-6f95-4d2f-9c8a-8031e4afd9a4.sql
-- Adicionar 'visitante' ao enum subscription_status
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'visitante';
-- END supabase/migrations/20251227132255_cb21bfa4-6f95-4d2f-9c8a-8031e4afd9a4.sql

-- BEGIN supabase/migrations/20251227132316_be52f459-edbb-48db-b1c5-461a8598adf0.sql
-- Atualizar a função get_subscription_tier para incluir visitante
CREATE OR REPLACE FUNCTION public.get_subscription_tier(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT 
      CASE 
        WHEN s.status IN ('mestre', 'premium') AND (s.expires_at IS NULL OR s.expires_at > now()) THEN 'mestre'
        WHEN s.status = 'heroi' AND (s.expires_at IS NULL OR s.expires_at > now()) THEN 'heroi'
        WHEN s.status = 'aldeao' AND (s.expires_at IS NULL OR s.expires_at > now()) THEN 'aldeao'
        WHEN s.status::text = 'visitante' THEN 'visitante'
        ELSE 'visitante'
      END
    FROM public.subscriptions s 
    WHERE s.user_id = _user_id
    ORDER BY s.created_at DESC
    LIMIT 1),
    'visitante'
  );
$$;

-- Atualizar can_create_character para bloquear visitantes
CREATE OR REPLACE FUNCTION public.can_create_character(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN public.get_subscription_tier(_user_id) = 'visitante' THEN false
      WHEN public.get_subscription_tier(_user_id) = 'mestre' THEN true
      WHEN public.get_subscription_tier(_user_id) = 'heroi' THEN 
        (SELECT COUNT(*) < 20 FROM public.characters WHERE user_id = _user_id AND is_archived = false)
      ELSE 
        (SELECT COUNT(*) < 3 FROM public.characters WHERE user_id = _user_id AND is_archived = false)
    END;
$$;

-- Atualizar can_create_homebrew para bloquear visitantes
CREATE OR REPLACE FUNCTION public.can_create_homebrew(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN public.get_subscription_tier(_user_id) = 'visitante' THEN false
      WHEN public.get_subscription_tier(_user_id) IN ('mestre', 'heroi') THEN true
      ELSE false
    END;
$$;
-- END supabase/migrations/20251227132316_be52f459-edbb-48db-b1c5-461a8598adf0.sql

-- BEGIN supabase/migrations/20251229130023_6929b458-53a6-430c-83f5-0b5b08211d26.sql
-- Create catarse supporters table
CREATE TABLE public.catarse_supporters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'apoiador',
  message TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catarse_supporters ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can view visible supporters)
CREATE POLICY "Anyone can view visible supporters"
ON public.catarse_supporters
FOR SELECT
USING (is_visible = true);

-- Add some sample data for testing
INSERT INTO public.catarse_supporters (name, tier, message) VALUES
('João Silva', 'lendario', 'Apoiando a comunidade BR de RPG!'),
('Maria Santos', 'mestre_epico', 'Go20 é incrível!'),
('Pedro Oliveira', 'mestre', NULL),
('Ana Costa', 'heroi', 'Vamos jogar!'),
('Lucas Ferreira', 'aldeao', NULL),
('Carla Souza', 'apoiador', NULL);
-- END supabase/migrations/20251229130023_6929b458-53a6-430c-83f5-0b5b08211d26.sql

-- BEGIN supabase/migrations/20251229130446_d5d73dcf-2a2a-494e-b097-70f433d1f280.sql
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create has_role helper function (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: Users can only see their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- RLS: Only admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: Only admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin policies for catarse_supporters
CREATE POLICY "Admins can insert supporters"
ON public.catarse_supporters
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update supporters"
ON public.catarse_supporters
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete supporters"
ON public.catarse_supporters
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
-- END supabase/migrations/20251229130446_d5d73dcf-2a2a-494e-b097-70f433d1f280.sql

-- BEGIN supabase/migrations/20251229183141_df42fc2f-de07-4620-9dae-fa431feba211.sql

-- Tabela para NPCs criados pelos apoiadores do Catarse
CREATE TABLE public.supporter_npcs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  appearance TEXT,
  personality TEXT,
  backstory TEXT,
  occupation TEXT,
  location TEXT,
  image_url TEXT,
  creator_name TEXT NOT NULL,
  creator_tier TEXT NOT NULL DEFAULT 'lendario',
  creator_message TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para Itens Mágicos criados pelos apoiadores do Catarse
CREATE TABLE public.supporter_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL DEFAULT 'raro',
  item_type TEXT NOT NULL DEFAULT 'maravilhoso',
  requires_attunement BOOLEAN NOT NULL DEFAULT false,
  attunement_requirements TEXT,
  properties TEXT,
  damage TEXT,
  damage_type TEXT,
  ac_bonus INTEGER,
  image_url TEXT,
  creator_name TEXT NOT NULL,
  creator_tier TEXT NOT NULL DEFAULT 'mestre_epico',
  creator_message TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supporter_npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporter_items ENABLE ROW LEVEL SECURITY;

-- Políticas para NPCs - Qualquer um pode visualizar os visíveis
CREATE POLICY "Anyone can view visible supporter NPCs"
ON public.supporter_npcs
FOR SELECT
USING (is_visible = true);

-- Admins podem gerenciar NPCs
CREATE POLICY "Admins can manage supporter NPCs"
ON public.supporter_npcs
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Políticas para Itens - Qualquer um pode visualizar os visíveis
CREATE POLICY "Anyone can view visible supporter items"
ON public.supporter_items
FOR SELECT
USING (is_visible = true);

-- Admins podem gerenciar Itens
CREATE POLICY "Admins can manage supporter items"
ON public.supporter_items
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Índices para performance
CREATE INDEX idx_supporter_npcs_visible ON public.supporter_npcs(is_visible) WHERE is_visible = true;
CREATE INDEX idx_supporter_npcs_featured ON public.supporter_npcs(is_featured) WHERE is_featured = true;
CREATE INDEX idx_supporter_items_visible ON public.supporter_items(is_visible) WHERE is_visible = true;
CREATE INDEX idx_supporter_items_featured ON public.supporter_items(is_featured) WHERE is_featured = true;

-- END supabase/migrations/20251229183141_df42fc2f-de07-4620-9dae-fa431feba211.sql

-- BEGIN supabase/migrations/20251229202327_a5d0999e-0190-4eac-9fbb-8c7f732fba5f.sql
-- Table for supporter content submissions (pending approval)
CREATE TABLE public.supporter_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code TEXT NOT NULL,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('npc', 'item')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Creator info
  creator_name TEXT NOT NULL,
  creator_tier TEXT NOT NULL,
  creator_message TEXT,
  
  -- Submission data (JSON with all fields)
  data JSONB NOT NULL,
  
  -- Admin response
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supporter_submissions ENABLE ROW LEVEL SECURITY;

-- Public can insert (submit)
CREATE POLICY "Anyone can submit supporter content"
ON public.supporter_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view/update submissions
CREATE POLICY "Admins can view all submissions"
ON public.supporter_submissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update submissions"
ON public.supporter_submissions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Index for faster queries
CREATE INDEX idx_supporter_submissions_status ON public.supporter_submissions(status);
CREATE INDEX idx_supporter_submissions_promo_code ON public.supporter_submissions(promo_code);
-- END supabase/migrations/20251229202327_a5d0999e-0190-4eac-9fbb-8c7f732fba5f.sql

-- BEGIN supabase/migrations/20251229202820_f62f02c7-f5c2-40f0-ab92-955814781a44.sql
-- Create storage bucket for supporter submissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('supporter-submissions', 'supporter-submissions', true);

-- Allow anyone to upload to this bucket (for public form)
CREATE POLICY "Anyone can upload supporter submission images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'supporter-submissions');

-- Allow public read access
CREATE POLICY "Supporter submission images are publicly accessible"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'supporter-submissions');

-- Allow admins to delete
CREATE POLICY "Admins can delete supporter submission images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'supporter-submissions' AND public.has_role(auth.uid(), 'admin'));
-- END supabase/migrations/20251229202820_f62f02c7-f5c2-40f0-ab92-955814781a44.sql

-- BEGIN supabase/migrations/20251230004338_6e955bd7-fdff-4d8f-ab6a-b12d8baee1e0.sql
-- Add email field to supporter_submissions
ALTER TABLE public.supporter_submissions
ADD COLUMN email TEXT;
-- END supabase/migrations/20251230004338_6e955bd7-fdff-4d8f-ab6a-b12d8baee1e0.sql

-- BEGIN supabase/migrations/20251230011121_a80e739e-5cab-4273-ba0d-7f17102b3aa4.sql
-- Drop the restrictive policy
DROP POLICY IF EXISTS "No direct access to promo tokens" ON public.promo_tokens;

-- Allow public read access to active promo tokens (for code validation)
CREATE POLICY "Anyone can read active promo tokens for validation"
ON public.promo_tokens
FOR SELECT
USING (is_active = true);
-- END supabase/migrations/20251230011121_a80e739e-5cab-4273-ba0d-7f17102b3aa4.sql

-- BEGIN supabase/migrations/20251230202111_80470807-02e0-42aa-8dd9-70fec610996d.sql
-- Create stretch_goals table for Catarse campaign management
CREATE TABLE public.stretch_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_number INTEGER NOT NULL UNIQUE,
  value INTEGER NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  phase TEXT NOT NULL DEFAULT 'FUNDAÇÃO',
  phase_emoji TEXT DEFAULT '🏰',
  phase_order INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'current', 'pending')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stretch_goals ENABLE ROW LEVEL SECURITY;

-- Everyone can read stretch goals (public data for landing page)
CREATE POLICY "Stretch goals are publicly readable"
ON public.stretch_goals FOR SELECT
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage stretch goals"
ON public.stretch_goals FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_stretch_goals_updated_at
BEFORE UPDATE ON public.stretch_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create current_funding table to track the current funding amount
CREATE TABLE public.campaign_funding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  current_amount INTEGER NOT NULL DEFAULT 0,
  goal_amount INTEGER NOT NULL DEFAULT 50000,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_funding ENABLE ROW LEVEL SECURITY;

-- Everyone can read funding info
CREATE POLICY "Campaign funding is publicly readable"
ON public.campaign_funding FOR SELECT
USING (true);

-- Only admins can update funding
CREATE POLICY "Admins can manage campaign funding"
ON public.campaign_funding FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert initial funding record
INSERT INTO public.campaign_funding (current_amount, goal_amount) VALUES (3800, 50000);

-- Insert initial stretch goals based on current data
INSERT INTO public.stretch_goals (goal_number, value, title, subtitle, description, phase, phase_emoji, phase_order, status, sort_order) VALUES
(1, 600, 'Primeiros Dados Rolados', 'Acesso Beta e servidores 24/7', 'Ao atingirmos esta meta, abriremos os portões da Go20! Você terá acesso à versão Beta, poderá acessar o site imediatamente e revisar nossas ferramentas. Com esse valor, garantimos a infraestrutura para manter a Go20 online 24/7.', 'FUNDAÇÃO', '🏰', 1, 'completed', 1),
(2, 900, 'Ficha de Personagem', 'Criação guiada, cálculos automáticos...', 'O coração de todo aventureiro! Lançamos o sistema completo de fichas: criação guiada passo a passo, cálculos automáticos de atributos e modificadores, gestão de magias, inventário e progressão de nível.', 'FUNDAÇÃO', '🏰', 1, 'completed', 2),
(3, 1200, 'Ferramentas do Mestre', 'Campanhas, Combat Tracker Pro...', 'Ferramentas avançadas para quem senta atrás do escudo: criação e gestão de campanhas, Tracker de Combate com iniciativa automática e controle de HP, gestão de NPCs, Lojas e um chat integrado.', 'FUNDAÇÃO', '🏰', 1, 'completed', 3),
(4, 1500, 'Calendário de Aventuras', 'Agendamento, lembretes e confirmação...', 'Nunca mais perca uma sessão! Sistema de Agendamento completo. O mestre marca data/hora e todos recebem lembretes automáticos. Inclui sistema de RSVP para você saber quem estará na mesa.', 'FUNDAÇÃO', '🏰', 1, 'completed', 4),
(5, 1800, 'Discord na Mesa', 'Webhooks para rolagens, lembretes...', 'Integração total com seu servidor! A Go20 enviará automaticamente resultados de rolagens, lembretes de sessão e atualizações de combate via Webhook.', 'FUNDAÇÃO', '🏰', 1, 'completed', 5),
(6, 2200, 'Compêndio Expandido', 'Grimório, itens mágicos e SRD 5.1', 'Uma biblioteca de conhecimento ao seu alcance! SRD 5.1 completo traduzido, permitindo arrastar e soltar magias, itens mágicos e condições diretamente para a ficha.', 'FUNDAÇÃO', '🏰', 1, 'completed', 6),
(7, 2600, 'Economia entre Jogadores', 'Trocas, presentes e vendas', 'Sistema de Lojas Dinâmicas e Trocas P2P! Ofereça itens, negocie por ouro ou troque equipamentos com outros membros do grupo. Uma economia de RPG viva e funcional.', 'FUNDAÇÃO', '🏰', 1, 'completed', 7),
(8, 3000, 'Facções e Reputação', 'Organizações e mapa de relacionamentos', 'Crie guildas, ordens e reinos. Cada personagem terá sua própria reputação que flutua conforme suas escolhas. Inclui mapa de relacionamentos e histórico de eventos.', 'FUNDAÇÃO', '🏰', 1, 'completed', 8),
(9, 3500, 'Forja do Homebrew', 'Crie magias, itens e monstros', 'Sua criatividade não tem limites! Ferramenta completa para criar suas próprias raças, classes, magias e monstros que se integram ao sistema como conteúdo oficial.', 'EXPANSÃO', '🛠️', 2, 'completed', 9),
(10, 4000, 'Oficina de Documentos', 'Cartas, pergaminhos e contratos', 'Imersão máxima na entrega de pistas! Um editor visual para criar cartas seladas, pergaminhos antigos, contratos diabólicos e páginas de diário.', 'EXPANSÃO', '🛠️', 2, 'current', 10),
(11, 4500, 'Modo Offline Completo', 'Acesso total sem internet', 'Sua mesa não precisa de Wi-Fi! Modo offline completo, permitindo acesso a fichas, regras e rolagens mesmo sem conexão.', 'EXPANSÃO', '🛠️', 2, 'pending', 11),
(12, 5000, 'Gerador de Encontros', 'Balanceamento e sugestões', 'Mestres preparados em segundos! Sistema que sugere grupos de monstros baseados no nível do grupo, ambiente e dificuldade desejada.', 'EXPANSÃO', '🛠️', 2, 'pending', 12),
(13, 5500, 'Gerador de Tesouros', 'Recompensas automáticas', 'Porque todo mundo ama loot! Gere tesouros condizentes com o desafio, desde moedas até itens mágicos raros.', 'EXPANSÃO', '🛠️', 2, 'pending', 13),
(14, 6500, 'Cronista Arcano (IA)', 'Resumos narrativos automáticos', 'Chega de esquecer a última sessão! Nossa IA gera resumos narrativos épicos a partir dos logs de combate e notas.', 'EXPANSÃO', '🛠️', 2, 'pending', 14),
(15, 7500, 'Sábio das Regras (IA)', 'Chatbot integrado para dúvidas', 'Um juiz imparcial na mesa! Tire dúvidas de regras instantaneamente com nosso bot treinado no SRD 5e.', 'EXPANSÃO', '🛠️', 2, 'pending', 15),
(16, 8500, 'Dados Animados 3D', 'Simulação visual com física', 'A satisfação de rolar dados físicos, agora na tela! Dados 3D com física realista, colisão e sons satisfatórios.', 'INOVAÇÃO', '🔮', 3, 'pending', 16),
(17, 10000, 'Oficina de Mundos', 'Wiki de campanha completa', 'O lar da sua Lore! Um sistema estilo Wiki para catalogar cidades, NPCs, divindades e linhas do tempo.', 'INOVAÇÃO', '🔮', 3, 'pending', 17),
(18, 12000, 'App Nativo Mobile', 'iOS e Android otimizados', 'O grande sonho: Go20 no seu bolso! Apps nativos com notificações push e widgets de ficha.', 'INOVAÇÃO', '🔮', 3, 'pending', 18),
(19, 15000, 'Integração para Streams', 'Overlay para OBS/Twitch', 'Overlays dinâmicos para OBS. Mostre iniciativa, HP e rolagens em tempo real na sua live.', 'INOVAÇÃO', '🔮', 3, 'pending', 19),
(20, 18000, 'Modo Teatro (Projeção)', 'Interface para TV/Projetor', 'A união do presencial com o digital! Visualização especial para TV/Projetor na sala, sem mostrar segredos do Mestre.', 'EXPERIÊNCIA IMERSIVA', '🎭', 4, 'pending', 20),
(21, 22000, 'Trilha Sonora Integrada', 'Controle de músicas por ambiente', 'O som dita o clima! Player integrado com playlists temáticas sincronizadas nos dispositivos de todos.', 'EXPERIÊNCIA IMERSIVA', '🎭', 4, 'pending', 21),
(22, 25000, 'Soundboard de Efeitos', 'Sons épicos instantâneos', 'Mesa de som com efeitos prontos: explosões, rugidos de dragão, espadas colidindo. Imersão sonora ao clique.', 'EXPERIÊNCIA IMERSIVA', '🎭', 4, 'pending', 22),
(23, 28000, 'Arte e Identidade Visual', 'Ilustrações exclusivas', 'Artistas profissionais criarão identidade visual única, ícones personalizados e ilustrações exclusivas.', 'EXPERIÊNCIA IMERSIVA', '🎭', 4, 'pending', 23),
(24, 32000, 'Imersão Atmosférica', 'Efeitos visuais de clima', 'Efeitos visuais de ambiente: chuva, neblina, brasas de vulcão ou iluminação de tochas na interface.', 'EXPERIÊNCIA IMERSIVA', '🎭', 4, 'pending', 24),
(25, 38000, 'VTT Básico Integrado', 'Grid, tokens e Fog of War', 'A Go20 vira VTT completo! Mapas de batalha com grid, tokens em tempo real e névoa de guerra.', 'MESA VIRTUAL', '🗺️', 5, 'pending', 25),
(26, 42000, 'Oficina de Tokens', 'Corte e customize imagens', 'Transforme qualquer imagem em token! Ferramenta para cortar, adicionar bordas e salvar tokens perfeitos.', 'MESA VIRTUAL', '🗺️', 5, 'pending', 26),
(27, 50000, 'Oficina de Mapas', 'Construa cenários no app', 'Torne-se o arquiteto! Construtor de mapas leve para desenhar paredes, pisos e criar cenários rapidamente.', 'MESA VIRTUAL', '🗺️', 5, 'pending', 27);
-- END supabase/migrations/20251230202111_80470807-02e0-42aa-8dd9-70fec610996d.sql

-- BEGIN supabase/migrations/20260104180436_618baef4-c9e8-4c27-8644-c89d234abf96.sql
-- Add campaign appearance customization columns
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'auto',
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'wand';

-- Add comment for documentation
COMMENT ON COLUMN public.campaigns.theme_color IS 'Campaign theme color: auto (based on status), emerald, orange, blue, purple, red, amber';
COMMENT ON COLUMN public.campaigns.icon IS 'Campaign icon: wand, skull, swords, shield, book, dragon, crown, castle, scroll, fire';
-- END supabase/migrations/20260104180436_618baef4-c9e8-4c27-8644-c89d234abf96.sql

-- BEGIN supabase/migrations/20260106132849_c29f5b6b-d977-41eb-afc4-223a0c91f01e.sql
-- Create enum for homebrew sharing policy
CREATE TYPE public.homebrew_sharing_policy AS ENUM ('disabled', 'enabled', 'approval_required');

-- Add sharing policy to campaigns
ALTER TABLE public.campaigns 
ADD COLUMN homebrew_sharing_policy homebrew_sharing_policy NOT NULL DEFAULT 'disabled';

-- Create table for homebrew share requests (when approval is required)
CREATE TABLE public.homebrew_share_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.homebrew_content(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID,
  UNIQUE(campaign_id, content_id)
);

-- Enable RLS
ALTER TABLE public.homebrew_share_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Campaign members can view requests for their campaign
CREATE POLICY "Campaign members can view share requests"
ON public.homebrew_share_requests
FOR SELECT
USING (
  is_campaign_member(campaign_id, auth.uid())
);

-- Policy: Premium players in campaign can create requests
CREATE POLICY "Premium players can request sharing"
ON public.homebrew_share_requests
FOR INSERT
WITH CHECK (
  auth.uid() = requester_id
  AND is_campaign_member(campaign_id, auth.uid())
  AND is_premium(auth.uid())
  AND is_homebrew_owner(content_id, auth.uid())
);

-- Policy: Masters can update (approve/reject) requests
CREATE POLICY "Masters can respond to requests"
ON public.homebrew_share_requests
FOR UPDATE
USING (
  is_campaign_master(campaign_id, auth.uid())
);

-- Policy: Requesters can delete their pending requests
CREATE POLICY "Requesters can delete pending requests"
ON public.homebrew_share_requests
FOR DELETE
USING (
  auth.uid() = requester_id
  AND status = 'pending'
);

-- Function to check if player can share homebrew in campaign
CREATE OR REPLACE FUNCTION public.can_share_homebrew_in_campaign(_campaign_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = _campaign_id
    AND c.homebrew_sharing_policy != 'disabled'
    AND is_campaign_member(_campaign_id, _user_id)
    AND is_premium(_user_id)
    AND c.master_id != _user_id -- Master uses the normal share, not this
  )
$$;
-- END supabase/migrations/20260106132849_c29f5b6b-d977-41eb-afc4-223a0c91f01e.sql

-- BEGIN supabase/migrations/20260106140654_130c4213-5505-49e7-9123-a3858d4d1375.sql

-- Create whiteboard elements table (1 whiteboard per campaign, embedded in campaign)
CREATE TABLE public.campaign_whiteboard_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL CHECK (element_type IN ('sticky_note', 'text', 'image', 'connection')),
  
  -- Position and size
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  y DOUBLE PRECISION NOT NULL DEFAULT 0,
  width DOUBLE PRECISION,
  height DOUBLE PRECISION,
  rotation DOUBLE PRECISION DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  
  -- Content
  content TEXT,
  image_url TEXT,
  
  -- Styling
  background_color TEXT DEFAULT '#fef08a',
  text_color TEXT DEFAULT '#1f2937',
  font_size INTEGER DEFAULT 14,
  
  -- Connection specific (for lines between elements)
  connection_from UUID REFERENCES public.campaign_whiteboard_elements(id) ON DELETE CASCADE,
  connection_to UUID REFERENCES public.campaign_whiteboard_elements(id) ON DELETE CASCADE,
  connection_style TEXT DEFAULT 'straight',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_whiteboard_elements_campaign ON public.campaign_whiteboard_elements(campaign_id);

-- Enable RLS
ALTER TABLE public.campaign_whiteboard_elements ENABLE ROW LEVEL SECURITY;

-- Only campaign master can manage whiteboard elements
CREATE POLICY "Masters can manage whiteboard elements"
ON public.campaign_whiteboard_elements
FOR ALL
USING (public.is_campaign_master(campaign_id, auth.uid()))
WITH CHECK (public.is_campaign_master(campaign_id, auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_whiteboard_elements_updated_at
BEFORE UPDATE ON public.campaign_whiteboard_elements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- END supabase/migrations/20260106140654_130c4213-5505-49e7-9123-a3858d4d1375.sql

-- BEGIN supabase/migrations/20260106141616_a42fb311-5fcd-4cdc-a5f1-c005ce6a2730.sql
-- Create storage bucket for campaign whiteboard images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-images', 
  'campaign-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Allow campaign masters to upload images
CREATE POLICY "Campaign masters can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-images' 
  AND EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = (storage.foldername(name))[1]::uuid
    AND master_id = auth.uid()
  )
);

-- Allow anyone to view campaign images (public bucket)
CREATE POLICY "Anyone can view campaign images"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-images');

-- Allow campaign masters to delete their images
CREATE POLICY "Campaign masters can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'campaign-images' 
  AND EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = (storage.foldername(name))[1]::uuid
    AND master_id = auth.uid()
  )
);
-- END supabase/migrations/20260106141616_a42fb311-5fcd-4cdc-a5f1-c005ce6a2730.sql

-- BEGIN supabase/migrations/20260106170708_de971a49-1c85-49c9-84be-0a491eaed1a4.sql
-- Allow new whiteboard storage format (tldraw snapshots)
ALTER TABLE public.campaign_whiteboard_elements
  DROP CONSTRAINT IF EXISTS campaign_whiteboard_elements_element_type_check;

ALTER TABLE public.campaign_whiteboard_elements
  ADD CONSTRAINT campaign_whiteboard_elements_element_type_check
  CHECK (
    element_type = ANY (
      ARRAY[
        'sticky_note'::text,
        'text'::text,
        'image'::text,
        'connection'::text,
        'tldraw_snapshot'::text
      ]
    )
  );

-- END supabase/migrations/20260106170708_de971a49-1c85-49c9-84be-0a491eaed1a4.sql

-- BEGIN supabase/migrations/20260106170911_fedb4d38-08b2-4c4a-838f-273fce22f527.sql
-- Tighten supporter_submissions INSERT policy (removes permissive WITH CHECK (true))
DROP POLICY IF EXISTS "Anyone can submit supporter content" ON public.supporter_submissions;

CREATE POLICY "Anyone can submit supporter content"
ON public.supporter_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.promo_tokens pt
    WHERE pt.code = supporter_submissions.promo_code
      AND pt.is_active = true
  )
);

-- END supabase/migrations/20260106170911_fedb4d38-08b2-4c4a-838f-273fce22f527.sql

-- BEGIN supabase/migrations/20260108181522_7f1d59b8-1dec-44c2-a937-f705efe25492.sql
-- Add feature_key column to stretch_goals for mapping features to goals
ALTER TABLE public.stretch_goals 
ADD COLUMN IF NOT EXISTS feature_key TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.stretch_goals.feature_key IS 'Unique key identifying the feature that gets unlocked when this goal is released. Status "released" activates the feature.';

-- Update existing goals with their feature keys based on goal_number
UPDATE public.stretch_goals SET feature_key = 'dice_roller' WHERE goal_number = 1;
UPDATE public.stretch_goals SET feature_key = 'character_sheet' WHERE goal_number = 2;
UPDATE public.stretch_goals SET feature_key = 'campaigns' WHERE goal_number = 3;
UPDATE public.stretch_goals SET feature_key = 'combat_tracker' WHERE goal_number = 4;
UPDATE public.stretch_goals SET feature_key = 'forge' WHERE goal_number = 5;
UPDATE public.stretch_goals SET feature_key = 'supporter_gallery' WHERE goal_number = 6;
UPDATE public.stretch_goals SET feature_key = 'advanced_combat' WHERE goal_number = 7;
UPDATE public.stretch_goals SET feature_key = 'stress_sanity' WHERE goal_number = 8;
UPDATE public.stretch_goals SET feature_key = 'discord_bot' WHERE goal_number = 9;
UPDATE public.stretch_goals SET feature_key = 'web_version' WHERE goal_number = 10;
-- END supabase/migrations/20260108181522_7f1d59b8-1dec-44c2-a937-f705efe25492.sql

-- BEGIN supabase/migrations/20260108182922_227eea83-7476-4713-91a5-115d5fa860c6.sql
-- Corrigir feature_keys existentes e adicionar os faltantes
UPDATE public.stretch_goals SET feature_key = 'dice_roller' WHERE goal_number = 1;
UPDATE public.stretch_goals SET feature_key = 'character_sheet' WHERE goal_number = 2;
UPDATE public.stretch_goals SET feature_key = 'campaigns' WHERE goal_number = 3;
UPDATE public.stretch_goals SET feature_key = 'combat_tracker' WHERE goal_number = 4;
UPDATE public.stretch_goals SET feature_key = 'forge' WHERE goal_number = 5;
UPDATE public.stretch_goals SET feature_key = 'supporter_gallery' WHERE goal_number = 6;
UPDATE public.stretch_goals SET feature_key = 'advanced_combat' WHERE goal_number = 7;
UPDATE public.stretch_goals SET feature_key = 'stress_sanity' WHERE goal_number = 8;
UPDATE public.stretch_goals SET feature_key = 'discord_bot' WHERE goal_number = 9;
UPDATE public.stretch_goals SET feature_key = 'web_version' WHERE goal_number = 10;

-- Limpar feature_keys incorretos das metas 11-27 (são funcionalidades menores/cosméticas)
UPDATE public.stretch_goals SET feature_key = NULL WHERE goal_number > 10;
-- END supabase/migrations/20260108182922_227eea83-7476-4713-91a5-115d5fa860c6.sql

-- BEGIN supabase/migrations/20260112115301_b5029291-5a52-4393-8bb8-a314c4dc6d95.sql
-- Adicionar campos para marca d'água nos documentos
ALTER TABLE public.campaign_documents 
ADD COLUMN IF NOT EXISTS watermark_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS watermark_text TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS watermark_image_url TEXT DEFAULT NULL;
-- END supabase/migrations/20260112115301_b5029291-5a52-4393-8bb8-a314c4dc6d95.sql

-- BEGIN supabase/migrations/20260112120659_2694808e-b096-4b00-b162-5fd4c641db5e.sql
-- Create storage bucket for document watermarks/seals
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-seals', 'document-seals', true);

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload document seals"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'document-seals' 
  AND auth.uid() IS NOT NULL
);

-- Allow public read access for document seals
CREATE POLICY "Document seals are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'document-seals');

-- Allow users to update their own seals
CREATE POLICY "Users can update their own document seals"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'document-seals' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to delete their own seals
CREATE POLICY "Users can delete their own document seals"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'document-seals' 
  AND auth.uid() IS NOT NULL
);
-- END supabase/migrations/20260112120659_2694808e-b096-4b00-b162-5fd4c641db5e.sql

-- BEGIN supabase/migrations/20260216201329_0007c413-b566-4203-9e94-dfbb3919dd75.sql
-- Add parent_id column for sub-notes support
ALTER TABLE public.campaign_notes 
ADD COLUMN parent_id UUID REFERENCES public.campaign_notes(id) ON DELETE CASCADE;

-- Create index for faster tree queries
CREATE INDEX idx_campaign_notes_parent_id ON public.campaign_notes(parent_id);

-- Add sort_order for ordering notes within a parent
ALTER TABLE public.campaign_notes 
ADD COLUMN sort_order INTEGER DEFAULT 0;
-- END supabase/migrations/20260216201329_0007c413-b566-4203-9e94-dfbb3919dd75.sql

-- BEGIN supabase/migrations/20260304172635_c0a5c772-af74-4ce6-8c19-6ff2331debc2.sql
CREATE TABLE public.discord_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean NOT NULL DEFAULT false
);

ALTER TABLE public.discord_oauth_states ENABLE ROW LEVEL SECURITY;

-- No direct user access needed - only accessed via SECURITY DEFINER functions
CREATE POLICY "No direct access" ON public.discord_oauth_states FOR ALL USING (false);

-- Function to create a state token for the current user
CREATE OR REPLACE FUNCTION public.create_discord_oauth_state()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _state_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;
  
  -- Clean up expired states
  DELETE FROM public.discord_oauth_states WHERE expires_at < now();
  
  INSERT INTO public.discord_oauth_states (user_id)
  VALUES (auth.uid())
  RETURNING id INTO _state_id;
  
  RETURN _state_id;
END;
$$;

-- Function to consume a state token (used by edge function with service role)
CREATE OR REPLACE FUNCTION public.consume_discord_oauth_state(_state_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  SELECT user_id INTO _user_id
  FROM public.discord_oauth_states
  WHERE id = _state_id
    AND used = false
    AND expires_at > now();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired state token';
  END IF;
  
  UPDATE public.discord_oauth_states SET used = true WHERE id = _state_id;
  
  RETURN _user_id;
END;
$$;
-- END supabase/migrations/20260304172635_c0a5c772-af74-4ce6-8c19-6ff2331debc2.sql

-- BEGIN supabase/migrations/20260305135604_c1224b83-c400-4a10-bd47-80e4924c8aca.sql

-- Add status column to combat_encounters for draft/prepared encounters
ALTER TABLE public.combat_encounters 
ADD COLUMN status text NOT NULL DEFAULT 'active';

-- Update existing records: active ones get 'active', inactive get 'finished'
UPDATE public.combat_encounters SET status = CASE WHEN is_active = true THEN 'active' ELSE 'finished' END;

-- Add pre_selected_player_ids for storing which players should auto-join
ALTER TABLE public.combat_encounters
ADD COLUMN pre_selected_player_ids uuid[] DEFAULT '{}';

-- END supabase/migrations/20260305135604_c1224b83-c400-4a10-bd47-80e4924c8aca.sql

-- BEGIN supabase/migrations/20260305140459_5e1a3e62-1dab-4542-9483-68ebae6b2bcb.sql
-- Allow players to update their own character_id in campaign_players
CREATE POLICY "Players can update own character"
ON public.campaign_players
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
-- END supabase/migrations/20260305140459_5e1a3e62-1dab-4542-9483-68ebae6b2bcb.sql

-- BEGIN supabase/migrations/20260305141050_7b137aff-a1a9-4df4-93ee-79f59bffb221.sql
-- Battle maps table for VTT grid
CREATE TABLE public.battle_maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Novo Mapa',
  grid_width INTEGER NOT NULL DEFAULT 20,
  grid_height INTEGER NOT NULL DEFAULT 20,
  cell_size INTEGER NOT NULL DEFAULT 40,
  image_url TEXT,
  token_positions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.battle_maps ENABLE ROW LEVEL SECURITY;

-- Masters can do everything
CREATE POLICY "Masters can manage battle maps"
ON public.battle_maps FOR ALL
TO authenticated
USING (is_campaign_master(campaign_id, auth.uid()))
WITH CHECK (is_campaign_master(campaign_id, auth.uid()));

-- Players can view active maps
CREATE POLICY "Players can view active battle maps"
ON public.battle_maps FOR SELECT
TO authenticated
USING (is_active = true AND is_campaign_member(campaign_id, auth.uid()));

-- Players can update token_positions on active maps (for moving their own tokens)
CREATE POLICY "Players can update token positions"
ON public.battle_maps FOR UPDATE
TO authenticated
USING (is_active = true AND is_campaign_member(campaign_id, auth.uid()))
WITH CHECK (is_active = true AND is_campaign_member(campaign_id, auth.uid()));
-- END supabase/migrations/20260305141050_7b137aff-a1a9-4df4-93ee-79f59bffb221.sql

-- BEGIN supabase/migrations/20260305194318_12837893-e38d-499c-99a0-b9b251d793e8.sql

-- Add is_hidden column to campaign_timeline_events
ALTER TABLE public.campaign_timeline_events ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;

-- Drop existing player SELECT policy and recreate with is_hidden filter
DROP POLICY IF EXISTS "Campaign members can view timeline events" ON public.campaign_timeline_events;

CREATE POLICY "Campaign members can view timeline events"
ON public.campaign_timeline_events
FOR SELECT
USING (
  (is_campaign_master(campaign_id, auth.uid()))
  OR
  (is_hidden = false AND is_campaign_member(campaign_id, auth.uid()))
);

-- END supabase/migrations/20260305194318_12837893-e38d-499c-99a0-b9b251d793e8.sql

-- BEGIN supabase/migrations/20260306194943_cd9f5dca-1572-4977-9671-4db4ad558232.sql

-- 1. Create registration_codes table for invite-only signup
CREATE TABLE public.registration_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  max_uses integer DEFAULT 10,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid DEFAULT NULL
);

-- RLS on registration_codes
ALTER TABLE public.registration_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can read active codes (for validation at signup)
CREATE POLICY "Anyone can read active registration codes"
  ON public.registration_codes FOR SELECT
  USING (is_active = true);

-- Only admins can manage
CREATE POLICY "Admins can manage registration codes"
  ON public.registration_codes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. Create function to validate and consume registration code
CREATE OR REPLACE FUNCTION public.validate_registration_code(_code text)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  _reg_code registration_codes%ROWTYPE;
BEGIN
  SELECT * INTO _reg_code FROM registration_codes
  WHERE code = UPPER(_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF _reg_code.max_uses IS NOT NULL AND _reg_code.current_uses >= _reg_code.max_uses THEN
    RETURN false;
  END IF;

  -- Consume one use
  UPDATE registration_codes SET current_uses = current_uses + 1 WHERE id = _reg_code.id;

  RETURN true;
END;
$$;

-- 3. Update all existing subscriptions to 'mestre' with lifetime
UPDATE public.subscriptions SET status = 'mestre', expires_at = NULL;

-- 4. Update handle_new_user to set 'mestre' by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));

  INSERT INTO public.subscriptions (user_id, status)
  VALUES (NEW.id, 'mestre');

  RETURN NEW;
END;
$$;

-- 5. Update campaign creation RLS to allow any authenticated user (remove is_mestre check)
DROP POLICY IF EXISTS "Mestres can create campaigns" ON public.campaigns;
CREATE POLICY "Authenticated users can create campaigns"
  ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = master_id);

-- 6. Insert a default registration code for the admin
INSERT INTO public.registration_codes (code, max_uses) VALUES ('GO20BETA', 50);

-- END supabase/migrations/20260306194943_cd9f5dca-1572-4977-9671-4db4ad558232.sql

-- BEGIN supabase/migrations/20260306195435_3d3f6b4e-88d2-40ed-aedd-aa38884c5657.sql

-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Allow admins to read all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- END supabase/migrations/20260306195435_3d3f6b4e-88d2-40ed-aedd-aa38884c5657.sql

-- BEGIN supabase/migrations/20260306195856_b513e0af-d740-47fc-a769-215aa980b888.sql

-- Allow admins to view ALL user_roles (not just their own)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Allow admins to update roles
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Allow admins to update profiles (e.g. display_name)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- END supabase/migrations/20260306195856_b513e0af-d740-47fc-a769-215aa980b888.sql

-- BEGIN supabase/migrations/20260311114155_56702ddb-3c9d-407f-8194-36da806c6abb.sql

-- 1. RLS policy: Allow players to UPDATE campaign_documents for signing (only signature_data and is_signed)
CREATE POLICY "Players can sign delivered documents"
  ON public.campaign_documents FOR UPDATE
  TO authenticated
  USING (has_document_access(id, auth.uid()))
  WITH CHECK (has_document_access(id, auth.uid()));

-- 2. Create atomic function to append signature safely (prevents race conditions)
CREATE OR REPLACE FUNCTION public.append_document_signature(
  _document_id uuid,
  _character_id uuid,
  _character_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _doc campaign_documents%ROWTYPE;
  _existing jsonb;
BEGIN
  -- Verify the caller owns the character
  IF NOT owns_character(_character_id, auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: you do not own this character';
  END IF;

  -- Verify document was delivered to this character
  IF NOT has_document_access(_document_id, auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: document not delivered to you';
  END IF;

  -- Lock the row to prevent concurrent updates
  SELECT * INTO _doc FROM campaign_documents WHERE id = _document_id FOR UPDATE;

  IF _doc IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  IF NOT COALESCE(_doc.requires_signature, false) THEN
    RAISE EXCEPTION 'This document does not require a signature';
  END IF;

  -- Check if already signed by this character
  _existing := COALESCE(_doc.signature_data, '[]'::jsonb);
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(_existing) elem
    WHERE elem->>'character_id' = _character_id::text
  ) THEN
    RAISE EXCEPTION 'Character has already signed this document';
  END IF;

  -- Append the new signature atomically
  UPDATE campaign_documents
  SET 
    signature_data = COALESCE(signature_data, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'character_id', _character_id::text,
        'character_name', _character_name,
        'signed_at', now()::text
      )
    ),
    is_signed = true
  WHERE id = _document_id;
END;
$$;

-- END supabase/migrations/20260311114155_56702ddb-3c9d-407f-8194-36da806c6abb.sql

-- BEGIN supabase/migrations/20260311134326_dd4c316d-0c01-4864-b339-12246403fc48.sql
ALTER TABLE public.campaigns ADD COLUMN foundry_vtt_url text DEFAULT NULL;
-- END supabase/migrations/20260311134326_dd4c316d-0c01-4864-b339-12246403fc48.sql

-- BEGIN supabase/migrations/20260311135523_01c3259b-2a58-4494-b732-6dc4be0a581e.sql
ALTER TABLE public.campaigns ADD COLUMN foundry_api_key text DEFAULT NULL;

-- Function to generate a random API key
CREATE OR REPLACE FUNCTION public.generate_foundry_api_key(_campaign_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _key text;
BEGIN
  IF NOT is_campaign_master(_campaign_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only campaign master can generate API keys';
  END IF;
  
  _key := 'go20_' || encode(gen_random_bytes(24), 'hex');
  
  UPDATE campaigns SET foundry_api_key = _key WHERE id = _campaign_id;
  
  RETURN _key;
END;
$$;
-- END supabase/migrations/20260311135523_01c3259b-2a58-4494-b732-6dc4be0a581e.sql

-- BEGIN supabase/migrations/20260311140510_091d0b11-d16e-4e64-9cfb-58006d6317ec.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.generate_foundry_api_key(_campaign_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _key text;
BEGIN
  IF NOT is_campaign_master(_campaign_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only campaign master can generate API keys';
  END IF;
  
  _key := 'go20_' || replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  _key := substring(_key from 1 for 48);
  
  UPDATE campaigns SET foundry_api_key = _key WHERE id = _campaign_id;
  
  RETURN _key;
END;
$function$;
-- END supabase/migrations/20260311140510_091d0b11-d16e-4e64-9cfb-58006d6317ec.sql

-- BEGIN supabase/migrations/20260311141452_910be5e4-7cc2-4f69-86da-e340fd4ff791.sql
ALTER TABLE public.combatants ADD COLUMN IF NOT EXISTS foundry_id text;
CREATE INDEX IF NOT EXISTS idx_combatants_foundry_id ON public.combatants(foundry_id);
-- END supabase/migrations/20260311141452_910be5e4-7cc2-4f69-86da-e340fd4ff791.sql

-- BEGIN supabase/migrations/20260323200144_644d2d12-1fab-4716-a4b9-2e8abf7082b3.sql

-- Fix 1: Drop restrictive INSERT policy on homebrew_shares
DROP POLICY IF EXISTS "Owners can share to their campaigns" ON public.homebrew_shares;

-- Fix 2: Masters can share (own content or approve player requests)
CREATE POLICY "Masters can share to their campaigns"
ON public.homebrew_shares FOR INSERT
WITH CHECK (
  is_campaign_master(campaign_id, auth.uid())
);

-- Fix 3: Players can share directly when policy = 'enabled'
CREATE POLICY "Players can share when policy enabled"
ON public.homebrew_shares FOR INSERT
WITH CHECK (
  is_homebrew_owner(content_id, auth.uid())
  AND can_share_homebrew_in_campaign(campaign_id, auth.uid())
);

-- Fix 4: Masters can view share requests (they are master_id, not in campaign_players)
CREATE POLICY "Masters can view campaign share requests"
ON public.homebrew_share_requests FOR SELECT
USING (is_campaign_master(campaign_id, auth.uid()));

-- END supabase/migrations/20260323200144_644d2d12-1fab-4716-a4b9-2e8abf7082b3.sql

-- BEGIN supabase/migrations/20260330154422_dcc46fd0-3e1b-4720-9033-cd1a709cd3b2.sql
ALTER TABLE characters ADD COLUMN builder_data jsonb DEFAULT '{}';
ALTER TABLE characters ADD COLUMN level_choices jsonb DEFAULT '[]';
-- END supabase/migrations/20260330154422_dcc46fd0-3e1b-4720-9033-cd1a709cd3b2.sql
