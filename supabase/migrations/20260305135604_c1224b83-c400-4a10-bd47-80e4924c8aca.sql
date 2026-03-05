
-- Add status column to combat_encounters for draft/prepared encounters
ALTER TABLE public.combat_encounters 
ADD COLUMN status text NOT NULL DEFAULT 'active';

-- Update existing records: active ones get 'active', inactive get 'finished'
UPDATE public.combat_encounters SET status = CASE WHEN is_active = true THEN 'active' ELSE 'finished' END;

-- Add pre_selected_player_ids for storing which players should auto-join
ALTER TABLE public.combat_encounters
ADD COLUMN pre_selected_player_ids uuid[] DEFAULT '{}';
