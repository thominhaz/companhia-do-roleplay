import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Helmet } from "react-helmet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ExternalLink, 
  Rocket, 
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Castle,
  Wrench,
  Wand2,
  Drama,
  Map,
  ChevronLeft,
  ChevronRight,
  Users,
  Dice6,
  Shield,
  MessageSquare,
  Swords
} from "lucide-react";
import logoFull from "@/assets/logo-full.png";
import { motion } from "framer-motion";

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
      { id: 1, value: 600, title: "Primeiros Dados Rolados", subtitle: "Acesso Beta e servidores 24/7", description: "Ao atingirmos esta meta, abriremos os portões da Go20! Você terá acesso à versão Beta, poderá acessar o site imediatamente e revisar nossas ferramentas. Com esse valor, garantimos a infraestrutura para manter a Go20 online 24/7.", status: "completed" },
      { id: 2, value: 900, title: "Ficha de Personagem", subtitle: "Criação guiada, cálculos automáticos...", description: "O coração de todo aventureiro! Lançamos o sistema completo de fichas: criação guiada passo a passo, cálculos automáticos de atributos e modificadores, gestão de magias, inventário e progressão de nível.", status: "completed" },
      { id: 3, value: 1200, title: "Ferramentas do Mestre", subtitle: "Campanhas, Combat Tracker Pro...", description: "Ferramentas avançadas para quem senta atrás do escudo: criação e gestão de campanhas, Tracker de Combate com iniciativa automática e controle de HP, gestão de NPCs, Lojas e um chat integrado.", status: "completed" },
      { id: 4, value: 1500, title: "Calendário de Aventuras", subtitle: "Agendamento, lembretes e confirmação...", description: "Nunca mais perca uma sessão! Sistema de Agendamento completo. O mestre marca data/hora e todos recebem lembretes automáticos. Inclui sistema de RSVP para você saber quem estará na mesa.", status: "completed" },
      { id: 5, value: 1800, title: "Discord na Mesa", subtitle: "Webhooks para rolagens, lembretes...", description: "Integração total com seu servidor! A Go20 enviará automaticamente resultados de rolagens, lembretes de sessão e atualizações de combate via Webhook.", status: "completed" },
      { id: 6, value: 2200, title: "Compêndio Expandido", subtitle: "Grimório, itens mágicos e SRD 5.1", description: "Uma biblioteca de conhecimento ao seu alcance! SRD 5.1 completo traduzido, permitindo arrastar e soltar magias, itens mágicos e condições diretamente para a ficha.", status: "completed" },
      { id: 7, value: 2600, title: "Economia entre Jogadores", subtitle: "Trocas, presentes e vendas", description: "Sistema de Lojas Dinâmicas e Trocas P2P! Ofereça itens, negocie por ouro ou troque equipamentos com outros membros do grupo. Uma economia de RPG viva e funcional.", status: "completed" },
      { id: 8, value: 3000, title: "Facções e Reputação", subtitle: "Organizações e mapa de relacionamentos", description: "Crie guildas, ordens e reinos. Cada personagem terá sua própria reputação que flutua conforme suas escolhas. Inclui mapa de relacionamentos e histórico de eventos.", status: "completed" },
    ]
  },
  {
    id: 2,
    name: "EXPANSÃO",
    emoji: "🛠️",
    icon: Wrench,
    color: "cyan-blue",
    goals: [
      { id: 9, value: 3500, title: "Forja do Homebrew", subtitle: "Crie magias, itens e monstros", description: "Sua criatividade não tem limites! Ferramenta completa para criar suas próprias raças, classes, magias e monstros que se integram ao sistema como conteúdo oficial.", status: "completed" },
      { id: 10, value: 4000, title: "Oficina de Documentos", subtitle: "Cartas, pergaminhos e contratos", description: "Imersão máxima na entrega de pistas! Um editor visual para criar cartas seladas, pergaminhos antigos, contratos diabólicos e páginas de diário.", status: "current" },
      { id: 11, value: 4500, title: "Modo Offline Completo", subtitle: "Acesso total sem internet", description: "Sua mesa não precisa de Wi-Fi! Modo offline completo, permitindo acesso a fichas, regras e rolagens mesmo sem conexão.", status: "pending" },
      { id: 12, value: 5000, title: "Gerador de Encontros", subtitle: "Balanceamento e sugestões", description: "Mestres preparados em segundos! Sistema que sugere grupos de monstros baseados no nível do grupo, ambiente e dificuldade desejada.", status: "pending" },
      { id: 13, value: 5500, title: "Gerador de Tesouros", subtitle: "Recompensas automáticas", description: "Porque todo mundo ama loot! Gere tesouros condizentes com o desafio, desde moedas até itens mágicos raros.", status: "pending" },
      { id: 14, value: 6500, title: "Cronista Arcano (IA)", subtitle: "Resumos narrativos automáticos", description: "Chega de esquecer a última sessão! Nossa IA gera resumos narrativos épicos a partir dos logs de combate e notas.", status: "pending" },
      { id: 15, value: 7500, title: "Sábio das Regras (IA)", subtitle: "Chatbot integrado para dúvidas", description: "Um juiz imparcial na mesa! Tire dúvidas de regras instantaneamente com nosso bot treinado no SRD 5e.", status: "pending" },
    ]
  },
  {
    id: 3,
    name: "INOVAÇÃO",
    emoji: "🔮",
    icon: Wand2,
    color: "solar-orange",
    goals: [
      { id: 16, value: 8500, title: "Dados Animados 3D", subtitle: "Simulação visual com física", description: "A satisfação de rolar dados físicos, agora na tela! Dados 3D com física realista, colisão e sons satisfatórios.", status: "pending" },
      { id: 17, value: 10000, title: "Oficina de Mundos", subtitle: "Wiki de campanha completa", description: "O lar da sua Lore! Um sistema estilo Wiki para catalogar cidades, NPCs, divindades e linhas do tempo.", status: "pending" },
      { id: 18, value: 12000, title: "App Nativo Mobile", subtitle: "iOS e Android otimizados", description: "O grande sonho: Go20 no seu bolso! Apps nativos com notificações push e widgets de ficha.", status: "pending" },
      { id: 19, value: 15000, title: "Integração para Streams", subtitle: "Overlay para OBS/Twitch", description: "Overlays dinâmicos para OBS. Mostre iniciativa, HP e rolagens em tempo real na sua live.", status: "pending" },
    ]
  },
  {
    id: 4,
    name: "EXPERIÊNCIA IMERSIVA",
    emoji: "🎭",
    icon: Drama,
    color: "magenta-red",
    goals: [
      { id: 20, value: 18000, title: "Modo Teatro (Projeção)", subtitle: "Interface para TV/Projetor", description: "A união do presencial com o digital! Visualização especial para TV/Projetor na sala, sem mostrar segredos do Mestre.", status: "pending" },
      { id: 21, value: 22000, title: "Trilha Sonora Integrada", subtitle: "Controle de músicas por ambiente", description: "O som dita o clima! Player integrado com playlists temáticas sincronizadas nos dispositivos de todos.", status: "pending" },
      { id: 22, value: 25000, title: "Soundboard de Efeitos", subtitle: "Sons épicos instantâneos", description: "Mesa de som com efeitos prontos: explosões, rugidos de dragão, espadas colidindo. Imersão sonora ao clique.", status: "pending" },
      { id: 23, value: 28000, title: "Arte e Identidade Visual", subtitle: "Ilustrações exclusivas", description: "Artistas profissionais criarão identidade visual única, ícones personalizados e ilustrações exclusivas.", status: "pending" },
      { id: 24, value: 32000, title: "Imersão Atmosférica", subtitle: "Efeitos visuais de clima", description: "Efeitos visuais de ambiente: chuva, neblina, brasas de vulcão ou iluminação de tochas na interface.", status: "pending" },
    ]
  },
  {
    id: 5,
    name: "MESA VIRTUAL",
    emoji: "🗺️",
    icon: Map,
    color: "emerald",
    goals: [
      { id: 25, value: 38000, title: "VTT Básico Integrado", subtitle: "Grid, tokens e Fog of War", description: "A Go20 vira VTT completo! Mapas de batalha com grid, tokens em tempo real e névoa de guerra.", status: "pending" },
      { id: 26, value: 42000, title: "Oficina de Tokens", subtitle: "Corte e customize imagens", description: "Transforme qualquer imagem em token! Ferramenta para cortar, adicionar bordas e salvar tokens perfeitos.", status: "pending" },
      { id: 27, value: 50000, title: "Oficina de Mapas", subtitle: "Construa cenários no app", description: "Torne-se o arquiteto! Construtor de mapas leve para desenhar paredes, pisos e criar cenários rapidamente.", status: "pending" },
    ]
  },
];

