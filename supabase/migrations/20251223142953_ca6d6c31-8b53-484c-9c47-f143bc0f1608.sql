-- Corrigir função is_premium para não verificar auth.uid() duplicadamente
-- O RLS já passa o user_id correto, então a verificação adicional é redundante
-- e pode causar falsos negativos em contextos de serviço

CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id 
    AND status IN ('premium', 'heroi', 'mestre')
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- Corrigir função is_mestre da mesma forma
CREATE OR REPLACE FUNCTION public.is_mestre(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id 
    AND status IN ('premium', 'mestre')
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- Corrigir get_subscription_tier também
CREATE OR REPLACE FUNCTION public.get_subscription_tier(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT status::text FROM public.subscriptions
     WHERE user_id = _user_id 
     AND (expires_at IS NULL OR expires_at > NOW())
     LIMIT 1),
    'aldeao'
  );
$$;