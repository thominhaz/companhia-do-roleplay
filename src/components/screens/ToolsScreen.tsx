import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Dice6, 
  BookOpen, 
  Sparkles, 
  Shield, 
  Swords, 
  Heart,
  Search,
  ChevronRight,
  Zap,
  Gem,
  Sword,
  StickyNote,
  Lock,
  Crown,
  Skull
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiceRoller } from "@/components/tools/DiceRoller";
import { MagicItemsCompendium } from "@/components/tools/MagicItemsCompendium";
import { MonstersCompendium } from "@/components/tools/MonstersCompendium";
import { ConditionsReference } from "@/components/tools/ConditionsReference";
import { WeaponsArmorList } from "@/components/tools/WeaponsArmorList";
import { BasicRules } from "@/components/tools/BasicRules";
import { HealingRest } from "@/components/tools/HealingRest";
import { HomebrewForge } from "@/components/homebrew/HomebrewForge";
import { QuickNotes } from "@/components/tools/QuickNotes";
import { SupporterGallery } from "@/components/supporters/SupporterGallery";
import { AppHeader } from "@/components/layout/AppHeader";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/menu/UpgradeModal";
import { SubscriptionSheet } from "@/components/menu/SubscriptionSheet";

type ActiveTool = "dice" | "magic-items" | "monsters" | "conditions" | "weapons-armor" | "rules" | "healing" | "homebrew" | "notes" | "supporter-gallery" | null;

const tools = [
  {
    id: "dice-roller",
    name: "Rolador de Dados",
    description: "Role d4, d6, d8, d10, d12 e d20",
    icon: Dice6,
    color: "from-primary to-primary/70",
    featured: true,
    toolKey: "dice" as ActiveTool,
    requiresAccess: false,
  },
  {
    id: "spells",
    name: "Magias",
    description: "Compêndio completo de magias SRD",
    icon: Sparkles,
    color: "from-secondary to-secondary/70",
    featured: true,
    path: "/grimoire",
    requiresAccess: false,
  },
  {
    id: "magic-items",
    name: "Itens Mágicos",
    description: "Compêndio de itens mágicos",
    icon: Gem,
    color: "from-purple-500 to-purple-500/70",
    featured: true,
    toolKey: "magic-items" as ActiveTool,
    requiresAccess: false,
  },
  {
    id: "monsters",
    name: "Bestiário",
    description: "Compêndio de monstros SRD",
    icon: Skull,
    color: "from-red-600 to-red-600/70",
    featured: true,
    toolKey: "monsters" as ActiveTool,
    requiresAccess: false,
  },
  {
    id: "conditions",
    name: "Condições",
    description: "Referência rápida de condições",
    icon: Zap,
    color: "from-neon-blue to-neon-blue/70",
    featured: false,
    toolKey: "conditions" as ActiveTool,
    requiresAccess: false,
  },
  {
    id: "weapons-armor",
    name: "Armas & Armaduras",
    description: "Lista de armas e armaduras",
    icon: Swords,
    color: "from-gold to-gold/70",
    featured: false,
    toolKey: "weapons-armor" as ActiveTool,
    requiresAccess: false,
  },
  {
    id: "rules",
    name: "Regras Básicas",
    description: "Mecânicas fundamentais do D&D 5e",
    icon: BookOpen,
    color: "from-orange-500 to-orange-500/70",
    featured: false,
    toolKey: "rules" as ActiveTool,
    requiresAccess: false,
  },
  {
    id: "healing",
    name: "Cura & Descanso",
    description: "Regras de recuperação de HP",
    icon: Heart,
    color: "from-red-500 to-red-500/70",
    featured: false,
    toolKey: "healing" as ActiveTool,
    requiresAccess: false,
  },
  {
    id: "homebrew",
    name: "A Forja",
    description: "Crie magias e itens homebrew",
    icon: Sword,
    color: "from-primary to-primary/70",
    featured: true,
    toolKey: "homebrew" as ActiveTool,
    requiresAccess: true,
  },
  {
    id: "notes",
    name: "Notas Rápidas",
    description: "Anotações pessoais com Markdown",
    icon: StickyNote,
    color: "from-amber-500 to-amber-500/70",
    featured: true,
    toolKey: "notes" as ActiveTool,
    requiresAccess: true,
  },
  {
    id: "supporter-gallery",
    name: "Galeria de Apoiadores",
    description: "NPCs e itens criados pela comunidade",
    icon: Crown,
    color: "from-amber-400 to-purple-500",
    featured: true,
    toolKey: "supporter-gallery" as ActiveTool,
    requiresAccess: false,
  },
];