// FAQ data
const faqData = [
  {
    category: "Sobre o Go20",
    questions: [
      { q: "O que é o Go20?", a: "Go20 é um companheiro digital 100% brasileiro para RPG de mesa, focado em D&D 5e. Oferecemos fichas de personagem, gestão de campanhas, combate em tempo real, chat integrado e muito mais - tudo em português!" },
      { q: "Preciso pagar para usar?", a: "O Go20 tem um plano gratuito (Visitante) que permite acessar o compêndio e ferramentas básicas. Para criar personagens e campanhas, você precisa de um plano pago que pode ser obtido apoiando nossa campanha no Catarse." },
      { q: "Funciona no celular?", a: "Sim! O Go20 é um PWA (Progressive Web App) otimizado para mobile. Funciona em qualquer navegador moderno no celular, tablet ou computador, sem precisar instalar nada." },
    ]
  },
  {
    category: "Sobre o Financiamento",
    questions: [
      { q: "Como funciona o apoio no Catarse?", a: "O Catarse é uma plataforma de financiamento coletivo. Ao apoiar, você escolhe um nível de recompensa que dá acesso a diferentes planos do Go20 enquanto seu apoio estiver ativo." },
      { q: "Quando recebo meu acesso?", a: "O acesso é imediato! Assim que seu pagamento for confirmado, você receberá um código para resgatar no Go20 e terá acesso ao plano correspondente." },
      { q: "As metas (Stretch Goals) são garantidas?", a: "As metas são objetivos de desenvolvimento. Quanto mais apoio recebermos, mais funcionalidades serão desenvolvidas. Metas já alcançadas são garantidas para todos os apoiadores." },
    ]
  },
  {
    category: "Funcionalidades",
    questions: [
      { q: "Posso jogar com meus amigos?", a: "Sim! O sistema de campanhas permite que um Mestre crie uma campanha e convide jogadores através de um código. Todos podem participar do chat em tempo real e acompanhar o combate." },
      { q: "Posso criar meu próprio conteúdo?", a: "Com a Forja do Homebrew (plano Herói ou superior), você pode criar suas próprias raças, classes, magias e monstros que funcionam como conteúdo oficial dentro do sistema." },
      { q: "Funciona offline?", a: "Parcialmente. Atualmente algumas funcionalidades funcionam offline, mas o modo offline completo é uma meta futura do financiamento." },
    ]
  },
];

