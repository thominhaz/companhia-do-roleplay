import { Crown, Sparkles, Users, Wand2, Shield, Sword, ScrollText, Palette, History, Swords, Share2, Eye, Check, X, ChevronDown, ChevronUp, Dice6, StickyNote, FileText, BookOpen, Hammer } from "lucide-react";
import { useState } from "react";
import { SubscriptionTier } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

interface PlanComparisonSectionProps {
  currentTier: SubscriptionTier;
}

interface FeatureRow {
  name: string;
  icon: typeof Crown;
  category: string;
  visitante: boolean | string;
  aldeao: boolean | string;
  heroi: boolean | string;
  mestre: boolean | string;
}

const FEATURES: FeatureRow[] = [
  // Personagens
  { name: "Criação de personagens", icon: Users, category: "Personagens", visitante: false, aldeao: "Até 3", heroi: "Até 20", mestre: "Ilimitados" },
  { name: "Ficha completa interativa", icon: ScrollText, category: "Personagens", visitante: false, aldeao: true, heroi: true, mestre: true },
  { name: "Histórico de alterações", icon: History, category: "Personagens", visitante: false, aldeao: false, heroi: true, mestre: true },
  { name: "Exportar PDF", icon: FileText, category: "Personagens", visitante: false, aldeao: true, heroi: true, mestre: true },
  
  // Campanhas
  { name: "Participar de campanhas", icon: Users, category: "Campanhas", visitante: false, aldeao: true, heroi: true, mestre: true },
  { name: "Criar campanhas como Mestre", icon: Crown, category: "Campanhas", visitante: false, aldeao: false, heroi: false, mestre: true },
  { name: "Combat Tracker Pro", icon: Swords, category: "Campanhas", visitante: false, aldeao: false, heroi: false, mestre: true },
  { name: "Integração Discord", icon: Share2, category: "Campanhas", visitante: false, aldeao: false, heroi: false, mestre: true },
  
  // Ferramentas
  { name: "Compêndio SRD 5.1", icon: BookOpen, category: "Ferramentas", visitante: true, aldeao: true, heroi: true, mestre: true },
  { name: "Rolador de dados", icon: Dice6, category: "Ferramentas", visitante: true, aldeao: true, heroi: true, mestre: true },
  { name: "Condições e regras", icon: ScrollText, category: "Ferramentas", visitante: true, aldeao: true, heroi: true, mestre: true },
  { name: "Notas rápidas", icon: StickyNote, category: "Ferramentas", visitante: false, aldeao: true, heroi: true, mestre: true },
  { name: "A Forja (Homebrew)", icon: Hammer, category: "Ferramentas", visitante: false, aldeao: false, heroi: true, mestre: true },
  
  // Personalização
  { name: "Temas exclusivos", icon: Palette, category: "Personalização", visitante: false, aldeao: false, heroi: true, mestre: true },
];

const TIER_ICONS: Record<SubscriptionTier, typeof Crown> = {
  visitante: Eye,
  aldeao: Shield,
  heroi: Sword,
  mestre: Crown,
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  visitante: "text-muted-foreground",
  aldeao: "text-primary",
  heroi: "text-secondary",
  mestre: "text-gold",
};

const TIER_NAMES: Record<SubscriptionTier, string> = {
  visitante: "Visitante",
  aldeao: "Aldeão",
  heroi: "Herói",
  mestre: "Mestre",
};

export function PlanComparisonSection({ currentTier }: PlanComparisonSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const categories = [...new Set(FEATURES.map(f => f.category))];
  
  const renderValue = (value: boolean | string, tier: SubscriptionTier) => {
    if (typeof value === 'string') {
      return <span className={cn("text-xs font-medium", tier === currentTier && TIER_COLORS[tier])}>{value}</span>;
    }
    return value ? (
      <Check className={cn("w-4 h-4", tier === currentTier ? TIER_COLORS[tier] : "text-green-500")} />
    ) : (
      <X className="w-4 h-4 text-muted-foreground/40" />
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-secondary" />
          <h4 className="font-semibold text-foreground">Comparar Planos</h4>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Tier headers */}
          <div className="grid grid-cols-5 gap-1 p-2 bg-muted/30 sticky top-0">
            <div className="text-xs font-medium text-muted-foreground p-2">Recurso</div>
            {(['visitante', 'aldeao', 'heroi', 'mestre'] as SubscriptionTier[]).map((tier) => {
              const Icon = TIER_ICONS[tier];
              const isCurrentTier = tier === currentTier;
              return (
                <div
                  key={tier}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg text-center",
                    isCurrentTier && "bg-muted"
                  )}
                >
                  <Icon className={cn("w-4 h-4 mb-0.5", TIER_COLORS[tier])} />
                  <span className={cn(
                    "text-[10px] font-semibold",
                    isCurrentTier ? TIER_COLORS[tier] : "text-muted-foreground"
                  )}>
                    {TIER_NAMES[tier]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Feature rows by category */}
          <div className="max-h-[40vh] overflow-y-auto">
            {categories.map((category) => (
              <div key={category}>
                {/* Category header */}
                <div className="px-4 py-2 bg-muted/50">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {category}
                  </span>
                </div>
                
                {/* Features in category */}
                {FEATURES.filter(f => f.category === category).map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.name}
                      className={cn(
                        "grid grid-cols-5 gap-1 px-2 py-2.5",
                        idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                      )}
                    >
                      {/* Feature name */}
                      <div className="flex items-center gap-1.5 px-2">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-foreground truncate">{feature.name}</span>
                      </div>
                      
                      {/* Tier values */}
                      {(['visitante', 'aldeao', 'heroi', 'mestre'] as SubscriptionTier[]).map((tier) => (
                        <div
                          key={tier}
                          className={cn(
                            "flex items-center justify-center rounded-md py-1",
                            tier === currentTier && "bg-muted/50"
                          )}
                        >
                          {renderValue(feature[tier], tier)}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="p-3 border-t border-border bg-muted/30">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span>Incluído</span>
              </div>
              <div className="flex items-center gap-1">
                <X className="w-3.5 h-3.5 text-muted-foreground/40" />
                <span>Não incluído</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
