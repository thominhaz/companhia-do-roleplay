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