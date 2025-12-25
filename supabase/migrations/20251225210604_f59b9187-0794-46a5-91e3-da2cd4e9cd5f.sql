-- Create shop transactions table for trade offers
CREATE TABLE public.shop_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.campaign_shops(id) ON DELETE CASCADE,
  shop_item_id UUID NOT NULL REFERENCES public.campaign_shop_items(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  seller_user_id UUID NOT NULL, -- The master offering the item
  buyer_user_id UUID NOT NULL, -- The player receiving the offer
  buyer_character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  price_gold INT NOT NULL DEFAULT 0,
  price_silver INT NOT NULL DEFAULT 0,
  price_copper INT NOT NULL DEFAULT 0,
  item_data JSONB NOT NULL DEFAULT '{}', -- Store item snapshot for history
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_quantity CHECK (quantity > 0)
);

-- Enable RLS
ALTER TABLE public.shop_transactions ENABLE ROW LEVEL SECURITY;

-- Master can create transactions and view all for their campaigns
CREATE POLICY "Masters can manage transactions for their campaigns"
ON public.shop_transactions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = shop_transactions.campaign_id AND c.master_id = auth.uid()
  )
);

-- Players can view and respond to their own transactions
CREATE POLICY "Players can view their transactions"
ON public.shop_transactions
FOR SELECT
USING (buyer_user_id = auth.uid());

CREATE POLICY "Players can update their pending transactions"
ON public.shop_transactions
FOR UPDATE
USING (buyer_user_id = auth.uid() AND status = 'pending')
WITH CHECK (buyer_user_id = auth.uid());

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_transactions;

-- Create index for faster queries
CREATE INDEX idx_shop_transactions_buyer ON public.shop_transactions(buyer_user_id, status);
CREATE INDEX idx_shop_transactions_campaign ON public.shop_transactions(campaign_id, status);