-- Create enum for homebrew sharing policy
CREATE TYPE public.homebrew_sharing_policy AS ENUM ('disabled', 'enabled', 'approval_required');

-- Add sharing policy to campaigns
ALTER TABLE public.campaigns 
ADD COLUMN homebrew_sharing_policy homebrew_sharing_policy NOT NULL DEFAULT 'disabled';

-- Create table for homebrew share requests (when approval is required)
CREATE TABLE public.homebrew_share_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.homebrew_content(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID,
  UNIQUE(campaign_id, content_id)
);

-- Enable RLS
ALTER TABLE public.homebrew_share_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Campaign members can view requests for their campaign
CREATE POLICY "Campaign members can view share requests"
ON public.homebrew_share_requests
FOR SELECT
USING (
  is_campaign_member(campaign_id, auth.uid())
);

-- Policy: Premium players in campaign can create requests
CREATE POLICY "Premium players can request sharing"
ON public.homebrew_share_requests
FOR INSERT
WITH CHECK (
  auth.uid() = requester_id
  AND is_campaign_member(campaign_id, auth.uid())
  AND is_premium(auth.uid())
  AND is_homebrew_owner(content_id, auth.uid())
);

-- Policy: Masters can update (approve/reject) requests
CREATE POLICY "Masters can respond to requests"
ON public.homebrew_share_requests
FOR UPDATE
USING (
  is_campaign_master(campaign_id, auth.uid())
);

-- Policy: Requesters can delete their pending requests
CREATE POLICY "Requesters can delete pending requests"
ON public.homebrew_share_requests
FOR DELETE
USING (
  auth.uid() = requester_id
  AND status = 'pending'
);

-- Function to check if player can share homebrew in campaign
CREATE OR REPLACE FUNCTION public.can_share_homebrew_in_campaign(_campaign_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = _campaign_id
    AND c.homebrew_sharing_policy != 'disabled'
    AND is_campaign_member(_campaign_id, _user_id)
    AND is_premium(_user_id)
    AND c.master_id != _user_id -- Master uses the normal share, not this
  )
$$;