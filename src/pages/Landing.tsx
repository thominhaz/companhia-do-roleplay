import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Helmet } from "react-helmet";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { 
  ExternalLink, 
  Rocket, 
  Target,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  Castle,
  Wrench,
  Wand2,
  Drama,
  Map
} from "lucide-react";
import logoFull from "@/assets/logo-full.png";

interface StretchGoal {
  id: number;
  value: number;
  title: string;
  subtitle: string;
  description: string;
  status: "completed" | "current" | "pending";
}

interface Phase {
  id: number;
  name: string;
  emoji: string;
  icon: React.ElementType;
  color: string;
  goals: StretchGoal[];
}

// Stretch Goals data based on Catarse campaign
const phases: Phase[] = [
  {
    id: 1,
    name: "FUNDAÇÃO",
    emoji: "🏰",
    icon: Castle,
    color: "cosmic-purple",
    goals: [
      { 
        id: 1, 
        value: 600, 
        title: "Primeiros Dados Rolados", 
        subtitle: "Acesso Beta e servidores 24/7",
        description: "Ao atingirmos esta meta, abriremos os portões da Go20! Você terá acesso à versão Beta, poderá acessar o site imediatamente e revisar nossas ferramentas. Com esse valor, garantimos a infraestrutura para manter a Go20 online 24/7. Isso significa zero quedas e estabilidade total para sua jogatina.",
        status: "completed" 
      },
      { 
        id: 2, 
        value: 900, 
        title: "Ficha de Personagem", 
        subtitle: "Criação guiada, cálculos automáticos...",
        description: "O coração de todo aventureiro! Lançamos o sistema completo de fichas: criação guiada passo a passo, cálculos automáticos de atributos e modificadores, gestão de magias, inventário e progressão de nível. Sua ficha digital, sempre sincronizada e pronta para a aventura.",
        status: "completed" 
      },
      { 
        id: 3, 
        value: 1200, 
        title: "Ferramentas do Mestre", 
        subtitle: "Campanhas, Combat Tracker Pro...",
        description: "Ferramentas avançadas para quem senta atrás do escudo: criação e gestão de campanhas, Tracker de Combate com iniciativa automática e controle de HP, gestão de NPCs, Lojas e um chat integrado entre mestre e jogadores.",
        status: "completed" 
      },
      { 
        id: 4, 
        value: 1500, 
        title: "Calendário de Aventuras", 
        subtitle: "Agendamento, lembretes e confirmação...",
        description: "Nunca mais perca uma sessão! Implementamos o Sistema de Agendamento completo. O mestre marca data/hora e todos recebem lembretes automáticos. Inclui sistema de RSVP (confirmação de presença) para você saber exatamente quem estará na mesa.",
        status: "completed" 
      },
      { 
        id: 5, 
        value: 1800, 
        title: "Discord na Mesa", 
        subtitle: "Webhooks para rolagens, lembretes...",
        description: "Integração total com seu servidor! A Go20 enviará automaticamente resultados de rolagens, lembretes de sessão e atualizações de combate via Webhook. Perfeito para manter a lore e o registro da aventura vivos no Discord do grupo.",
        status: "completed" 
      },
      { 
        id: 6, 
        value: 2200, 
        title: "Compêndio Expandido", 
        subtitle: "Grimório, itens mágicos e SRD 5.1",
        description: "Uma biblioteca de conhecimento ao seu alcance! Adicionaremos o SRD 5.1 completo traduzido, permitindo arrastar e soltar magias, itens mágicos e condições diretamente para a ficha. Menos tempo folheando livros, mais tempo jogando.",
        status: "completed" 
      },
      { 
        id: 7, 
        value: 2600, 
        title: "Economia entre Jogadores", 
        subtitle: "Trocas, presentes e vendas",
        description: "Sistema de Lojas Dinâmicas e Trocas P2P (Player to Player)! Ofereça itens, negocie por ouro ou troque equipamentos com outros membros do grupo. Ambos aceitam e a troca é feita instantaneamente. Uma economia de RPG viva e funcional.",
        status: "completed" 
      },
      { 
        id: 8, 
        value: 3000, 
        title: "Facções e Reputação", 
        subtitle: "Organizações e mapa de relacionamentos",
        description: "Crie guildas, ordens e reinos. Cada personagem terá sua própria reputação que flutua conforme suas escolhas. Inclui um mapa de relacionamentos para visualizar aliados e rivais, além de histórico de eventos que impactaram o mundo.",
        status: "completed" 
      },
    ]
  },
  {
    id: 2,
    name: "EXPANSÃO",
    emoji: "🛠️",
    icon: Wrench,
    color: "cyan-blue",
    goals: [
      { 
        id: 9, 
        value: 3500, 
        title: "Forja do Homebrew", 
        subtitle: "Crie magias, itens e monstros",
        description: "Sua criatividade não tem limites! Ferramenta completa para criar suas próprias raças, classes, magias e monstros. Tudo isso se integra ao sistema da Go20 como se fosse conteúdo oficial, com cálculos e descrições automáticas.",
        status: "completed" 
      },
      { 
        id: 10, 
        value: 4000, 
        title: "Oficina de Documentos", 
        subtitle: "Cartas, pergaminhos e contratos",
        description: "Imersão máxima na entrega de pistas! Um editor visual para criar cartas seladas, pergaminhos antigos, contratos diabólicos e páginas de diário. Entregue 'handouts' digitais visualmente incríveis para os jogadores lerem.",
        status: "current" 
      },
      { 
        id: 11, 
        value: 4500, 
        title: "Modo Offline Completo", 
        subtitle: "Acesso total sem internet",
        description: "Sua mesa não precisa de Wi-Fi para acontecer! Desenvolveremos o modo offline completo, permitindo acesso a fichas, regras e rolagens mesmo sem conexão. Assim que a internet voltar, tudo sincroniza magicamente.",
        status: "pending" 
      },
      { 
        id: 12, 
        value: 5000, 
        title: "Gerador de Encontros", 
        subtitle: "Balanceamento e sugestões",
        description: "Mestres preparados em segundos! Um sistema que sugere grupos de monstros baseados no nível e tamanho do grupo (CR), ambiente e dificuldade desejada. Gere um combate justo (ou mortal) com um clique.",
        status: "pending" 
      },
      { 
        id: 13, 
        value: 5500, 
        title: "Gerador de Tesouros", 
        subtitle: "Recompensas automáticas",
        description: "Porque todo mundo ama 'loot'! Gere tesouros condizentes com o desafio, desde moedas soltas até itens mágicos raros e objetos de arte. Tudo pronto para ser distribuído para o inventário dos jogadores.",
        status: "pending" 
      },
      { 
        id: 14, 
        value: 6500, 
        title: "Cronista Arcano (IA)", 
        subtitle: "Resumos narrativos automáticos",
        description: "Chega de esquecer o que houve na última sessão! Nossa IA lerá os logs de combate e notas, gerando um resumo narrativo épico da aventura. O mestre pode editar e postar no diário da campanha para todos relembrarem.",
        status: "pending" 
      },
      { 
        id: 15, 
        value: 7500, 
        title: "Sábio das Regras (IA)", 
        subtitle: "Chatbot integrado para dúvidas",
        description: "Um juiz imparcial na mesa! Tire dúvidas de regras instantaneamente com nosso bot treinado no SRD 5e. 'Como funciona agarrar?', 'Posso usar essa magia como ação bônus?'. Respostas rápidas para não travar o combate.",
        status: "pending" 
      },
    ]
  },
  {
    id: 3,
    name: "INOVAÇÃO",
    emoji: "🔮",
    icon: Wand2,
    color: "solar-orange",
    goals: [
      { 
        id: 16, 
        value: 8500, 
        title: "Dados Animados 3D", 
        subtitle: "Simulação visual com física",
        description: "A satisfação de rolar dados físicos, agora na tela! Implementação de dados 3D com física realista, colisão e sons satisfatórios. Personalize a cor e o material dos seus dados digitais.",
        status: "pending" 
      },
      { 
        id: 17, 
        value: 10000, 
        title: "Oficina de Mundos", 
        subtitle: "Wiki de campanha completa",
        description: "O lar da sua Lore! Um sistema estilo Wiki para catalogar cidades, NPCs importantes, divindades e linhas do tempo. Organize o conhecimento do seu mundo e decida o que é segredo e o que é público.",
        status: "pending" 
      },
      { 
        id: 18, 
        value: 12000, 
        title: "App Nativo Mobile", 
        subtitle: "iOS e Android otimizados",
        description: "O grande sonho: Go20 no seu bolso! Desenvolvimento de apps nativos para as lojas Apple e Google, com suporte a notificações push, widgets de ficha na tela inicial e performance nativa superior.",
        status: "pending" 
      },
      { 
        id: 19, 
        value: 15000, 
        title: "Integração para Streams", 
        subtitle: "Overlay para OBS/Twitch",
        description: "Vai transmitir sua mesa? Criaremos overlays dinâmicos que se conectam ao OBS. Mostre a iniciativa, o HP dos jogadores e as rolagens de dados em tempo real na sua live, engajando ainda mais seu público.",
        status: "pending" 
      },
    ]
  },
  {
    id: 4,
    name: "EXPERIÊNCIA IMERSIVA",
    emoji: "🎭",
    icon: Drama,
    color: "magenta-red",
    goals: [
      { 
        id: 20, 
        value: 18000, 
        title: "Modo Teatro (Projeção)", 
        subtitle: "Interface para TV/Projetor",
        description: "A união do presencial com o digital! Uma visualização especial feita para ser jogada em uma TV ou Projetor na sala. Exibe a ordem de iniciativa, imagens dos monstros e status, sem mostrar os 'segredos' da tela do Mestre.",
        status: "pending" 
      },
      { 
        id: 21, 
        value: 22000, 
        title: "Trilha Sonora Integrada", 
        subtitle: "Controle de músicas por ambiente",
        description: "O som dita o clima! Um player integrado onde o mestre dispara playlists temáticas (Combate Épico, Taverna, Masmorra Sinistra) que tocam sincronizadas nos dispositivos de todos os jogadores.",
        status: "pending" 
      },
      { 
        id: 22, 
        value: 25000, 
        title: "Soundboard de Efeitos", 
        subtitle: "Sons épicos instantâneos",
        description: "Mais impacto nas suas descrições! Uma mesa de som com efeitos prontos: explosões de bolas de fogo, rugidos de dragão, espadas colidindo e passos na madeira. Imersão sonora ao alcance de um clique.",
        status: "pending" 
      },
      { 
        id: 23, 
        value: 28000, 
        title: "Arte e Identidade Visual", 
        subtitle: "Ilustrações exclusivas",
        description: "Chega de visual genérico! Contrataremos artistas profissionais para criar uma identidade visual única, ícones personalizados e ilustrações de classes/raças exclusivas para a plataforma.",
        status: "pending" 
      },
      { 
        id: 24, 
        value: 32000, 
        title: "Imersão Atmosférica", 
        subtitle: "Efeitos visuais de clima",
        description: "Sinta o ambiente! O mestre poderá ativar efeitos visuais que se sobrepõem à interface: chuva caindo na tela, neblina em movimento, brasas de vulcão ou iluminação de tochas.",
        status: "pending" 
      },
    ]
  },
  {
    id: 5,
    name: "MESA VIRTUAL",
    emoji: "🗺️",
    icon: Map,
    color: "emerald",
    goals: [
      { 
        id: 25, 
        value: 38000, 
        title: "VTT Básico Integrado", 
        subtitle: "Grid, tokens e Fog of War",
        description: "A Go20 vira um VTT completo! Adicionaremos suporte a mapas de batalha com grid, movimentação de tokens em tempo real e 'Fog of War' (névoa de guerra) para revelar a masmorra conforme a exploração avança.",
        status: "pending" 
      },
      { 
        id: 26, 
        value: 42000, 
        title: "Oficina de Tokens", 
        subtitle: "Corte e customize imagens",
        description: "Transforme qualquer imagem em um token de RPG! Uma ferramenta interna para cortar (crop), adicionar bordas coloridas de facção/status e salvar tokens redondos perfeitos para usar no grid.",
        status: "pending" 
      },
      { 
        id: 27, 
        value: 50000, 
        title: "Oficina de Mapas", 
        subtitle: "Construa cenários no app",
        description: "Torne-se o arquiteto da masmorra! Um construtor de mapas leve integrado, permitindo desenhar paredes, adicionar pisos, portas e objetos para criar cenários de batalha rápidos sem precisar de softwares externos pesados.",
        status: "pending" 
      },
    ]
  },
];

