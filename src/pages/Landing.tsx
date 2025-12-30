import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Helmet } from "react-helmet";
import { 
  ExternalLink, 
  Rocket, 
  Target,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight
} from "lucide-react";
import logoFull from "@/assets/logo-full.png";

// Stretch Goals data based on Catarse campaign
const stretchGoals = [
  { id: 1, value: 1000, title: "Fundação do Go20", description: "App funcional com criação de fichas e rolagem", status: "completed" },
  { id: 2, value: 2000, title: "Campanhas Online", description: "Sistema de campanhas com código de convite", status: "completed" },
  { id: 3, value: 3000, title: "Combat Tracker", description: "Rastreador de combate sincronizado", status: "completed" },
  { id: 4, value: 4000, title: "Chat em Tempo Real", description: "Comunicação entre mestre e jogadores", status: "completed" },
  { id: 5, value: 5000, title: "Sistema de Lojas", description: "Lojas dinâmicas com transações", status: "completed" },
  { id: 6, value: 6000, title: "Facções & Reputação", description: "Sistema de facções com níveis de reputação", status: "completed" },
  { id: 7, value: 7500, title: "Timeline de Campanha", description: "Linha do tempo narrativa", status: "completed" },
  { id: 8, value: 10000, title: "Gerador de Encontros", description: "Geração automática de encontros balanceados", status: "current" },
  { id: 9, value: 12500, title: "Gerador de Tesouros", description: "Loot tables personalizáveis", status: "pending" },
  { id: 10, value: 15000, title: "IA Mestre Assistente", description: "Sugestões narrativas com IA", status: "pending" },
  { id: 11, value: 17500, title: "Gerador de NPCs", description: "Criação procedural de NPCs", status: "pending" },
  { id: 12, value: 20000, title: "Exportação PDF Pro", description: "Fichas e documentos em PDF estilizados", status: "pending" },
  { id: 13, value: 22500, title: "Modo Escuro OLED", description: "Tema otimizado para telas AMOLED", status: "pending" },
  { id: 14, value: 25000, title: "App Nativo iOS/Android", description: "Aplicativo nativo nas lojas", status: "pending" },
  { id: 15, value: 30000, title: "Dados 3D Animados", description: "Rolagem de dados com física 3D", status: "pending" },
  { id: 16, value: 35000, title: "Biblioteca de Sons", description: "Efeitos sonoros e ambientes", status: "pending" },
  { id: 17, value: 40000, title: "Temas Visuais", description: "Temas personalizáveis por campanha", status: "pending" },
  { id: 18, value: 45000, title: "Oficina de Mapas", description: "Editor de mapas integrado", status: "pending" },
  { id: 19, value: 50000, title: "Mesa Virtual Completa", description: "VTT com tokens e grid", status: "pending" },
];

// Current funding (this would ideally come from an API)
const currentFunding = 8500;
const fundingGoal = 50000;

export default function Landing() {
  const completedGoals = stretchGoals.filter(g => g.status === "completed").length;
  const currentGoal = stretchGoals.find(g => g.status === "current");
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
                  <strong className="text-foreground">{completedGoals}</strong> de {stretchGoals.length} metas desbloqueadas
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Stretch Goals Timeline */}
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
                Quanto mais apoio, mais recursos para todos!
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-3">
              {stretchGoals.map((goal, index) => (
                <Card 
                  key={goal.id}
                  className={`p-4 transition-all ${
                    goal.status === 'completed' 
                      ? 'bg-cosmic-purple/10 border-cosmic-purple/30' 
                      : goal.status === 'current'
                      ? 'bg-solar-orange/10 border-solar-orange/50 ring-2 ring-solar-orange/30'
                      : 'bg-muted/30 border-border/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {goal.status === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6 text-cosmic-purple" />
                      ) : goal.status === 'current' ? (
                        <div className="relative">
                          <Circle className="h-6 w-6 text-solar-orange animate-pulse" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-2 w-2 bg-solar-orange rounded-full" />
                          </div>
                        </div>
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground/50" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{goal.title}</span>
                        {goal.status === 'current' && (
                          <Badge className="bg-solar-orange text-white text-xs">
                            Próxima Meta
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {goal.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <span className={`text-sm font-medium ${
                        goal.status === 'completed' 
                          ? 'text-cosmic-purple' 
                          : goal.status === 'current'
                          ? 'text-solar-orange'
                          : 'text-muted-foreground'
                      }`}>
                        R$ {goal.value.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
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
