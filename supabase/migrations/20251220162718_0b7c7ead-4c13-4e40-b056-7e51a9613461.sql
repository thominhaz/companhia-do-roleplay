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