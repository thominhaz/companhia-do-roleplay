-- Atualizar a função get_subscription_tier para incluir visitante
CREATE OR REPLACE FUNCTION public.get_subscription_tier(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT 
      CASE 
        WHEN s.status IN ('mestre', 'premium') AND (s.expires_at IS NULL OR s.expires_at > now()) THEN 'mestre'
        WHEN s.status = 'heroi' AND (s.expires_at IS NULL OR s.expires_at > now()) THEN 'heroi'
        WHEN s.status = 'aldeao' AND (s.expires_at IS NULL OR s.expires_at > now()) THEN 'aldeao'
        WHEN s.status::text = 'visitante' THEN 'visitante'
        ELSE 'visitante'
      END
    FROM public.subscriptions s 
    WHERE s.user_id = _user_id
    ORDER BY s.created_at DESC
    LIMIT 1),
    'visitante'
  );
$$;

-- Atualizar can_create_character para bloquear visitantes
CREATE OR REPLACE FUNCTION public.can_create_character(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN public.get_subscription_tier(_user_id) = 'visitante' THEN false
      WHEN public.get_subscription_tier(_user_id) = 'mestre' THEN true
      WHEN public.get_subscription_tier(_user_id) = 'heroi' THEN 
        (SELECT COUNT(*) < 20 FROM public.characters WHERE user_id = _user_id AND is_archived = false)
      ELSE 
        (SELECT COUNT(*) < 3 FROM public.characters WHERE user_id = _user_id AND is_archived = false)
    END;
$$;

-- Atualizar can_create_homebrew para bloquear visitantes
CREATE OR REPLACE FUNCTION public.can_create_homebrew(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN public.get_subscription_tier(_user_id) = 'visitante' THEN false
      WHEN public.get_subscription_tier(_user_id) IN ('mestre', 'heroi') THEN true
      ELSE false
    END;
$$;