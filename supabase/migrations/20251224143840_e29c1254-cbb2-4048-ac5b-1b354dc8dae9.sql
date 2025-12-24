-- Drop the security definer view as it's problematic
DROP VIEW IF EXISTS public.campaigns_secure;

-- Instead, create a security definer function to safely check if user can see webhook
-- This function will be used by the application to get webhook URL only for masters
CREATE OR REPLACE FUNCTION public.get_campaign_webhook_url(campaign_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _webhook_url TEXT;
  _master_id UUID;
BEGIN
  -- Get campaign master_id and webhook
  SELECT c.master_id, c.discord_webhook_url 
  INTO _master_id, _webhook_url
  FROM campaigns c
  WHERE c.id = campaign_id;
  
  -- Only return webhook if caller is the master
  IF _master_id = auth.uid() THEN
    RETURN _webhook_url;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_campaign_webhook_url(UUID) TO authenticated;