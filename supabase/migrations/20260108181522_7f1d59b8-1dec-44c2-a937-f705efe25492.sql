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