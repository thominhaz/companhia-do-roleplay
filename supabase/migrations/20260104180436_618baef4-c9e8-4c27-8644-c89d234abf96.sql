-- Add campaign appearance customization columns
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'auto',
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'wand';

-- Add comment for documentation
COMMENT ON COLUMN public.campaigns.theme_color IS 'Campaign theme color: auto (based on status), emerald, orange, blue, purple, red, amber';
COMMENT ON COLUMN public.campaigns.icon IS 'Campaign icon: wand, skull, swords, shield, book, dragon, crown, castle, scroll, fire';