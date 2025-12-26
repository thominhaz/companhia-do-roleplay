-- Fix RLS for player-to-player trades

-- Ensure RLS is enabled
ALTER TABLE public.player_trades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe)
DROP POLICY IF EXISTS "Player trades are viewable by participants" ON public.player_trades;
DROP POLICY IF EXISTS "Player trades insert by initiator" ON public.player_trades;
DROP POLICY IF EXISTS "Player trades update by participants" ON public.player_trades;

-- Allow campaign master to view all trades in their campaign (for moderation/dashboard)
CREATE POLICY "Player trades are viewable by participants"
ON public.player_trades
FOR SELECT
USING (
  auth.uid() = initiator_user_id
  OR auth.uid() = receiver_user_id
  OR public.is_campaign_master(campaign_id, auth.uid())
);

-- Allow authenticated initiator (player or master) to create trades/gifts
CREATE POLICY "Player trades insert by initiator"
ON public.player_trades
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND initiator_user_id = auth.uid()
  AND (
    public.is_campaign_master(campaign_id, auth.uid())
    OR public.is_campaign_member(campaign_id, auth.uid())
  )
  AND public.is_campaign_member(campaign_id, receiver_user_id)
  AND receiver_character_id IS NOT NULL
  AND public.owns_character(receiver_character_id, receiver_user_id)
  AND (
    initiator_character_id IS NULL
    OR public.owns_character(initiator_character_id, auth.uid())
  )
);

-- Allow participants to update trade status / confirmations / offered items
CREATE POLICY "Player trades update by participants"
ON public.player_trades
FOR UPDATE
USING (
  auth.uid() = initiator_user_id
  OR auth.uid() = receiver_user_id
)
WITH CHECK (
  auth.uid() = initiator_user_id
  OR auth.uid() = receiver_user_id
);

-- Prevent changing immutable columns on updates
CREATE OR REPLACE FUNCTION public.prevent_player_trade_immutable_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.campaign_id IS DISTINCT FROM OLD.campaign_id
     OR NEW.trade_type IS DISTINCT FROM OLD.trade_type
     OR NEW.initiator_user_id IS DISTINCT FROM OLD.initiator_user_id
     OR NEW.receiver_user_id IS DISTINCT FROM OLD.receiver_user_id
     OR NEW.initiator_character_id IS DISTINCT FROM OLD.initiator_character_id
     OR NEW.receiver_character_id IS DISTINCT FROM OLD.receiver_character_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Immutable fields cannot be modified on player_trades';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_player_trade_immutable_updates ON public.player_trades;
CREATE TRIGGER trg_prevent_player_trade_immutable_updates
BEFORE UPDATE ON public.player_trades
FOR EACH ROW
EXECUTE FUNCTION public.prevent_player_trade_immutable_updates();
