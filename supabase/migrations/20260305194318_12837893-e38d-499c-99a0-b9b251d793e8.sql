
-- Add is_hidden column to campaign_timeline_events
ALTER TABLE public.campaign_timeline_events ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;

-- Drop existing player SELECT policy and recreate with is_hidden filter
DROP POLICY IF EXISTS "Campaign members can view timeline events" ON public.campaign_timeline_events;

CREATE POLICY "Campaign members can view timeline events"
ON public.campaign_timeline_events
FOR SELECT
USING (
  (is_campaign_master(campaign_id, auth.uid()))
  OR
  (is_hidden = false AND is_campaign_member(campaign_id, auth.uid()))
);
