
-- Tabela para NPCs criados pelos apoiadores do Catarse
CREATE TABLE public.supporter_npcs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  appearance TEXT,
  personality TEXT,
  backstory TEXT,
  occupation TEXT,
  location TEXT,
  image_url TEXT,
  creator_name TEXT NOT NULL,
  creator_tier TEXT NOT NULL DEFAULT 'lendario',
  creator_message TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para Itens Mágicos criados pelos apoiadores do Catarse
CREATE TABLE public.supporter_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL DEFAULT 'raro',
  item_type TEXT NOT NULL DEFAULT 'maravilhoso',
  requires_attunement BOOLEAN NOT NULL DEFAULT false,
  attunement_requirements TEXT,
  properties TEXT,
  damage TEXT,
  damage_type TEXT,
  ac_bonus INTEGER,
  image_url TEXT,
  creator_name TEXT NOT NULL,
  creator_tier TEXT NOT NULL DEFAULT 'mestre_epico',
  creator_message TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supporter_npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporter_items ENABLE ROW LEVEL SECURITY;

-- Políticas para NPCs - Qualquer um pode visualizar os visíveis
CREATE POLICY "Anyone can view visible supporter NPCs"
ON public.supporter_npcs
FOR SELECT
USING (is_visible = true);

-- Admins podem gerenciar NPCs
CREATE POLICY "Admins can manage supporter NPCs"
ON public.supporter_npcs
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Políticas para Itens - Qualquer um pode visualizar os visíveis
CREATE POLICY "Anyone can view visible supporter items"
ON public.supporter_items
FOR SELECT
USING (is_visible = true);

-- Admins podem gerenciar Itens
CREATE POLICY "Admins can manage supporter items"
ON public.supporter_items
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Índices para performance
CREATE INDEX idx_supporter_npcs_visible ON public.supporter_npcs(is_visible) WHERE is_visible = true;
CREATE INDEX idx_supporter_npcs_featured ON public.supporter_npcs(is_featured) WHERE is_featured = true;
CREATE INDEX idx_supporter_items_visible ON public.supporter_items(is_visible) WHERE is_visible = true;
CREATE INDEX idx_supporter_items_featured ON public.supporter_items(is_featured) WHERE is_featured = true;
