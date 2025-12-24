-- Create a view that hides discord_webhook_url from non-masters
-- This ensures only campaign masters can see webhook URLs

CREATE OR REPLACE VIEW public.campaigns_secure AS
SELECT 
  id,
  name,
  description,
  image_url,
  invite_code,
  master_id,
  created_at,
  updated_at,
  CASE 
    WHEN auth.uid() = master_id THEN discord_webhook_url 
    ELSE NULL 
  END AS discord_webhook_url
FROM public.campaigns;

-- Grant access to the view
GRANT SELECT ON public.campaigns_secure TO authenticated;
GRANT SELECT ON public.campaigns_secure TO anon;

-- Add comment explaining the view
COMMENT ON VIEW public.campaigns_secure IS 'Secure view of campaigns that hides discord_webhook_url from non-masters';