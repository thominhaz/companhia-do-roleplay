ALTER TABLE public.combatants ADD COLUMN IF NOT EXISTS foundry_id text;
CREATE INDEX IF NOT EXISTS idx_combatants_foundry_id ON public.combatants(foundry_id);