// Current funding
const currentFunding = 3800;
const fundingGoal = 50000;

const features = [
  { icon: Dice6, title: "Rolagem de Dados", description: "Dados integrados com modificadores automáticos" },
  { icon: Shield, title: "Fichas Completas", description: "Criação guiada e cálculos automáticos" },
  { icon: Swords, title: "Combat Tracker", description: "Combate sincronizado em tempo real" },
  { icon: Users, title: "Campanhas Online", description: "Gerencie sua mesa com facilidade" },
  { icon: MessageSquare, title: "Chat Integrado", description: "Comunicação entre mestre e jogadores" },
  { icon: Wand2, title: "Homebrew", description: "Crie seu próprio conteúdo" },
];

export default function Landing() {
  const allGoals = phases.flatMap(p => p.goals);
  const completedGoals = allGoals.filter(g => g.status === "completed").length;
  const currentGoal = allGoals.find(g => g.status === "current");
  const progressPercent = (currentFunding / fundingGoal) * 100;

  const [activePhase, setActivePhase] = useState(0);

  return (
    <>
      <Helmet>
        <title>Go20 - Companheiro de RPG 100% Brasileiro</title>
        <meta name="description" content="O melhor companheiro digital para suas aventuras de D&D 5e. Fichas, campanhas, combate e muito mais. 100% em português!" />
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-lg border-b border-white/10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <img src={logoFull} alt="Go20" className="h-10" />
            <div className="flex gap-3">
              <Button 
                size="sm" 
                variant="ghost" 
                className="hidden sm:flex text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => window.location.href = '/'}
              >
                Acessar App
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-solar-orange to-magenta-red hover:opacity-90 text-white"
                onClick={() => window.open('https://www.catarse.me/go20', '_blank')}
              >
                <Rocket className="h-4 w-4 mr-2" />
                Apoiar
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section with Banner */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-16">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-cosmic-purple/40 via-[#0a0a0f] to-[#0a0a0f]" />
          <div className="absolute inset-0 opacity-30" style={{ 
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255, 159, 85, 0.1) 0%, transparent 50%)'
          }} />
          
          <div className="relative container mx-auto px-4 py-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cosmic-purple/20 border border-cosmic-purple/30 text-cosmic-purple text-sm">
                  <Sparkles className="h-4 w-4" />
                  Beta Aberta
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-white">Jogue </span>
                  <span className="text-solar-orange">RPG</span>
                  <br />
                  <span className="text-white/90 italic">em qualquer </span>
                  <span className="text-cyan-blue">aparelho.</span>
                </h1>
                
                <p className="text-lg text-white/60 max-w-md mx-auto lg:mx-0">
                  O melhor companheiro de RPG do Brasil está com acesso liberado. 
                  Para ter acesso completo, basta apoiar o projeto. 
                  <strong className="text-white"> O acesso é imediato!</strong>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-solar-orange to-magenta-red hover:opacity-90 text-white shadow-lg shadow-solar-orange/25 gap-2"
                    onClick={() => window.open('https://www.catarse.me/go20', '_blank')}
                  >
                    <Rocket className="h-5 w-5" />
                    APOIE E JOGUE!
                  </Button>
                  
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 gap-2"
                    onClick={() => window.location.href = '/'}
                  >
                    Experimentar Grátis
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>

              {/* Feature Cards Demo */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="hidden lg:block"
              >
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    >
                      <Card className="p-4 bg-white/5 border-white/10 hover:bg-white/10 hover:border-cosmic-purple/50 transition-all cursor-pointer group">
                        <feature.icon className="h-8 w-8 text-cosmic-purple mb-3 group-hover:text-solar-orange transition-colors" />
                        <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                        <p className="text-sm text-white/50">{feature.description}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Funding Progress */}
        <section className="py-12 bg-gradient-to-b from-[#0a0a0f] to-cosmic-purple/10 border-y border-white/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-solar-orange">
                    R$ {currentFunding.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-white/50">arrecadados até agora</div>
                </div>
                
                <div className="text-center">
                  <Badge className="bg-cosmic-purple/20 text-cosmic-purple border-cosmic-purple/30 text-lg px-4 py-2">
                    META {phases.findIndex(p => p.goals.some(g => g.status === 'current')) + 2} | {currentGoal?.title}
                  </Badge>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(progressPercent)}%
                  </div>
                  <div className="text-white/50">da meta final</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-cosmic-purple via-solar-orange to-magenta-red rounded-full"
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm text-white/40">
                  <span>R$ 0</span>
                  <span>R$ {fundingGoal.toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <div className="text-center mt-4 text-white/60">
                <strong className="text-white">{completedGoals}</strong> de {allGoals.length} metas desbloqueadas
              </div>
            </div>
          </div>
        </section>

        {/* Stretch Goals Carousel */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Metas da Campanha
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">
                Cada meta desbloqueada adiciona novas funcionalidades ao Go20
              </p>
            </div>

            {/* Phase Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {phases.map((phase, index) => {
                const PhaseIcon = phase.icon;
                const isActive = activePhase === index;
                const phaseCompleted = phase.goals.every(g => g.status === 'completed');
                
                return (
                  <button
                    key={phase.id}
                    onClick={() => setActivePhase(index)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-cosmic-purple text-white' 
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{phase.emoji}</span>
                    <span className="hidden sm:inline">{phase.name}</span>
                    {phaseCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            {/* Goals Carousel */}
            <div className="relative">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-4 pb-4">
                  {phases[activePhase].goals.map((goal) => (
                    <Card 
                      key={goal.id}
                      className={`flex-shrink-0 w-[300px] md:w-[350px] p-6 border transition-all ${
                        goal.status === 'completed'
                          ? 'bg-cosmic-purple/10 border-cosmic-purple/50'
                          : goal.status === 'current'
                          ? 'bg-solar-orange/10 border-solar-orange/50 ring-2 ring-solar-orange/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="space-y-4 whitespace-normal">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-white text-lg leading-tight">{goal.title}</h3>
                          {goal.status === 'completed' && (
                            <CheckCircle2 className="h-5 w-5 text-cosmic-purple flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="text-solar-orange font-bold text-xl">
                          R$ {goal.value.toLocaleString('pt-BR')}
                        </div>
                        
                        <p className="text-white/50 text-sm leading-relaxed">
                          {goal.description}
                        </p>

                        {goal.status === 'completed' && (
                          <Badge className="bg-cosmic-purple/20 text-cosmic-purple border-cosmic-purple/30">
                            META ALCANÇADA
                          </Badge>
                        )}
                        {goal.status === 'current' && (
                          <Badge className="bg-solar-orange text-white animate-pulse">
                            PRÓXIMA META
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-[#0a0a0f] to-cosmic-purple/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
              {faqData.map((category) => (
                <div key={category.category}>
                  <h3 className="text-cosmic-purple font-semibold mb-4 text-lg">
                    {category.category}
                  </h3>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.questions.map((item, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`${category.category}-${index}`}
                        className="bg-white/5 border border-white/10 rounded-lg px-4 data-[state=open]:bg-white/10"
                      >
                        <AccordionTrigger className="text-white hover:text-solar-orange hover:no-underline py-4">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-white/60 pb-4">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-cosmic-purple/30 via-[#0a0a0f] to-solar-orange/20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Faça Parte Dessa Aventura
            </h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              Apoie o Go20 e ajude a construir o melhor companheiro de RPG em português!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-solar-orange to-magenta-red hover:opacity-90 text-white shadow-lg shadow-solar-orange/25 gap-2 text-lg px-8"
                onClick={() => window.open('https://www.catarse.me/go20', '_blank')}
              >
                <Rocket className="h-5 w-5" />
                Apoiar no Catarse
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 gap-2"
                onClick={() => window.location.href = '/'}
              >
                <Sparkles className="h-5 w-5" />
                Experimentar Grátis
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/10 bg-[#050508]">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <img src={logoFull} alt="Go20" className="h-10 opacity-70" />
              
              <div className="flex gap-6 text-sm text-white/50">
                <a 
                  href="https://discord.gg/go20" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Discord
                </a>
                <a 
                  href="https://www.instagram.com/go20app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Instagram
                </a>
                <a 
                  href="https://www.catarse.me/go20" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Catarse
                </a>
              </div>

              <p className="text-sm text-white/40">
                © 2025 Go20. Feito com ❤️ no Brasil.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
