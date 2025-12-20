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