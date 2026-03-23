
-- Fix 1: Drop restrictive INSERT policy on homebrew_shares
DROP POLICY IF EXISTS "Owners can share to their campaigns" ON public.homebrew_shares;

-- Fix 2: Masters can share (own content or approve player requests)
CREATE POLICY "Masters can share to their campaigns"
ON public.homebrew_shares FOR INSERT
WITH CHECK (
  is_campaign_master(campaign_id, auth.uid())
);

-- Fix 3: Players can share directly when policy = 'enabled'
CREATE POLICY "Players can share when policy enabled"
ON public.homebrew_shares FOR INSERT
WITH CHECK (
  is_homebrew_owner(content_id, auth.uid())
  AND can_share_homebrew_in_campaign(campaign_id, auth.uid())
);

-- Fix 4: Masters can view share requests (they are master_id, not in campaign_players)
CREATE POLICY "Masters can view campaign share requests"
ON public.homebrew_share_requests FOR SELECT
USING (is_campaign_master(campaign_id, auth.uid()));
