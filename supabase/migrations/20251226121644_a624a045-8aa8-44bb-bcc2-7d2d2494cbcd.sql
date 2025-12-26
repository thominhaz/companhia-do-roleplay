
-- Create faction events table for historical events that affect reputation
CREATE TABLE public.campaign_faction_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  faction_id UUID NOT NULL REFERENCES public.campaign_factions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT, -- In-game date (can be fictional like "Year 1045, Winter")
  reputation_change INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.campaign_faction_events ENABLE ROW LEVEL SECURITY;

-- Masters can manage faction events
CREATE POLICY "Masters can manage faction events"
ON public.campaign_faction_events
FOR ALL
USING (public.is_campaign_master(campaign_id, auth.uid()));

-- Campaign members can view faction events
CREATE POLICY "Campaign members can view faction events"
ON public.campaign_faction_events
FOR SELECT
USING (public.is_campaign_member(campaign_id, auth.uid()) OR public.is_campaign_master(campaign_id, auth.uid()));

-- Add index for performance
CREATE INDEX idx_faction_events_faction ON public.campaign_faction_events(faction_id);
CREATE INDEX idx_faction_events_campaign ON public.campaign_faction_events(campaign_id);
