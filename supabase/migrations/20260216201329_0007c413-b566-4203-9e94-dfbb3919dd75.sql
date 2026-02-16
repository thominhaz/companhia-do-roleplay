-- Add parent_id column for sub-notes support
ALTER TABLE public.campaign_notes 
ADD COLUMN parent_id UUID REFERENCES public.campaign_notes(id) ON DELETE CASCADE;

-- Create index for faster tree queries
CREATE INDEX idx_campaign_notes_parent_id ON public.campaign_notes(parent_id);

-- Add sort_order for ordering notes within a parent
ALTER TABLE public.campaign_notes 
ADD COLUMN sort_order INTEGER DEFAULT 0;