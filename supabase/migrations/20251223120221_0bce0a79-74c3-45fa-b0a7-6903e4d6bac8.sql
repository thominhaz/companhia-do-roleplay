-- Fix infinite recursion between RLS policies on homebrew_content and homebrew_shares
-- by removing direct references from homebrew_shares policies to homebrew_content.
-- Use SECURITY DEFINER function to check ownership safely.

-- 1) Helper function: is the authenticated user the owner of a homebrew content item?
CREATE OR REPLACE FUNCTION public.is_homebrew_owner(_content_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.homebrew_content hc
    WHERE hc.id = _content_id
      AND hc.user_id = _user_id
  );
$$;

-- 2) Replace homebrew_shares policies to avoid querying homebrew_content inside policies
DROP POLICY IF EXISTS "Owners can share to their campaigns" ON public.homebrew_shares;
DROP POLICY IF EXISTS "Owners and masters can view shares" ON public.homebrew_shares;
DROP POLICY IF EXISTS "Campaign members can view campaign shares" ON public.homebrew_shares;
DROP POLICY IF EXISTS "Owners and masters can delete shares" ON public.homebrew_shares;

-- SELECT: campaign members, campaign masters, or the content owner can see share links
CREATE POLICY "Campaign members can view campaign shares"
ON public.homebrew_shares
FOR SELECT
USING (
  public.is_campaign_member(campaign_id, auth.uid())
  OR public.is_campaign_master(campaign_id, auth.uid())
  OR public.is_homebrew_owner(content_id, auth.uid())
);

-- INSERT: only the content owner can share, and only to campaigns they master
CREATE POLICY "Owners can share to their campaigns"
ON public.homebrew_shares
FOR INSERT
WITH CHECK (
  public.is_homebrew_owner(content_id, auth.uid())
  AND public.is_campaign_master(campaign_id, auth.uid())
);

-- DELETE: content owner or campaign master can remove the share
CREATE POLICY "Owners and masters can delete shares"
ON public.homebrew_shares
FOR DELETE
USING (
  public.is_homebrew_owner(content_id, auth.uid())
  OR public.is_campaign_master(campaign_id, auth.uid())
);
