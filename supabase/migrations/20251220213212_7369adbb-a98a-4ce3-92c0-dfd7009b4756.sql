-- Create promo_tokens table for promotional codes
CREATE TABLE public.promo_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  days_premium integer NOT NULL DEFAULT 30,
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone
);

-- Create table to track token redemptions
CREATE TABLE public.token_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES public.promo_tokens(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  redeemed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_redemptions ENABLE ROW LEVEL SECURITY;

-- Promo tokens: anyone can read active tokens (to validate), but no one can insert/update/delete via client
CREATE POLICY "Anyone can read active tokens"
ON public.promo_tokens
FOR SELECT
USING (is_active = true);

-- Token redemptions: users can view their own redemptions
CREATE POLICY "Users can view own redemptions"
ON public.token_redemptions
FOR SELECT
USING (auth.uid() = user_id);

-- Function to redeem a token
CREATE OR REPLACE FUNCTION public.redeem_promo_token(_code text, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token promo_tokens%ROWTYPE;
  _existing_redemption token_redemptions%ROWTYPE;
  _new_expires_at timestamp with time zone;
  _current_subscription subscriptions%ROWTYPE;
BEGIN
  -- Find the token
  SELECT * INTO _token FROM promo_tokens 
  WHERE code = UPPER(_code) AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido ou expirado');
  END IF;
  
  -- Check if token has expired
  IF _token.expires_at IS NOT NULL AND _token.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código expirado');
  END IF;
  
  -- Check if max uses reached
  IF _token.max_uses IS NOT NULL AND _token.current_uses >= _token.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código já foi utilizado o máximo de vezes');
  END IF;
  
  -- Check if user already redeemed this token
  SELECT * INTO _existing_redemption FROM token_redemptions 
  WHERE token_id = _token.id AND user_id = _user_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já resgatou este código');
  END IF;
  
  -- Get current subscription
  SELECT * INTO _current_subscription FROM subscriptions WHERE user_id = _user_id;
  
  -- Calculate new expiration date
  IF _current_subscription.status = 'premium' AND _current_subscription.expires_at > now() THEN
    _new_expires_at := _current_subscription.expires_at + (_token.days_premium || ' days')::interval;
  ELSE
    _new_expires_at := now() + (_token.days_premium || ' days')::interval;
  END IF;
  
  -- Update or create subscription
  INSERT INTO subscriptions (user_id, status, expires_at)
  VALUES (_user_id, 'premium', _new_expires_at)
  ON CONFLICT (user_id) 
  DO UPDATE SET status = 'premium', expires_at = _new_expires_at, updated_at = now();
  
  -- Record redemption
  INSERT INTO token_redemptions (token_id, user_id) VALUES (_token.id, _user_id);
  
  -- Update token usage count
  UPDATE promo_tokens SET current_uses = current_uses + 1 WHERE id = _token.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Premium ativado com sucesso!',
    'days', _token.days_premium,
    'expires_at', _new_expires_at
  );
END;
$$;