// Current funding (this would ideally come from an API)
const currentFunding = 3800;
const fundingGoal = 50000;

const getPhaseColorClass = (color: string, type: 'text' | 'bg' | 'border') => {
  const colorMap: Record<string, Record<string, string>> = {
    'cosmic-purple': { text: 'text-cosmic-purple', bg: 'bg-cosmic-purple', border: 'border-cosmic-purple' },
    'cyan-blue': { text: 'text-cyan-blue', bg: 'bg-cyan-blue', border: 'border-cyan-blue' },
    'solar-orange': { text: 'text-solar-orange', bg: 'bg-solar-orange', border: 'border-solar-orange' },
    'magenta-red': { text: 'text-magenta-red', bg: 'bg-magenta-red', border: 'border-magenta-red' },
    'emerald': { text: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500' },
  };
  return colorMap[color]?.[type] || '';
};

export default function Landing() {
  const allGoals = phases.flatMap(p => p.goals);
  const completedGoals = allGoals.filter(g => g.status === "completed").length;
  const currentGoal = allGoals.find(g => g.status === "current");
  const progressPercent = (currentFunding / fundingGoal) * 100;

  return (
    <>
      <Helmet>
        <title>Go20 - Companheiro de RPG 100% Brasileiro</title>
        <meta name="description" content="O melhor companheiro digital para suas aventuras de D&D 5e. Fichas, campanhas, combate e muito mais. 100% em português!" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cosmic-purple/20 via-background to-background" />
          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <div className="flex flex-col items-center text-center space-y-8">
              <img 
                src={logoFull} 
                alt="Go20" 
                className="h-20 md:h-28 object-contain"
              />
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                O companheiro digital <span className="text-solar-orange font-semibold">100% brasileiro</span> para suas aventuras de RPG de mesa
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-solar-orange to-magenta-red hover:opacity-90 text-white gap-2"
                  onClick={() => window.open('https://www.catarse.me/go20', '_blank')}
                >
                  <Rocket className="h-5 w-5" />
                  Apoiar no Catarse
                  <ExternalLink className="h-4 w-4" />
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-cyan-blue/50 hover:bg-cyan-blue/10 gap-2"
                  onClick={() => window.location.href = '/'}
                >
                  <Sparkles className="h-5 w-5" />
                  Acessar o App
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Funding Progress */}
        <section className="py-12 border-y border-border/50 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Arrecadado</span>
                <span className="text-muted-foreground">Meta Final</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-2xl md:text-3xl font-bold text-solar-orange">
                  R$ {currentFunding.toLocaleString('pt-BR')}
                </span>
                <span className="text-xl text-muted-foreground">
                  R$ {fundingGoal.toLocaleString('pt-BR')}
                </span>
              </div>
              
              <Progress value={progressPercent} className="h-3" />
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4 text-cyan-blue" />
                <span>
                  <strong className="text-foreground">{completedGoals}</strong> de {allGoals.length} metas desbloqueadas
                </span>
              </div>

              {currentGoal && (
                <div className="text-center pt-2">
                  <Badge className="bg-solar-orange/20 text-solar-orange border-solar-orange/30">
                    Próxima: {currentGoal.title} (R$ {currentGoal.value.toLocaleString('pt-BR')})
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stretch Goals by Phase */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-cosmic-purple text-cosmic-purple">
                Stretch Goals
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Metas da Campanha
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Cada meta desbloqueada adiciona novas funcionalidades ao Go20. 
                Passe o mouse sobre cada meta para ver os detalhes!
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-10">
              {phases.map((phase) => {
                const PhaseIcon = phase.icon;
                const phaseCompleted = phase.goals.every(g => g.status === 'completed');
                const phaseInProgress = phase.goals.some(g => g.status === 'current');
                
                return (
                  <div key={phase.id} className="space-y-4">
                    {/* Phase Header */}
                    <div className={`flex items-center gap-3 pb-2 border-b ${getPhaseColorClass(phase.color, 'border')}/30`}>
                      <span className="text-2xl">{phase.emoji}</span>
                      <PhaseIcon className={`h-5 w-5 ${getPhaseColorClass(phase.color, 'text')}`} />
                      <h3 className={`text-lg font-bold ${getPhaseColorClass(phase.color, 'text')}`}>
                        FASE {phase.id}: {phase.name}
                      </h3>
                      {phaseCompleted && (
                        <Badge variant="outline" className="ml-auto border-emerald-500 text-emerald-500 text-xs">
                          ✓ Completa
                        </Badge>
                      )}
                      {phaseInProgress && (
                        <Badge className="ml-auto bg-solar-orange text-white text-xs">
                          Em Progresso
                        </Badge>
                      )}
                    </div>

                    {/* Phase Goals */}
                    <div className="grid gap-2">
                      {phase.goals.map((goal) => (
                        <HoverCard key={goal.id} openDelay={100} closeDelay={50}>
                          <HoverCardTrigger asChild>
                            <Card 
                              className={`p-4 transition-all cursor-pointer hover:scale-[1.01] ${
                                goal.status === 'completed' 
                                  ? `bg-${phase.color}/10 border-${phase.color}/30 ${getPhaseColorClass(phase.color, 'border')}/30` 
                                  : goal.status === 'current'
                                  ? 'bg-solar-orange/10 border-solar-orange/50 ring-2 ring-solar-orange/30'
                                  : 'bg-muted/30 border-border/50 opacity-70 hover:opacity-100'
                              }`}
                              style={goal.status === 'completed' ? {
                                backgroundColor: `hsl(var(--${phase.color === 'emerald' ? 'primary' : phase.color}) / 0.1)`,
                                borderColor: `hsl(var(--${phase.color === 'emerald' ? 'primary' : phase.color}) / 0.3)`,
                              } : undefined}
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                  {goal.status === 'completed' ? (
                                    <CheckCircle2 className={`h-5 w-5 ${getPhaseColorClass(phase.color, 'text')}`} />
                                  ) : goal.status === 'current' ? (
                                    <div className="relative">
                                      <Circle className="h-5 w-5 text-solar-orange animate-pulse" />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-2 w-2 bg-solar-orange rounded-full" />
                                      </div>
                                    </div>
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground/50" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm">{goal.title}</span>
                                    {goal.status === 'current' && (
                                      <Badge className="bg-solar-orange text-white text-xs">
                                        Próxima
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {goal.subtitle}
                                  </p>
                                </div>

                                <div className="flex-shrink-0 text-right">
                                  <span className={`text-sm font-medium ${
                                    goal.status === 'completed' 
                                      ? getPhaseColorClass(phase.color, 'text')
                                      : goal.status === 'current'
                                      ? 'text-solar-orange'
                                      : 'text-muted-foreground'
                                  }`}>
                                    R$ {goal.value.toLocaleString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          </HoverCardTrigger>
                          <HoverCardContent 
                            className="w-80 bg-card border-border shadow-lg z-50" 
                            side="right"
                            sideOffset={10}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold">{goal.title}</h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs flex-shrink-0 ${
                                    goal.status === 'completed' 
                                      ? 'border-emerald-500 text-emerald-500' 
                                      : goal.status === 'current'
                                      ? 'border-solar-orange text-solar-orange'
                                      : 'border-muted-foreground text-muted-foreground'
                                  }`}
                                >
                                  {goal.status === 'completed' ? '✓ Desbloqueada' : goal.status === 'current' ? 'Em andamento' : 'Pendente'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {goal.description}
                              </p>
                              <div className={`text-sm font-medium ${getPhaseColorClass(phase.color, 'text')}`}>
                                Meta: R$ {goal.value.toLocaleString('pt-BR')}
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-cosmic-purple/20 via-background to-solar-orange/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Faça Parte Dessa Aventura
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Apoie o Go20 e ajude a construir o melhor companheiro de RPG em português!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-solar-orange to-magenta-red hover:opacity-90 text-white gap-2"
                onClick={() => window.open('https://www.catarse.me/go20', '_blank')}
              >
                <Rocket className="h-5 w-5" />
                Apoiar no Catarse
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-cyan-blue/50 hover:bg-cyan-blue/10 gap-2"
                onClick={() => window.location.href = '/'}
              >
                <Sparkles className="h-5 w-5" />
                Experimentar Grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <img src={logoFull} alt="Go20" className="h-8 opacity-70" />
              
              <div className="flex gap-6 text-sm text-muted-foreground">
                <a 
                  href="https://discord.gg/go20" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Discord
                </a>
                <a 
                  href="https://www.catarse.me/go20" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Catarse
                </a>
              </div>

              <p className="text-xs text-muted-foreground">
                © 2025 Go20. Feito com ❤️ no Brasil.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
