ALTER TABLE public.campaigns ADD COLUMN foundry_api_key text DEFAULT NULL;

-- Function to generate a random API key
CREATE OR REPLACE FUNCTION public.generate_foundry_api_key(_campaign_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _key text;
BEGIN
  IF NOT is_campaign_master(_campaign_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only campaign master can generate API keys';
  END IF;
  
  _key := 'go20_' || encode(gen_random_bytes(24), 'hex');
  
  UPDATE campaigns SET foundry_api_key = _key WHERE id = _campaign_id;
  
  RETURN _key;
END;
$$;