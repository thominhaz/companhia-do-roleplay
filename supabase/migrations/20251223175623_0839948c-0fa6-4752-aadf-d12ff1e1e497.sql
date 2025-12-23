-- Fix redeem_promo_token function to use the tier column from promo_tokens
CREATE OR REPLACE FUNCTION public.redeem_promo_token(_code text, _user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _token promo_tokens%ROWTYPE;
  _existing_redemption token_redemptions%ROWTYPE;
  _new_expires_at timestamp with time zone;
  _current_subscription subscriptions%ROWTYPE;
  _target_tier subscription_status;
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
  
  -- Determine target tier from the token (default to 'mestre' if not specified)
  _target_tier := COALESCE(_token.tier::subscription_status, 'mestre'::subscription_status);
  
  -- Calculate new expiration date
  -- For lifetime codes (36500+ days), set expires_at to NULL
  IF _token.days_premium >= 36500 THEN
    _new_expires_at := NULL;
  ELSIF _current_subscription.status IN ('mestre', 'heroi', 'premium') AND _current_subscription.expires_at > now() THEN
    _new_expires_at := _current_subscription.expires_at + (_token.days_premium || ' days')::interval;
  ELSE
    _new_expires_at := now() + (_token.days_premium || ' days')::interval;
  END IF;
  
  -- Update or create subscription with the correct tier from the token
  INSERT INTO subscriptions (user_id, status, expires_at)
  VALUES (_user_id, _target_tier, _new_expires_at)
  ON CONFLICT (user_id) 
  DO UPDATE SET status = _target_tier, expires_at = _new_expires_at, updated_at = now();
  
  -- Record redemption
  INSERT INTO token_redemptions (token_id, user_id) VALUES (_token.id, _user_id);
  
  -- Update token usage count
  UPDATE promo_tokens SET current_uses = current_uses + 1 WHERE id = _token.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Plano ' || initcap(_target_tier::text) || ' ativado com sucesso!',
    'tier', _target_tier,
    'days', _token.days_premium,
    'expires_at', _new_expires_at
  );
END;
$function$;