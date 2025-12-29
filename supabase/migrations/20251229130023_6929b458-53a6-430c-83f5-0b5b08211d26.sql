-- Create catarse supporters table
CREATE TABLE public.catarse_supporters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'apoiador',
  message TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catarse_supporters ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can view visible supporters)
CREATE POLICY "Anyone can view visible supporters"
ON public.catarse_supporters
FOR SELECT
USING (is_visible = true);

-- Add some sample data for testing
INSERT INTO public.catarse_supporters (name, tier, message) VALUES
('João Silva', 'lendario', 'Apoiando a comunidade BR de RPG!'),
('Maria Santos', 'mestre_epico', 'Go20 é incrível!'),
('Pedro Oliveira', 'mestre', NULL),
('Ana Costa', 'heroi', 'Vamos jogar!'),
('Lucas Ferreira', 'aldeao', NULL),
('Carla Souza', 'apoiador', NULL);