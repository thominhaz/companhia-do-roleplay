-- Fix campaigns SELECT policy to explicitly require authentication
DROP POLICY IF EXISTS "Members can view campaigns" ON public.campaigns;

CREATE POLICY "Members can view campaigns" 
ON public.campaigns 
FOR SELECT 
TO authenticated
USING (
  (auth.uid() = master_id) OR 
  (EXISTS (
    SELECT 1 FROM campaign_players
    WHERE campaign_players.campaign_id = campaigns.id 
    AND campaign_players.user_id = auth.uid()
  ))
);

-- Update SECURITY DEFINER functions to include authorization checks
-- These functions should only return true data for the calling user

CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE user_id = _user_id 
        AND status = 'premium'
        AND (expires_at IS NULL OR expires_at > NOW())
      )
    ELSE FALSE
  END;
$$;

CREATE OR REPLACE FUNCTION public.count_user_characters(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      COALESCE(COUNT(*)::INTEGER, 0)
    ELSE 0
  END
  FROM public.characters 
  WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.can_create_character(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      public.is_premium(_user_id) OR public.count_user_characters(_user_id) < 3
    ELSE FALSE
  END;
$$;