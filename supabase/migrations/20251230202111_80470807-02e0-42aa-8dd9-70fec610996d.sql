-- Create stretch_goals table for Catarse campaign management
CREATE TABLE public.stretch_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_number INTEGER NOT NULL UNIQUE,
  value INTEGER NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  phase TEXT NOT NULL DEFAULT 'FUNDAÇÃO',
  phase_emoji TEXT DEFAULT '🏰',
  phase_order INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'current', 'pending')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stretch_goals ENABLE ROW LEVEL SECURITY;

-- Everyone can read stretch goals (public data for landing page)
CREATE POLICY "Stretch goals are publicly readable"
ON public.stretch_goals FOR SELECT
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage stretch goals"
ON public.stretch_goals FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_stretch_goals_updated_at
BEFORE UPDATE ON public.stretch_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create current_funding table to track the current funding amount
CREATE TABLE public.campaign_funding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  current_amount INTEGER NOT NULL DEFAULT 0,
  goal_amount INTEGER NOT NULL DEFAULT 50000,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_funding ENABLE ROW LEVEL SECURITY;

-- Everyone can read funding info
CREATE POLICY "Campaign funding is publicly readable"
ON public.campaign_funding FOR SELECT
USING (true);

-- Only admins can update funding
CREATE POLICY "Admins can manage campaign funding"
ON public.campaign_funding FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert initial funding record
INSERT INTO public.campaign_funding (current_amount, goal_amount) VALUES (3800, 50000);

