import { useState, useMemo } from "react";
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
  Swords,
  Target,
  Loader2,
  BookOpen,
  Gift,
  Play,
  Scroll,
  Store,
  UserCheck,
  Crown,
  User,
  Hammer,
  X,
  Check
} from "lucide-react";
import logoFull from "@/assets/logo-full.png";
import { motion } from "framer-motion";
import { CharacterSheetPreview } from "@/components/landing/CharacterSheetPreview";
import { useStretchGoals, useCampaignFunding, StretchGoal } from "@/hooks/useStretchGoals";

interface Phase {
  id: number;
  name: string;
  emoji: string;
  icon: React.ElementType;
  color: string;
  goals: StretchGoal[];
}

// Map phase names to icons
const phaseIcons: Record<string, { icon: React.ElementType; color: string }> = {
  "FUNDAÇÃO": { icon: Castle, color: "cosmic-purple" },
  "EXPANSÃO": { icon: Wrench, color: "cyan-blue" },
  "INOVAÇÃO": { icon: Wand2, color: "solar-orange" },
  "EXPERIÊNCIA IMERSIVA": { icon: Drama, color: "magenta-red" },
  "MESA VIRTUAL": { icon: Map, color: "emerald" },
};

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

const features = [
  { 
    icon: Shield, 
    title: "Fichas de Personagem", 
    description: "Criação guiada passo a passo com cálculos automáticos de modificadores, HP, AC e proficiências.",
    highlights: ["Wizard de criação", "Cálculos automáticos", "PDF exportável"]
  },
  { 
    icon: Swords, 
    title: "Combat Tracker Pro", 
    description: "Rastreie iniciativas, HP, condições e turnos em tempo real. Todos os jogadores veem as atualizações instantaneamente.",
    highlights: ["Tempo real", "Condições D&D 5e", "Log de combate"]
  },
  { 
    icon: MessageSquare, 
    title: "Chat & Comunicação", 
    description: "Chat de campanha integrado com suporte a mensagens privadas entre mestre e jogadores.",
    highlights: ["Chat em tempo real", "Mensagens privadas", "Notificações"]
  },
  { 
    icon: Wand2, 
    title: "Forja de Homebrew", 
    description: "Crie suas próprias raças, classes, magias e monstros que funcionam perfeitamente no sistema.",
    highlights: ["Raças e classes", "Magias customizadas", "Bestiário próprio"]
  },
  { 
    icon: Store, 
    title: "Lojas & Comércio", 
    description: "Sistema de lojas da campanha com inventário, preços e transações entre jogadores.",
    highlights: ["Lojas dinâmicas", "Trocas P2P", "Histórico"]
  },
  { 
    icon: Scroll, 
    title: "Documentos & Notas", 
    description: "Crie cartas, pergaminhos e decretos estilizados para entregar aos jogadores.",
    highlights: ["Estilos temáticos", "Exportar PNG", "Entrega seletiva"]
  },
];

const howItWorks = [
  {
    step: 1,
    icon: Rocket,
    title: "Apoie o Projeto",
    description: "Escolha um nível de apoio no Catarse e ajude a construir o Go20.",
    color: "solar-orange"
  },
  {
    step: 2,
    icon: Gift,
    title: "Resgate seu Código",
    description: "Receba instantaneamente um código para ativar seu plano no app.",
    color: "cosmic-purple"
  },
  {
    step: 3,
    icon: Play,
    title: "Comece a Jogar!",
    description: "Crie personagens, monte campanhas e convide seus amigos.",
    color: "cyan-blue"
  }
];

