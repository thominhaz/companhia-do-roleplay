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