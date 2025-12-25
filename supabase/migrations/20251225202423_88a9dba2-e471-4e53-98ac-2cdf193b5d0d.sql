-- Create shops table
CREATE TABLE public.campaign_shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  npc_id UUID REFERENCES public.campaign_npcs(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shop items table
CREATE TABLE public.campaign_shop_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.campaign_shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_gold INTEGER NOT NULL DEFAULT 0,
  price_silver INTEGER NOT NULL DEFAULT 0,
  price_copper INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER, -- NULL means unlimited
  category TEXT,
  rarity TEXT DEFAULT 'comum',
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_shop_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for shops
CREATE POLICY "Masters can manage campaign shops"
ON public.campaign_shops
FOR ALL
USING (is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Players can view visible shops"
ON public.campaign_shops
FOR SELECT
USING (is_hidden = false AND is_campaign_member(campaign_id, auth.uid()));

-- RLS policies for shop items
CREATE POLICY "Masters can manage shop items"
ON public.campaign_shop_items
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.campaign_shops s
  WHERE s.id = campaign_shop_items.shop_id
  AND is_campaign_master(s.campaign_id, auth.uid())
));

CREATE POLICY "Players can view items in visible shops"
ON public.campaign_shop_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.campaign_shops s
  WHERE s.id = campaign_shop_items.shop_id
  AND s.is_hidden = false
  AND is_campaign_member(s.campaign_id, auth.uid())
));

-- Triggers for updated_at
CREATE TRIGGER update_campaign_shops_updated_at
BEFORE UPDATE ON public.campaign_shops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_shop_items_updated_at
BEFORE UPDATE ON public.campaign_shop_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for shops
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_shops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_shop_items;