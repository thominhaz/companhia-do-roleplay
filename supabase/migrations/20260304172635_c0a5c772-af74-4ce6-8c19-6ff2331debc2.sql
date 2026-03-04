CREATE TABLE public.discord_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean NOT NULL DEFAULT false
);

ALTER TABLE public.discord_oauth_states ENABLE ROW LEVEL SECURITY;

-- No direct user access needed - only accessed via SECURITY DEFINER functions
CREATE POLICY "No direct access" ON public.discord_oauth_states FOR ALL USING (false);

-- Function to create a state token for the current user
CREATE OR REPLACE FUNCTION public.create_discord_oauth_state()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _state_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;
  
  -- Clean up expired states
  DELETE FROM public.discord_oauth_states WHERE expires_at < now();
  
  INSERT INTO public.discord_oauth_states (user_id)
  VALUES (auth.uid())
  RETURNING id INTO _state_id;
  
  RETURN _state_id;
END;
$$;

-- Function to consume a state token (used by edge function with service role)
CREATE OR REPLACE FUNCTION public.consume_discord_oauth_state(_state_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  SELECT user_id INTO _user_id
  FROM public.discord_oauth_states
  WHERE id = _state_id
    AND used = false
    AND expires_at > now();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired state token';
  END IF;
  
  UPDATE public.discord_oauth_states SET used = true WHERE id = _state_id;
  
  RETURN _user_id;
END;
$$;