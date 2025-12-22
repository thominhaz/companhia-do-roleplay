-- Update the is_premium function to check for heroi or mestre status
CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE user_id = _user_id 
        AND status IN ('premium', 'heroi', 'mestre')
        AND (expires_at IS NULL OR expires_at > NOW())
      )
    ELSE FALSE
  END;
$function$;

-- Create a new function to check if user is a master subscriber
CREATE OR REPLACE FUNCTION public.is_mestre(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE user_id = _user_id 
        AND status IN ('premium', 'mestre')
        AND (expires_at IS NULL OR expires_at > NOW())
      )
    ELSE FALSE
  END;
$function$;

-- Create a function to get subscription tier
CREATE OR REPLACE FUNCTION public.get_subscription_tier(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      COALESCE(
        (SELECT 
          CASE 
            WHEN status IN ('mestre', 'premium') AND (expires_at IS NULL OR expires_at > NOW()) THEN 'mestre'
            WHEN status = 'heroi' AND (expires_at IS NULL OR expires_at > NOW()) THEN 'heroi'
            ELSE 'aldeao'
          END
        FROM public.subscriptions
        WHERE user_id = _user_id),
        'aldeao'
      )
    ELSE 'aldeao'
  END;
$function$;

-- Update can_create_character to use tier limits
-- aldeao: 3, heroi: 20, mestre: unlimited
CREATE OR REPLACE FUNCTION public.can_create_character(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      CASE public.get_subscription_tier(_user_id)
        WHEN 'mestre' THEN TRUE
        WHEN 'heroi' THEN public.count_user_characters(_user_id) < 20
        ELSE public.count_user_characters(_user_id) < 3
      END
    ELSE FALSE
  END;
$function$;

-- Update handle_new_user to use 'aldeao' for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  
  INSERT INTO public.subscriptions (user_id, status)
  VALUES (NEW.id, 'aldeao');
  
  RETURN NEW;
END;
$function$;

-- Update redeem_promo_token to handle tier upgrades
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
  IF _current_subscription.status IN ('mestre', 'heroi', 'premium') AND _current_subscription.expires_at > now() THEN
    _new_expires_at := _current_subscription.expires_at + (_token.days_premium || ' days')::interval;
  ELSE
    _new_expires_at := now() + (_token.days_premium || ' days')::interval;
  END IF;
  
  -- Update or create subscription (promo tokens give mestre access by default)
  INSERT INTO subscriptions (user_id, status, expires_at)
  VALUES (_user_id, 'mestre', _new_expires_at)
  ON CONFLICT (user_id) 
  DO UPDATE SET status = 'mestre', expires_at = _new_expires_at, updated_at = now();
  
  -- Record redemption
  INSERT INTO token_redemptions (token_id, user_id) VALUES (_token.id, _user_id);
  
  -- Update token usage count
  UPDATE promo_tokens SET current_uses = current_uses + 1 WHERE id = _token.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Plano Mestre ativado com sucesso!',
    'days', _token.days_premium,
    'expires_at', _new_expires_at
  );
END;
$function$;