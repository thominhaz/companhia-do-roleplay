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