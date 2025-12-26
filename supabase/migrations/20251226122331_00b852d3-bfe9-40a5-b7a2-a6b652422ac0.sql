
-- Create campaign timeline events table
CREATE TABLE public.campaign_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL, -- In-game date (fictional like "Year 1045, Winter")
  icon TEXT DEFAULT 'calendar',
  color TEXT DEFAULT 'primary',
  image_url TEXT,
  is_major_event BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.campaign_timeline_events ENABLE ROW LEVEL SECURITY;

-- Masters can manage timeline events
CREATE POLICY "Masters can manage timeline events"
ON public.campaign_timeline_events
FOR ALL
USING (public.is_campaign_master(campaign_id, auth.uid()));

-- Campaign members can view timeline events
CREATE POLICY "Campaign members can view timeline events"
ON public.campaign_timeline_events
FOR SELECT
USING (public.is_campaign_member(campaign_id, auth.uid()) OR public.is_campaign_master(campaign_id, auth.uid()));

-- Add indexes for performance
CREATE INDEX idx_timeline_events_campaign ON public.campaign_timeline_events(campaign_id);
CREATE INDEX idx_timeline_events_sort ON public.campaign_timeline_events(campaign_id, sort_order);

-- Add trigger for updated_at
CREATE TRIGGER update_timeline_events_updated_at
BEFORE UPDATE ON public.campaign_timeline_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