export default function Landing() {
  const { data: stretchGoals = [], isLoading: isLoadingGoals } = useStretchGoals();
  const { data: campaignFunding, isLoading: isLoadingFunding } = useCampaignFunding();
  
  const [activePhase, setActivePhase] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  // Group goals by phase
  const phases = useMemo(() => {
    if (!stretchGoals.length) return [] as Phase[];
    
    const phaseMap = {} as Record<string, StretchGoal[]>;
    
    stretchGoals.forEach(goal => {
      const phaseName = goal.phase || "FUNDAÇÃO";
      if (!phaseMap[phaseName]) {
        phaseMap[phaseName] = [];
      }
      phaseMap[phaseName].push(goal);
    });

    return Object.entries(phaseMap)
      .sort((a, b) => {
        const orderA = stretchGoals.find(g => g.phase === a[0])?.phase_order ?? 999;
        const orderB = stretchGoals.find(g => g.phase === b[0])?.phase_order ?? 999;
        return orderA - orderB;
      })
      .map((entry, index) => {
        const phaseName = entry[0];
        const goals = entry[1];
        const phaseInfo = phaseIcons[phaseName] || { icon: Castle, color: "cosmic-purple" };
        const firstGoal = goals[0];
        
        return {
          id: index + 1,
          name: phaseName,
          emoji: firstGoal?.phase_emoji || "🎯",
          icon: phaseInfo.icon,
          color: phaseInfo.color,
          goals: goals.sort((a, b) => a.sort_order - b.sort_order),
        } as Phase;
      });
  }, [stretchGoals]);

  const allGoals = phases.flatMap(p => p.goals);
  const completedGoals = allGoals.filter(g => g.status === "completed").length;
  const currentGoal = allGoals.find(g => g.status === "current");
  
  const currentFunding = campaignFunding?.current_amount ?? 0;
  const fundingGoal = campaignFunding?.goal_amount ?? 50000;
  const progressPercent = fundingGoal > 0 ? (currentFunding / fundingGoal) * 100 : 0;

  const isLoading = isLoadingGoals || isLoadingFunding;

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

              {/* Character Sheet Preview */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="hidden lg:block max-w-sm mx-auto"
              >
                <CharacterSheetPreview />
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-[#0a0a0f] to-cosmic-purple/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 text-white/60 mb-2">
                <UserCheck className="h-5 w-5" />
                <span>Simples e Rápido</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Como Funciona
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">
                Em 3 passos você já está jogando com seus amigos
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {howItWorks.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.15 }}
                      viewport={{ once: true }}
                      className="relative"
                    >
                      {/* Connector Line */}
                      {index < howItWorks.length - 1 && (
                        <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-white/20 to-transparent" />
                      )}
                      
                      <div className="flex flex-col items-center text-center">
                        <div className={`
                          w-24 h-24 rounded-2xl flex items-center justify-center mb-4
                          ${item.color === 'solar-orange' ? 'bg-solar-orange/20 border-solar-orange/40' : ''}
                          ${item.color === 'cosmic-purple' ? 'bg-cosmic-purple/20 border-cosmic-purple/40' : ''}
                          ${item.color === 'cyan-blue' ? 'bg-cyan-blue/20 border-cyan-blue/40' : ''}
                          border-2 relative
                        `}>
                          <Icon className={`h-10 w-10 ${
                            item.color === 'solar-orange' ? 'text-solar-orange' :
                            item.color === 'cosmic-purple' ? 'text-cosmic-purple' :
                            'text-cyan-blue'
                          }`} />
                          <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            item.color === 'solar-orange' ? 'bg-solar-orange text-white' :
                            item.color === 'cosmic-purple' ? 'bg-cosmic-purple text-white' :
                            'bg-cyan-blue text-white'
                          }`}>
                            {item.step}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-white/50 text-sm">{item.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="text-center mt-10">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-solar-orange to-magenta-red hover:opacity-90 text-white gap-2"
                  onClick={() => window.open('https://www.catarse.me/go20', '_blank')}
                >
                  <Rocket className="h-5 w-5" />
                  Começar Agora
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Tabs Section */}
        <section className="py-16 md:py-24 bg-[#0a0a0f]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 text-white/60 mb-2">
                <Sparkles className="h-5 w-5" />
                <span>Funcionalidades</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Tudo que Você Precisa
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">
                Ferramentas poderosas para jogadores e mestres
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              {/* Tabs */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => setActiveFeature(index)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeFeature === index
                          ? 'bg-cosmic-purple text-white shadow-lg shadow-cosmic-purple/25'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{feature.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feature Content */}
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-2 gap-8 items-center"
              >
                {/* Description Side */}
                <div className="order-2 md:order-1">
                  <div className="flex items-center gap-3 mb-4">
                    {(() => {
                      const Icon = features[activeFeature].icon;
                      return <Icon className="h-8 w-8 text-cosmic-purple" />;
                    })()}
                    <h3 className="text-2xl font-bold text-white">
                      {features[activeFeature].title}
                    </h3>
                  </div>
                  <p className="text-white/60 text-lg mb-6">
                    {features[activeFeature].description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {features[activeFeature].highlights.map((highlight, idx) => (
                      <Badge 
                        key={idx}
                        className="bg-solar-orange/10 text-solar-orange border-solar-orange/20"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Visual Side - Mockup/Preview */}
                <div className="order-1 md:order-2">
                  <div className="relative">
                    <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-cosmic-purple/20 to-solar-orange/10 border border-white/10 flex items-center justify-center overflow-hidden">
                      <div className="text-center p-8">
                        {(() => {
                          const Icon = features[activeFeature].icon;
                          return (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.4 }}
                            >
                              <Icon className="h-24 w-24 text-cosmic-purple/50 mx-auto mb-4" />
                              <p className="text-white/40 text-sm">
                                Preview interativo em breve
                              </p>
                            </motion.div>
                          );
                        })()}
                      </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -z-10 top-4 left-4 w-full h-full rounded-2xl bg-cosmic-purple/10 blur-xl" />
                  </div>
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

        {/* Pricing Comparison Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-[#0a0a0f] to-cosmic-purple/10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 text-white/60 mb-2">
                <Crown className="h-5 w-5" />
                <span>Planos & Acesso</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Escolha Seu Nível de Aventura
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">
                Apoie o projeto no Catarse e desbloqueie recursos exclusivos
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* Visitante */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0 }}
                viewport={{ once: true }}
              >
                <Card className="relative h-full bg-white/5 border-white/10 p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-white/60" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Visitante</h3>
                      <p className="text-white/40 text-sm">Gratuito</p>
                    </div>
                  </div>
                  
                  <p className="text-white/50 text-sm mb-6">
                    Explore o compêndio e ferramentas básicas
                  </p>

                  <ul className="space-y-3 mb-6 flex-grow">
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Compêndio SRD 5.1
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Rolador de dados
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/40">
                      <X className="h-4 w-4 text-white/20 flex-shrink-0" />
                      Criar personagens
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/40">
                      <X className="h-4 w-4 text-white/20 flex-shrink-0" />
                      Participar de campanhas
                    </li>
                  </ul>

                  <Button 
                    variant="outline" 
                    className="w-full border-white/20 text-white/60 hover:bg-white/10"
                    onClick={() => window.location.href = '/'}
                  >
                    Experimentar
                  </Button>
                </Card>
              </motion.div>

              {/* Aldeão */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="relative h-full bg-cyan-blue/10 border-cyan-blue/30 p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-blue/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-cyan-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Aldeão</h3>
                      <p className="text-cyan-blue text-sm font-medium">R$ 10/mês</p>
                    </div>
                  </div>
                  
                  <p className="text-white/50 text-sm mb-6">
                    Perfeito para jogadores iniciantes
                  </p>

                  <ul className="space-y-3 mb-6 flex-grow">
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Tudo do Visitante
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Até 3 personagens
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Notas rápidas
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Participar de campanhas
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/40">
                      <X className="h-4 w-4 text-white/20 flex-shrink-0" />
                      Forja de Homebrew
                    </li>
                  </ul>

                  <Button 
                    className="w-full bg-cyan-blue hover:bg-cyan-blue/80 text-white"
                    onClick={() => window.open('https://www.catarse.me/go20', '_blank')}
                  >
                    Apoiar
                  </Button>
                </Card>
              </motion.div>

              {/* Herói */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="relative h-full bg-cosmic-purple/10 border-cosmic-purple/30 p-6 flex flex-col">
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cosmic-purple text-white border-0">
                    Popular
                  </Badge>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cosmic-purple/20 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-cosmic-purple" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Herói</h3>
                      <p className="text-cosmic-purple text-sm font-medium">R$ 25/mês</p>
                    </div>
                  </div>
                  
                  <p className="text-white/50 text-sm mb-6">
                    Para jogadores que querem mais
                  </p>

                  <ul className="space-y-3 mb-6 flex-grow">
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Tudo do Aldeão
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Até 20 personagens
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Temas personalizados
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Forja de Homebrew
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/40">
                      <X className="h-4 w-4 text-white/20 flex-shrink-0" />
                      Ferramentas de Mestre
                    </li>
                  </ul>

                  <Button 
                    className="w-full bg-cosmic-purple hover:bg-cosmic-purple/80 text-white"
                    onClick={() => window.open('https://www.catarse.me/go20', '_blank')}
                  >
                    Apoiar
                  </Button>
                </Card>
              </motion.div>

              {/* Mestre */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Card className="relative h-full bg-gradient-to-br from-solar-orange/20 to-magenta-red/20 border-solar-orange/40 p-6 flex flex-col">
                  <div className="absolute inset-0 bg-gradient-to-br from-solar-orange/5 to-magenta-red/5 rounded-xl" />
                  
                  <div className="relative flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-solar-orange to-magenta-red flex items-center justify-center">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Mestre</h3>
                      <p className="text-solar-orange text-sm font-medium">R$ 50/mês</p>
                    </div>
                  </div>
                  
                  <p className="relative text-white/50 text-sm mb-6">
                    Acesso completo a todas as ferramentas
                  </p>

                  <ul className="relative space-y-3 mb-6 flex-grow">
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Tudo do Herói
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Personagens ilimitados
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Criar campanhas
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Combat Tracker Pro
                    </li>
                    <li className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      Integração Discord
                    </li>
                  </ul>

                  <Button 
                    className="relative w-full bg-gradient-to-r from-solar-orange to-magenta-red hover:opacity-90 text-white"
                    onClick={() => window.open('https://www.catarse.me/go20', '_blank')}
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Apoiar
                  </Button>
                </Card>
              </motion.div>
            </div>

            <p className="text-center text-white/40 text-sm mt-8 max-w-lg mx-auto">
              Apoios recorrentes no Catarse garantem acesso enquanto estiver ativo. 
              Níveis <strong className="text-white/60">Épico</strong> e <strong className="text-white/60">Lendário</strong> oferecem acesso vitalício.
            </p>
          </div>
        </section>

        {/* Stretch Goals Timeline */}
        <section className="py-16 md:py-24 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 text-white/60 mb-2">
                <Target className="h-5 w-5" />
                <span>Timeline das Metas</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Visualize a Jornada do Go20
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">
                Acompanhe cada conquista e veja o que está por vir
              </p>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cosmic-purple" />
              </div>
            ) : phases.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                Nenhuma meta cadastrada ainda.
              </div>
            ) : (
              <>
                {/* Phase Tabs - Navigation */}
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                  {phases.map((phase, index) => {
                    const phaseCompleted = phase.goals.every(g => g.status === 'completed');
                    
                    return (
                      <button
                        key={phase.id}
                        onClick={() => {
                          const element = document.getElementById(`phase-${phase.id}`);
                          element?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all bg-white/5 text-white/60 hover:bg-cosmic-purple hover:text-white"
                      >
                        <span>{phase.emoji}</span>
                        <span className="hidden sm:inline">{phase.name}</span>
                        {phaseCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>

            {/* Timeline - All Goals */}
            <div className="relative">
              <ScrollArea className="w-full">
                <div className="relative py-4" style={{ minWidth: `${allGoals.length * 220}px` }}>
                  {/* Timeline Line */}
                  <div className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-cosmic-purple via-solar-orange to-magenta-red rounded-full" style={{ transform: 'translateY(-50%)' }} />
                  
                  {/* Goals */}
                  <div className="relative flex">
                    {phases.map((phase, phaseIndex) => (
                      <div key={phase.id} id={`phase-${phase.id}`} className="flex">
                        {/* Phase Marker */}
                        <div className="relative flex flex-col items-center mx-2 first:ml-4">
                          <div className="h-[150px]" /> {/* Spacer for above cards */}
                          <div className="relative z-20 my-4">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                              phase.goals.every(g => g.status === 'completed')
                                ? 'bg-cosmic-purple text-white'
                                : phase.goals.some(g => g.status === 'current')
                                ? 'bg-solar-orange text-white'
                                : 'bg-white/10 text-white/60'
                            }`}>
                              {phase.emoji} {phase.name}
                            </div>
                          </div>
                          <div className="h-[150px]" /> {/* Spacer for below cards */}
                        </div>
                        
                        {/* Phase Goals */}
                        {phase.goals.map((goal, index) => {
                          const globalIndex = allGoals.findIndex(g => g.id === goal.id);
                          const isAbove = globalIndex % 2 === 0;
                          
                          return (
                            <div 
                              key={goal.id} 
                              className="relative flex flex-col items-center w-[200px] flex-shrink-0"
                            >
                              {/* Card - Above */}
                              <div className={`h-[150px] flex items-end pb-4 ${isAbove ? '' : 'invisible'}`}>
                                {isAbove && (
                                  <Card 
                                    className={`w-[180px] p-3 border transition-all hover:scale-105 cursor-pointer ${
                                      goal.status === 'completed'
                                        ? 'bg-cosmic-purple/20 border-cosmic-purple/50'
                                        : goal.status === 'current'
                                        ? 'bg-solar-orange/20 border-solar-orange/50'
                                        : 'bg-white/5 border-white/20'
                                    }`}
                                  >
                                    <h4 className="font-bold text-white text-sm mb-1 line-clamp-2">{goal.title}</h4>
                                    <div className={`text-sm font-bold mb-1 ${
                                      goal.status === 'completed' ? 'text-cosmic-purple' : 
                                      goal.status === 'current' ? 'text-solar-orange' : 'text-white/50'
                                    }`}>
                                      R$ {goal.value.toLocaleString('pt-BR')}
                                    </div>
                                    <p className="text-white/40 text-xs line-clamp-2">{goal.subtitle}</p>
                                  </Card>
                                )}
                              </div>
                              
                              {/* Node */}
                              <div className="relative z-10 my-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-3 ${
                                  goal.status === 'completed'
                                    ? 'bg-cosmic-purple border-cosmic-purple/50 text-white'
                                    : goal.status === 'current'
                                    ? 'bg-solar-orange border-solar-orange/50 text-white'
                                    : 'bg-[#0a0a0f] border-white/30 text-white/50'
                                }`}>
                                  {goal.status === 'completed' ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <span className="text-xs font-bold">{String(globalIndex + 1).padStart(2, '0')}</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Card - Below */}
                              <div className={`h-[150px] flex items-start pt-4 ${!isAbove ? '' : 'invisible'}`}>
                                {!isAbove && (
                                  <Card 
                                    className={`w-[180px] p-3 border transition-all hover:scale-105 cursor-pointer ${
                                      goal.status === 'completed'
                                        ? 'bg-cosmic-purple/20 border-cosmic-purple/50'
                                        : goal.status === 'current'
                                        ? 'bg-solar-orange/20 border-solar-orange/50'
                                        : 'bg-white/5 border-white/20'
                                    }`}
                                  >
                                    <h4 className="font-bold text-white text-sm mb-1 line-clamp-2">{goal.title}</h4>
                                    <div className={`text-sm font-bold mb-1 ${
                                      goal.status === 'completed' ? 'text-cosmic-purple' : 
                                      goal.status === 'current' ? 'text-solar-orange' : 'text-white/50'
                                    }`}>
                                      R$ {goal.value.toLocaleString('pt-BR')}
                                    </div>
                                    <p className="text-white/40 text-xs line-clamp-2">{goal.subtitle}</p>
                                  </Card>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              
              {/* Scroll hints */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-full bg-gradient-to-r from-[#0a0a0f] to-transparent pointer-events-none flex items-center justify-start pl-2">
                <ChevronLeft className="h-6 w-6 text-white/30" />
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-full bg-gradient-to-l from-[#0a0a0f] to-transparent pointer-events-none flex items-center justify-end pr-2">
                <ChevronRight className="h-6 w-6 text-white/30" />
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-cosmic-purple" />
                <span className="text-white/60">Alcançada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-solar-orange" />
                <span className="text-white/60">Em Andamento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-white/20" />
                <span className="text-white/60">Futura</span>
              </div>
            </div>
              </>
            )}
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
