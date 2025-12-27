-- Add physical appearance and additional backstory fields to characters table
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS age text,
ADD COLUMN IF NOT EXISTS height text,
ADD COLUMN IF NOT EXISTS weight text,
ADD COLUMN IF NOT EXISTS eyes text,
ADD COLUMN IF NOT EXISTS hair text,
ADD COLUMN IF NOT EXISTS skin text,
ADD COLUMN IF NOT EXISTS distinctive_features text,
ADD COLUMN IF NOT EXISTS goals text,
ADD COLUMN IF NOT EXISTS allies_organizations text;