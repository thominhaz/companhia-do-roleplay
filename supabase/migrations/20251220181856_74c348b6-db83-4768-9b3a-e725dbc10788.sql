-- Add is_archived column to characters table
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_characters_is_archived ON public.characters(is_archived);