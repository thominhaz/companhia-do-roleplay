-- Battle maps table for VTT grid
CREATE TABLE public.battle_maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Novo Mapa',
  grid_width INTEGER NOT NULL DEFAULT 20,
  grid_height INTEGER NOT NULL DEFAULT 20,
  cell_size INTEGER NOT NULL DEFAULT 40,
  image_url TEXT,
  token_positions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.battle_maps ENABLE ROW LEVEL SECURITY;

-- Masters can do everything
CREATE POLICY "Masters can manage battle maps"
ON public.battle_maps FOR ALL
TO authenticated
USING (is_campaign_master(campaign_id, auth.uid()))
WITH CHECK (is_campaign_master(campaign_id, auth.uid()));

-- Players can view active maps
CREATE POLICY "Players can view active battle maps"
ON public.battle_maps FOR SELECT
TO authenticated
USING (is_active = true AND is_campaign_member(campaign_id, auth.uid()));

-- Players can update token_positions on active maps (for moving their own tokens)
CREATE POLICY "Players can update token positions"
ON public.battle_maps FOR UPDATE
TO authenticated
USING (is_active = true AND is_campaign_member(campaign_id, auth.uid()))
WITH CHECK (is_active = true AND is_campaign_member(campaign_id, auth.uid()));