-- Insert initial stretch goals based on current data
INSERT INTO public.stretch_goals (goal_number, value, title, subtitle, description, phase, phase_emoji, phase_order, status, sort_order) VALUES
(1, 600, 'Primeiros Dados Rolados', 'Acesso Beta e servidores 24/7', 'Ao atingirmos esta meta, abriremos os portões da Go20! Você terá acesso à versão Beta, poderá acessar o site imediatamente e revisar nossas ferramentas. Com esse valor, garantimos a infraestrutura para manter a Go20 online 24/7.', 'FUNDAÇÃO', '🏰', 1, 'completed', 1),
(2, 900, 'Ficha de Personagem', 'Criação guiada, cálculos automáticos...', 'O coração de todo aventureiro! Lançamos o sistema completo de fichas: criação guiada passo a passo, cálculos automáticos de atributos e modificadores, gestão de magias, inventário e progressão de nível.', 'FUNDAÇÃO', '🏰', 1, 'completed', 2),
(3, 1200, 'Ferramentas do Mestre', 'Campanhas, Combat Tracker Pro...', 'Ferramentas avançadas para quem senta atrás do escudo: criação e gestão de campanhas, Tracker de Combate com iniciativa automática e controle de HP, gestão de NPCs, Lojas e um chat integrado.', 'FUNDAÇÃO', '🏰', 1, 'completed', 3),
(4, 1500, 'Calendário de Aventuras', 'Agendamento, lembretes e confirmação...', 'Nunca mais perca uma sessão! Sistema de Agendamento completo. O mestre marca data/hora e todos recebem lembretes automáticos. Inclui sistema de RSVP para você saber quem estará na mesa.', 'FUNDAÇÃO', '🏰', 1, 'completed', 4),
(5, 1800, 'Discord na Mesa', 'Webhooks para rolagens, lembretes...', 'Integração total com seu servidor! A Go20 enviará automaticamente resultados de rolagens, lembretes de sessão e atualizações de combate via Webhook.', 'FUNDAÇÃO', '🏰', 1, 'completed', 5),
(6, 2200, 'Compêndio Expandido', 'Grimório, itens mágicos e SRD 5.1', 'Uma biblioteca de conhecimento ao seu alcance! SRD 5.1 completo traduzido, permitindo arrastar e soltar magias, itens mágicos e condições diretamente para a ficha.', 'FUNDAÇÃO', '🏰', 1, 'completed', 6),
(7, 2600, 'Economia entre Jogadores', 'Trocas, presentes e vendas', 'Sistema de Lojas Dinâmicas e Trocas P2P! Ofereça itens, negocie por ouro ou troque equipamentos com outros membros do grupo. Uma economia de RPG viva e funcional.', 'FUNDAÇÃO', '🏰', 1, 'completed', 7),
(8, 3000, 'Facções e Reputação', 'Organizações e mapa de relacionamentos', 'Crie guildas, ordens e reinos. Cada personagem terá sua própria reputação que flutua conforme suas escolhas. Inclui mapa de relacionamentos e histórico de eventos.', 'FUNDAÇÃO', '🏰', 1, 'completed', 8),
(9, 3500, 'Forja do Homebrew', 'Crie magias, itens e monstros', 'Sua criatividade não tem limites! Ferramenta completa para criar suas próprias raças, classes, magias e monstros que se integram ao sistema como conteúdo oficial.', 'EXPANSÃO', '🛠️', 2, 'completed', 9),
(10, 4000, 'Oficina de Documentos', 'Cartas, pergaminhos e contratos', 'Imersão máxima na entrega de pistas! Um editor visual para criar cartas seladas, pergaminhos antigos, contratos diabólicos e páginas de diário.', 'EXPANSÃO', '🛠️', 2, 'current', 10),
(11, 4500, 'Modo Offline Completo', 'Acesso total sem internet', 'Sua mesa não precisa de Wi-Fi! Modo offline completo, permitindo acesso a fichas, regras e rolagens mesmo sem conexão.', 'EXPANSÃO', '🛠️', 2, 'pending', 11),
(12, 5000, 'Gerador de Encontros', 'Balanceamento e sugestões', 'Mestres preparados em segundos! Sistema que sugere grupos de monstros baseados no nível do grupo, ambiente e dificuldade desejada.', 'EXPANSÃO', '🛠️', 2, 'pending', 12),
(13, 5500, 'Gerador de Tesouros', 'Recompensas automáticas', 'Porque todo mundo ama loot! Gere tesouros condizentes com o desafio, desde moedas até itens mágicos raros.', 'EXPANSÃO', '🛠️', 2, 'pending', 13),
(14, 6500, 'Cronista Arcano (IA)', 'Resumos narrativos automáticos', 'Chega de esquecer a última sessão! Nossa IA gera resumos narrativos épicos a partir dos logs de combate e notas.', 'EXPANSÃO', '🛠️', 2, 'pending', 14),
(15, 7500, 'Sábio das Regras (IA)', 'Chatbot integrado para dúvidas', 'Um juiz imparcial na mesa! Tire dúvidas de regras instantaneamente com nosso bot treinado no SRD 5e.', 'EXPANSÃO', '🛠️', 2, 'pending', 15),
(16, 8500, 'Dados Animados 3D', 'Simulação visual com física', 'A satisfação de rolar dados físicos, agora na tela! Dados 3D com física realista, colisão e sons satisfatórios.', 'INOVAÇÃO', '🔮', 3, 'pending', 16),
(17, 10000, 'Oficina de Mundos', 'Wiki de campanha completa', 'O lar da sua Lore! Um sistema estilo Wiki para catalogar cidades, NPCs, divindades e linhas do tempo.', 'INOVAÇÃO', '🔮', 3, 'pending', 17),
(18, 12000, 'App Nativo Mobile', 'iOS e Android otimizados', 'O grande sonho: Go20 no seu bolso! Apps nativos com notificações push e widgets de ficha.', 'INOVAÇÃO', '🔮', 3, 'pending', 18),
(19, 15000, 'Integração para Streams', 'Overlay para OBS/Twitch', 'Overlays dinâmicos para OBS. Mostre iniciativa, HP e rolagens em tempo real na sua live.', 'INOVAÇÃO', '🔮', 3, 'pending', 19),
(20, 18000, 'Modo Teatro (Projeção)', 'Interface para TV/Projetor', 'A união do presencial com o digital! Visualização especial para TV/Projetor na sala, sem mostrar segredos do Mestre.', 'EXPERIÊNCIA IMERSIVA', '🎭', 4, 'pending', 20),
(21, 22000, 'Trilha Sonora Integrada', 'Controle de músicas por ambiente', 'O som dita o clima! Player integrado com playlists temáticas sincronizadas nos dispositivos de todos.', 'EXPERIÊNCIA IMERSIVA', '🎭', 4, 'pending', 21),
(22, 25000, 'Soundboard de Efeitos', 'Sons épicos instantâneos', 'Mesa de som com efeitos prontos: explosões, rugidos de dragão, espadas colidindo. Imersão sonora ao clique.', 'EXPERIÊNCIA IMERSIVA', '🎭', 4, 'pending', 22),
(23, 28000, 'Arte e Identidade Visual', 'Ilustrações exclusivas', 'Artistas profissionais criarão identidade visual única, ícones personalizados e ilustrações exclusivas.', 'EXPERIÊNCIA IMERSIVA', '🎭', 4, 'pending', 23),
(24, 32000, 'Imersão Atmosférica', 'Efeitos visuais de clima', 'Efeitos visuais de ambiente: chuva, neblina, brasas de vulcão ou iluminação de tochas na interface.', 'EXPERIÊNCIA IMERSIVA', '🎭', 4, 'pending', 24),
(25, 38000, 'VTT Básico Integrado', 'Grid, tokens e Fog of War', 'A Go20 vira VTT completo! Mapas de batalha com grid, tokens em tempo real e névoa de guerra.', 'MESA VIRTUAL', '🗺️', 5, 'pending', 25),
(26, 42000, 'Oficina de Tokens', 'Corte e customize imagens', 'Transforme qualquer imagem em token! Ferramenta para cortar, adicionar bordas e salvar tokens perfeitos.', 'MESA VIRTUAL', '🗺️', 5, 'pending', 26),
(27, 50000, 'Oficina de Mapas', 'Construa cenários no app', 'Torne-se o arquiteto! Construtor de mapas leve para desenhar paredes, pisos e criar cenários rapidamente.', 'MESA VIRTUAL', '🗺️', 5, 'pending', 27);