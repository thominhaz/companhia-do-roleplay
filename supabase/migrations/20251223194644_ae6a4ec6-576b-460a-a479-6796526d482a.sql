-- Add conditions field to characters table for combat sync
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS conditions text[] DEFAULT '{}';

-- Add comment explaining the field
COMMENT ON COLUMN public.characters.conditions IS 'Active conditions on the character, synced with combat';