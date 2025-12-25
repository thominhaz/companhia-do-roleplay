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