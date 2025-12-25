-- Create player_trades table for both master gifts and player-to-player trades
CREATE TABLE public.player_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  
  -- Trade type: 'master_gift' for admin gifts, 'player_trade' for p2p trades
  trade_type TEXT NOT NULL DEFAULT 'player_trade',
  
  -- Initiator (master for gifts, player for trades)
  initiator_user_id UUID NOT NULL,
  initiator_character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  initiator_item_data JSONB NOT NULL DEFAULT '{}',
  initiator_confirmed BOOLEAN NOT NULL DEFAULT false,
  
  -- Receiver
  receiver_user_id UUID NOT NULL,
  receiver_character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  receiver_item_data JSONB, -- NULL for master gifts, set by receiver for trades
  receiver_confirmed BOOLEAN NOT NULL DEFAULT false,
  
  -- Status: pending_receiver (waiting for receiver item), pending_confirmations, completed, cancelled, rejected
  status TEXT NOT NULL DEFAULT 'pending_receiver',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Masters can manage all trades in their campaigns
CREATE POLICY "Masters can manage campaign trades"
  ON public.player_trades
  FOR ALL
  USING (is_campaign_master(campaign_id, auth.uid()));

-- Players can view trades they're involved in
CREATE POLICY "Players can view their trades"
  ON public.player_trades
  FOR SELECT
  USING (
    initiator_user_id = auth.uid() OR 
    receiver_user_id = auth.uid()
  );

-- Players can initiate trades
CREATE POLICY "Players can initiate trades"
  ON public.player_trades
  FOR INSERT
  WITH CHECK (
    auth.uid() = initiator_user_id AND
    trade_type = 'player_trade' AND
    is_campaign_member(campaign_id, auth.uid())
  );

-- Players can update their own trades (for confirmation and item selection)
CREATE POLICY "Players can update their trades"
  ON public.player_trades
  FOR UPDATE
  USING (
    (initiator_user_id = auth.uid() OR receiver_user_id = auth.uid()) AND
    status NOT IN ('completed', 'cancelled')
  );

-- Players can cancel their own initiated trades
CREATE POLICY "Players can delete their initiated trades"
  ON public.player_trades
  FOR DELETE
  USING (
    initiator_user_id = auth.uid() AND
    status NOT IN ('completed')
  );

-- Index for faster queries
CREATE INDEX idx_player_trades_campaign ON public.player_trades(campaign_id);
CREATE INDEX idx_player_trades_receiver ON public.player_trades(receiver_user_id, status);
CREATE INDEX idx_player_trades_initiator ON public.player_trades(initiator_user_id, status);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_trades;

-- Update trigger
CREATE TRIGGER update_player_trades_updated_at
  BEFORE UPDATE ON public.player_trades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();