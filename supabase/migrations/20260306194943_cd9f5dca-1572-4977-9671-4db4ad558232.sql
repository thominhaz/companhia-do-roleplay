
-- 1. Create registration_codes table for invite-only signup
CREATE TABLE public.registration_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  max_uses integer DEFAULT 10,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid DEFAULT NULL
);

-- RLS on registration_codes
ALTER TABLE public.registration_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can read active codes (for validation at signup)
CREATE POLICY "Anyone can read active registration codes"
  ON public.registration_codes FOR SELECT
  USING (is_active = true);

-- Only admins can manage
CREATE POLICY "Admins can manage registration codes"
  ON public.registration_codes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. Create function to validate and consume registration code
CREATE OR REPLACE FUNCTION public.validate_registration_code(_code text)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  _reg_code registration_codes%ROWTYPE;
BEGIN
  SELECT * INTO _reg_code FROM registration_codes
  WHERE code = UPPER(_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF _reg_code.max_uses IS NOT NULL AND _reg_code.current_uses >= _reg_code.max_uses THEN
    RETURN false;
  END IF;

  -- Consume one use
  UPDATE registration_codes SET current_uses = current_uses + 1 WHERE id = _reg_code.id;

  RETURN true;
END;
$$;

-- 3. Update all existing subscriptions to 'mestre' with lifetime
UPDATE public.subscriptions SET status = 'mestre', expires_at = NULL;

-- 4. Update handle_new_user to set 'mestre' by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));

  INSERT INTO public.subscriptions (user_id, status)
  VALUES (NEW.id, 'mestre');

  RETURN NEW;
END;
$$;

-- 5. Update campaign creation RLS to allow any authenticated user (remove is_mestre check)
DROP POLICY IF EXISTS "Mestres can create campaigns" ON public.campaigns;
CREATE POLICY "Authenticated users can create campaigns"
  ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = master_id);

-- 6. Insert a default registration code for the admin
INSERT INTO public.registration_codes (code, max_uses) VALUES ('GO20BETA', 50);
