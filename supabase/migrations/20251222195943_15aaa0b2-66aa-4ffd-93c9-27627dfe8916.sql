-- Fix 1: Update get_or_create_notification_preferences to validate authorization
CREATE OR REPLACE FUNCTION public.get_or_create_notification_preferences(_user_id UUID)
RETURNS public.notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _prefs public.notification_preferences;
BEGIN
  -- CRITICAL: Verify caller is requesting their own preferences
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;
  
  IF auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access other users preferences';
  END IF;
  
  SELECT * INTO _prefs FROM public.notification_preferences WHERE user_id = _user_id;
  
  IF _prefs IS NULL THEN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (_user_id)
    RETURNING * INTO _prefs;
  END IF;
  
  RETURN _prefs;
END;
$$;

-- Fix 2: Remove public SELECT policy on promo_tokens (they're only validated via RPC)
DROP POLICY IF EXISTS "Anyone can read active tokens" ON public.promo_tokens;