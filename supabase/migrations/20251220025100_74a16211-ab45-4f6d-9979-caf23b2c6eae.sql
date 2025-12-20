-- Add invite_code column to campaigns
ALTER TABLE public.campaigns
ADD COLUMN invite_code TEXT UNIQUE;

-- Create function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create trigger to auto-generate invite code on campaign creation
CREATE OR REPLACE FUNCTION public.set_campaign_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := public.generate_invite_code();
    SELECT EXISTS(SELECT 1 FROM public.campaigns WHERE invite_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.invite_code := new_code;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_campaign_invite_code
BEFORE INSERT ON public.campaigns
FOR EACH ROW
WHEN (NEW.invite_code IS NULL)
EXECUTE FUNCTION public.set_campaign_invite_code();

-- Backfill existing campaigns with invite codes
DO $$
DECLARE
  campaign_record RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR campaign_record IN SELECT id FROM public.campaigns WHERE invite_code IS NULL LOOP
    LOOP
      new_code := public.generate_invite_code();
      SELECT EXISTS(SELECT 1 FROM public.campaigns WHERE invite_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE public.campaigns SET invite_code = new_code WHERE id = campaign_record.id;
  END LOOP;
END $$;

-- Create function to join campaign by invite code
CREATE OR REPLACE FUNCTION public.join_campaign_by_code(_invite_code TEXT, _user_id UUID, _character_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _campaign_id UUID;
  _existing_player UUID;
BEGIN
  -- Find campaign by code
  SELECT id INTO _campaign_id FROM public.campaigns WHERE invite_code = UPPER(_invite_code);
  
  IF _campaign_id IS NULL THEN
    RAISE EXCEPTION 'Código de convite inválido';
  END IF;
  
  -- Check if user is already in campaign
  SELECT id INTO _existing_player FROM public.campaign_players 
  WHERE campaign_id = _campaign_id AND user_id = _user_id;
  
  IF _existing_player IS NOT NULL THEN
    RAISE EXCEPTION 'Você já está nesta campanha';
  END IF;
  
  -- Check if user is the master
  IF EXISTS (SELECT 1 FROM public.campaigns WHERE id = _campaign_id AND master_id = _user_id) THEN
    RAISE EXCEPTION 'Você é o mestre desta campanha';
  END IF;
  
  -- Add player to campaign
  INSERT INTO public.campaign_players (campaign_id, user_id, character_id, role)
  VALUES (_campaign_id, _user_id, _character_id, 'player');
  
  RETURN _campaign_id;
END;
$$;