export function ToolsScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: subscription } = useSubscription();
  const { user } = useAuth();
  
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeRequiredTier, setUpgradeRequiredTier] = useState<SubscriptionTier>('aldeao');
  const [upgradeFeatureName, setUpgradeFeatureName] = useState("");
  const [upgradeFeatureDescription, setUpgradeFeatureDescription] = useState<string | undefined>();
  const [subscriptionSheetOpen, setSubscriptionSheetOpen] = useState(false);
  
  const isVisitante = subscription?.tier === 'visitante';
  const canUseForge = subscription?.canUseForge ?? false;

  const showUpgradeModal = (requiredTier: SubscriptionTier, featureName: string, description?: string) => {
    setUpgradeRequiredTier(requiredTier);
    setUpgradeFeatureName(featureName);
    setUpgradeFeatureDescription(description);
    setUpgradeModalOpen(true);
  };

  // Handle URL params for opening specific tool
  useEffect(() => {
    const toolParam = searchParams.get('tool');
    if (toolParam === 'notes') {
      if (isVisitante) {
        showUpgradeModal('aldeao', 'Notas Rápidas', 'Anote ideias, lembretes e informações importantes');
      } else {
        setActiveTool('notes');
      }
      setSearchParams({}, { replace: true });
    } else if (toolParam === 'dice') {
      setActiveTool('dice');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, isVisitante]);
  
  const filteredTools = tools.filter((t) => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const featuredTools = filteredTools.filter((t) => t.featured);
  const otherTools = filteredTools.filter((t) => !t.featured);

  const handleToolClick = (tool: typeof tools[0]) => {
    // Check if tool requires access and user is visitante
    if (tool.requiresAccess && isVisitante) {
      showUpgradeModal('aldeao', tool.name, tool.description);
      return;
    }
    
    // Check if it's the Forge and user doesn't have access (Aldeão)
    if (tool.id === 'homebrew' && !canUseForge) {
      showUpgradeModal('heroi', 'A Forja', 'Crie magias, itens e conteúdo homebrew personalizado');
      return;
    }
    
    if (tool.path) {
      navigate(tool.path);
    } else if (tool.toolKey) {
      setActiveTool(tool.toolKey);
    }
  };

  // Render active tool
  if (activeTool === "dice") {
    return <DiceRoller onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === "magic-items") {
    return <MagicItemsCompendium onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === "monsters") {
    return (
       <div className="min-h-screen bg-surface-0 pb-24 md:pb-8">
        <AppHeader
          title="Bestiário"
          subtitle="Compêndio de monstros SRD"
          rightContent={
            <button
              onClick={() => setActiveTool(null)}
              className="px-3 py-1.5 text-sm font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              Voltar
            </button>
          }
        />
        <main className="h-[calc(100vh-120px)]">
          <MonstersCompendium />
        </main>
      </div>
    );
  }
  if (activeTool === "conditions") {
    return <ConditionsReference onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === "weapons-armor") {
    return <WeaponsArmorList onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === "rules") {
    return <BasicRules onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === "healing") {
    return <HealingRest onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === "homebrew") {
    return <HomebrewForge onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === "notes") {
    return <QuickNotes onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === "supporter-gallery") {
    return (
      <div className="min-h-screen bg-surface-0 pb-24 md:pb-8">
        <AppHeader
          title="Galeria de Apoiadores"
          subtitle="Conteúdo da comunidade"
          rightContent={
            <button
              onClick={() => setActiveTool(null)}
              className="px-3 py-1.5 text-sm font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              Voltar
            </button>
          }
        />
        <main className="px-4 py-4 max-w-4xl mx-auto">
          <SupporterGallery />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0 pb-24 md:pb-8">
      <AppHeader
        title="Ferramentas"
        subtitle="Compêndio e utilitários"
        rightContent={
          !user ? (
            <button 
              onClick={() => navigate("/auth")}
              className="px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-xl text-foreground transition-colors"
            >
              Entrar
            </button>
          ) : undefined
        }
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar magias, condições, regras..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-surface-1 border border-border/30 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-inset"
          />
        </div>
      </AppHeader>

      {/* Content */}
      <main className="px-3 sm:px-4 md:px-8 lg:px-12 py-3 sm:py-4 max-w-6xl mx-auto space-y-5 sm:space-y-6">
        {/* Featured Tools */}
        <section>
          <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 sm:mb-3">
            Destaques
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 stagger-fast">
            {featuredTools.map((tool, index) => {
              const Icon = tool.icon;
              const isLockedVisitante = tool.requiresAccess && isVisitante;
              const isLockedForge = tool.id === 'homebrew' && !canUseForge;
              const isLocked = isLockedVisitante || isLockedForge;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br text-left relative overflow-hidden shadow-depth-md",
                    tool.color,
                    isLocked && "opacity-60",
                    "hover:scale-[1.02] hover:shadow-depth-lg active:scale-[0.98] transition-all duration-200"
                  )}
                >
                  {isLocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-4 h-4 text-foreground/80" />
                    </div>
                  )}
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-foreground mb-2 sm:mb-3" />
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                    {tool.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-foreground/70 mt-0.5 line-clamp-2">
                    {isLockedVisitante ? "Requer código de acesso" : isLockedForge ? "Requer plano Herói" : tool.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* All Tools */}
        <section>
          <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 sm:mb-3">
            Compêndio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2 stagger-container">
            {otherTools.map((tool, index) => {
              const Icon = tool.icon;
              const isLockedVisitante = tool.requiresAccess && isVisitante;
              const isLockedForge = tool.id === 'homebrew' && !canUseForge;
              const isLocked = isLockedVisitante || isLockedForge;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  className={cn(
                    "w-full bg-surface-1 border border-border/30 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 shadow-depth-sm transition-all hover:shadow-depth-md hover:-translate-y-0.5",
                    "text-left",
                    isLocked && "opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                      tool.color
                    )}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                      {tool.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {isLockedVisitante ? "Requer código de acesso" : isLockedForge ? "Requer plano Herói" : tool.description}
                    </p>
                  </div>
                  {isLocked ? (
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 transition-transform group-hover:translate-x-1" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        requiredTier={upgradeRequiredTier}
        featureName={upgradeFeatureName}
        featureDescription={upgradeFeatureDescription}
        onOpenSubscription={() => setSubscriptionSheetOpen(true)}
      />

      <SubscriptionSheet
        open={subscriptionSheetOpen}
        onOpenChange={setSubscriptionSheetOpen}
      />
    </div>
  );
}
