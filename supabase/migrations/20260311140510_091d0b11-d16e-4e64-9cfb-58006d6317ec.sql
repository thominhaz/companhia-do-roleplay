CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.generate_foundry_api_key(_campaign_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _key text;
BEGIN
  IF NOT is_campaign_master(_campaign_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only campaign master can generate API keys';
  END IF;
  
  _key := 'go20_' || replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  _key := substring(_key from 1 for 48);
  
  UPDATE campaigns SET foundry_api_key = _key WHERE id = _campaign_id;
  
  RETURN _key;
END;
$function$;