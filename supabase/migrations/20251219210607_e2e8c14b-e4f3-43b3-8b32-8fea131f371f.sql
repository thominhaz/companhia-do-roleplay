-- Create helper functions to avoid RLS cross-table recursion
CREATE OR REPLACE FUNCTION public.is_campaign_master(_campaign_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = _campaign_id
      AND c.master_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_campaign_member(_campaign_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaign_players cp
    WHERE cp.campaign_id = _campaign_id
      AND cp.user_id = _user_id
  );
$$;

-- Rebuild SELECT policies to use the functions (prevents infinite recursion)

-- campaigns
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Players can view joined campaigns" ON public.campaigns;

CREATE POLICY "Users can view campaigns they master or joined"
ON public.campaigns
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    auth.uid() = master_id
    OR public.is_campaign_member(id, auth.uid())
  )
);

-- campaign_players
DROP POLICY IF EXISTS "Users can view campaign players" ON public.campaign_players;

CREATE POLICY "Users can view players in their campaigns"
ON public.campaign_players
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR public.is_campaign_master(campaign_id, auth.uid())
    OR public.is_campaign_member(campaign_id, auth.uid())
  )
);

-- sessions
DROP POLICY IF EXISTS "Users can view sessions of campaigns they are in" ON public.sessions;

CREATE POLICY "Users can view sessions in their campaigns"
ON public.sessions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    public.is_campaign_master(campaign_id, auth.uid())
    OR public.is_campaign_member(campaign_id, auth.uid())
  )
);

-- Keep existing management policies (masters can manage ...) as-is