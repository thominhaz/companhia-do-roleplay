import { useState } from "react";
import { Loader2, Calendar } from "lucide-react";
import { 
  Plus, 
  Link, 
  Dices, 
  StickyNote,
  Wand2,
  Shield,
  Castle,
  Flame
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { useCharacters, CharacterDB } from "@/hooks/useCharacters";
import { useAllCampaigns, CampaignDB } from "@/hooks/useCampaigns";
import { useUpcomingSessions } from "@/hooks/useSessions";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppHeader } from "@/components/layout/AppHeader";
import { NotificationBell } from "@/components/notifications/NotificationBell";

import { toast } from "sonner";
import type { TabRoute } from "@/types";
import { UpgradeModal } from "@/components/menu/UpgradeModal";
import { SubscriptionSheet } from "@/components/menu/SubscriptionSheet";

interface HomeScreenProps {
  onNavigate?: (tab: TabRoute) => void;
}

const quickActions = [
  { id: "create", label: "Criar Ficha", icon: Plus, color: "primary" },
  { id: "join", label: "Entrar em Mesa", icon: Link, color: "secondary" },
  { id: "dice", label: "Rolar Dados", icon: Dices, color: "primary" },
  { id: "note", label: "Nota Rápida", icon: StickyNote, color: "secondary" },
];

// Map class to icon
const classIcons: Record<string, typeof Shield> = {
  Guerreiro: Shield,
  Mago: Wand2,
  Paladino: Shield,
  Ladino: Flame,
  Clerigo: Shield,
  Barbaro: Flame,
  Bardo: Wand2,
  Druida: Wand2,
  Feiticeiro: Wand2,
  Bruxo: Flame,
  Monge: Shield,
  Patrulheiro: Shield,
};

const classGradients: Record<string, string> = {
  Guerreiro: "primary",
  Mago: "secondary",
  Paladino: "primary",
  Ladino: "muted",
  Clerigo: "primary",
  Barbaro: "primary",
  Bardo: "secondary",
  Druida: "secondary",
  Feiticeiro: "secondary",
  Bruxo: "secondary",
  Monge: "primary",
  Patrulheiro: "primary",
};

interface RecentItem {
  id: string;
  name: string;
  description: string;
  icon: typeof Shield;
  gradient: string;
  time: string;
  type: 'character' | 'campaign';
}

function buildRecentItems(characters: CharacterDB[], campaigns: { master: CampaignDB[]; player: CampaignDB[] }): RecentItem[] {
  const items: RecentItem[] = [];

  // Add characters
  characters.forEach(char => {
    items.push({
      id: char.id,
      name: char.name,
      description: `${char.race} ${char.class} • Nv ${char.level}`,
      icon: classIcons[char.class] || Shield,
      gradient: classGradients[char.class] || "primary",
      time: `Atualizado ${formatDistanceToNow(new Date(char.updated_at), { locale: ptBR, addSuffix: false })}`,
      type: 'character',
    });
  });

  // Add master campaigns
  campaigns.master.forEach(campaign => {
    items.push({
      id: campaign.id,
      name: campaign.name,
      description: "Campanha • Mestre",
      icon: Castle,
      gradient: "primary",
      time: `Atualizado ${formatDistanceToNow(new Date(campaign.updated_at), { locale: ptBR, addSuffix: false })}`,
      type: 'campaign',
    });
  });

  // Add player campaigns
  campaigns.player.forEach(campaign => {
    items.push({
      id: campaign.id,
      name: campaign.name,
      description: "Campanha • Jogador",
      icon: Flame,
      gradient: "secondary",
      time: `Atualizado ${formatDistanceToNow(new Date(campaign.updated_at), { locale: ptBR, addSuffix: false })}`,
      type: 'campaign',
    });
  });

  // Sort by most recent (approximation - we use the time string)
  return items.slice(0, 6);
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const { data: characters, isLoading: loadingChars } = useCharacters();
  const { data: campaignsData, isLoading: loadingCampaigns } = useAllCampaigns();
  const { data: upcomingSessions, isLoading: loadingSessions } = useUpcomingSessions(1);
  const navigate = useNavigate();

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeRequiredTier, setUpgradeRequiredTier] = useState<SubscriptionTier>('aldeao');
  const [upgradeFeatureName, setUpgradeFeatureName] = useState("");
  const [upgradeFeatureDescription, setUpgradeFeatureDescription] = useState<string | undefined>();
  const [subscriptionSheetOpen, setSubscriptionSheetOpen] = useState(false);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Aventureiro";
  const currentTier = subscription?.tier || 'visitante';
  const isPaidTier = currentTier === 'heroi' || currentTier === 'mestre';
  const isVisitante = currentTier === 'visitante';

  const isLoading = loadingChars || loadingCampaigns;
  const nextSession = upcomingSessions?.[0];

  const showUpgradeModal = (requiredTier: SubscriptionTier, featureName: string, description?: string) => {
    setUpgradeRequiredTier(requiredTier);
    setUpgradeFeatureName(featureName);
    setUpgradeFeatureDescription(description);
    setUpgradeModalOpen(true);
  };

  // Get most recent character as active
  const activeCharacter = characters?.[0];
  
  // Build recent items
  const recentItems = buildRecentItems(
    characters || [], 
    campaignsData || { master: [], player: [] }
  );

  return (
    <div className="min-h-screen bg-surface-0 pb-20 md:pb-8">
      <AppHeader
        rightContent={
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!user && (
              <button 
                onClick={() => navigate("/auth")}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-muted hover:bg-muted/80 rounded-xl text-foreground transition-colors"
              >
                Entrar
              </button>
            )}
            <NotificationBell />
          </div>
        }
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm">Bem-vindo de volta</p>
            <h1 className="text-lg sm:text-xl font-bold mt-0.5">
              Olá, {displayName} {user ? "🖐️" : ""}
            </h1>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                currentTier === 'mestre'
                  ? "bg-gold/20 text-gold"
                  : currentTier === 'heroi'
                    ? "bg-secondary/20 text-secondary" 
                    : "bg-muted text-muted-foreground"
              }`}>
                {currentTier === 'mestre' ? "Mestre" : currentTier === 'heroi' ? "Herói" : "Aldeão"}
              </span>
              {currentTier === 'aldeao' && characters && (
                <span className="text-xs text-muted-foreground">
                  {characters.length}/3
                </span>
              )}
            </div>
          )}
        </div>
      </AppHeader>

      {/* Hero Grid */}
      <section className="px-3 sm:px-5 md:px-8 lg:px-12 mt-3 sm:mt-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
          {/* Active Character Card */}
          <div className="sm:col-span-2 md:col-span-3 bg-white/[0.08] backdrop-blur-[20px] backdrop-saturate-150 border border-white/[0.15] rounded-2xl p-3 sm:p-4 md:p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] min-h-[120px] sm:min-h-[180px]">
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-foreground opacity-5 rounded-full -mr-8 sm:-mr-10 -mt-8 sm:-mt-10 parallax-float" />
            <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-foreground opacity-5 rounded-full -ml-6 sm:-ml-8 -mb-6 sm:-mb-8 parallax-float-delayed" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-foreground/70" />
                </div>
              ) : activeCharacter ? (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-foreground/80">ATIVO</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold leading-tight">{activeCharacter.name}</h3>
                    <p className="text-[10px] sm:text-xs text-foreground/70 mt-0.5 sm:mt-1">
                      {activeCharacter.race} {activeCharacter.class} • Nv {activeCharacter.level}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-3">
                    <div className="flex-1 bg-surface-0/30 rounded-lg px-2 py-1 sm:py-1.5 shadow-inset">
                      <p className="text-[10px] sm:text-xs text-foreground/70">HP</p>
                      <p className="text-xs sm:text-sm font-bold">{activeCharacter.current_hp}/{activeCharacter.max_hp}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-3 sm:py-4">
                  <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-foreground/50 mb-1.5 sm:mb-2" />
                  <p className="text-xs sm:text-sm text-foreground/70">Nenhum personagem</p>
                  <button 
                    onClick={() => {
                      if (!user) {
                        toast.error("Faça login para criar um personagem", {
                          action: {
                            label: "Entrar",
                            onClick: () => navigate("/auth")
                          }
                        });
                        return;
                      }
                      navigate("/?tab=characters&create=true");
                    }}
                    className="mt-1.5 sm:mt-2 px-3 py-1 border border-primary/60 bg-transparent rounded-lg text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    Criar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Next Session Card */}
          <div className="sm:col-span-1 bg-white/[0.08] backdrop-blur-[20px] backdrop-saturate-150 border border-white/[0.15] rounded-2xl p-2.5 sm:p-3 md:p-4 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] min-h-[80px] sm:min-h-[180px]">
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-foreground opacity-5 rounded-full -mr-6 sm:-mr-8 -mt-6 sm:-mt-8 parallax-float-delayed" />
            <div className="relative z-10 h-full flex flex-col">
              {loadingSessions ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-foreground/70" />
                </div>
              ) : nextSession ? (
                <>
                  <div className="flex-1 flex flex-row sm:flex-col justify-center items-center text-center gap-2.5 sm:gap-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center sm:mb-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="flex flex-col sm:items-center">
                      <p className="text-[9px] sm:text-[10px] text-foreground/80 font-medium uppercase">Próxima</p>
                      <p className="text-base sm:text-lg font-bold mt-0.5">
                        {format(new Date(nextSession.scheduled_at), "dd/MM", { locale: ptBR })}
                      </p>
                      <p className="text-[10px] sm:text-xs text-foreground/70">
                        {format(new Date(nextSession.scheduled_at), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="pt-1.5 sm:pt-2 border-t border-foreground/20">
                    <p className="text-[9px] sm:text-[10px] font-medium leading-tight text-center text-foreground/70 truncate">
                      {nextSession.campaign_name}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 flex flex-row sm:flex-col justify-center items-center text-center gap-2.5 sm:gap-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-foreground/20 flex items-center justify-center sm:mb-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/50" />
                    </div>
                    <div className="flex flex-col sm:items-center">
                      <p className="text-[9px] sm:text-[10px] text-foreground/80 font-medium uppercase">Próxima</p>
                      <p className="text-base sm:text-lg font-bold mt-0.5">--</p>
                      <p className="text-[10px] sm:text-xs text-foreground/70">Sessão</p>
                    </div>
                  </div>
                  <div className="pt-1.5 sm:pt-2 border-t border-foreground/20">
                    <p className="text-[9px] sm:text-[10px] font-medium leading-tight text-center text-foreground/70">
                      Sem sessões
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-3 sm:px-5 md:px-8 lg:px-12 mt-4 sm:mt-8 max-w-6xl mx-auto">
        <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2.5 sm:mb-4">AÇÕES RÁPIDAS</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5 sm:gap-4 stagger-fast">
          {quickActions.map((action) => (
            <button 
              key={action.id} 
              className="flex flex-col items-center gap-1 sm:gap-2"
              onClick={() => {
                switch (action.id) {
                  case 'create':
                    if (!user) {
                      toast.error("Faça login para criar um personagem", {
                        action: {
                          label: "Entrar",
                          onClick: () => navigate("/auth")
                        }
                      });
                      return;
                    }
                    if (isVisitante) {
                      showUpgradeModal('aldeao', 'Criar Personagens', 'Crie e gerencie fichas de personagem completas');
                      return;
                    }
                    navigate('/?tab=characters&create=true');
                    break;
                  case 'join':
                    if (!user) {
                      toast.error("Faça login para entrar em uma campanha", {
                        action: {
                          label: "Entrar",
                          onClick: () => navigate("/auth")
                        }
                      });
                      return;
                    }
                    if (isVisitante) {
                      showUpgradeModal('aldeao', 'Entrar em Campanhas', 'Participe de campanhas com outros jogadores');
                      return;
                    }
                    navigate('/?tab=campaigns&join=true');
                    break;
                  case 'dice':
                    navigate('/?tab=tools&tool=dice');
                    break;
                  case 'note':
                    if (!user) {
                      toast.error("Faça login para acessar suas notas", {
                        action: {
                          label: "Entrar",
                          onClick: () => navigate("/auth")
                        }
                      });
                      return;
                    }
                    if (isVisitante) {
                      showUpgradeModal('aldeao', 'Notas Rápidas', 'Anote ideias, lembretes e informações importantes');
                      return;
                    }
                    navigate('/?tab=tools&tool=notes');
                    break;
                }
              }}
            >
              <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border ${action.color === 'primary' ? 'border-primary/30 bg-primary/[0.08]' : 'border-secondary/30 bg-secondary/[0.08]'} backdrop-blur-[12px] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:-translate-y-1`}>
                <action.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${action.color === 'primary' ? 'text-primary' : 'text-secondary'}`} />
              </div>
              <span className="text-[9px] sm:text-xs text-muted-foreground text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Recents */}
      <section className="mt-4 sm:mt-8 mb-4 sm:mb-6 max-w-6xl mx-auto">
        <div className="px-3 sm:px-5 md:px-8 lg:px-12 flex items-center justify-between mb-2.5 sm:mb-4">
          <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground">RECENTES</h2>
          <button 
            onClick={() => onNavigate?.("characters")}
            className="text-[10px] sm:text-xs text-primary font-medium hover:underline"
          >
            Ver Todos
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary" />
          </div>
        ) : recentItems.length === 0 ? (
          <div className="px-3 sm:px-5 py-6 sm:py-8 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">Nenhum item recente</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide md:overflow-visible">
            <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 px-3 sm:px-5 md:px-8 lg:px-12 pb-2 stagger-fast">
              {recentItems.map((item) => (
                <div 
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    if (item.type === 'character') {
                      navigate(`/character/${item.id}`);
                    } else if (item.type === 'campaign') {
                      onNavigate?.("campaigns");
                    }
                  }}
                  className="flex-shrink-0 w-32 sm:w-40 md:w-full bg-white/[0.08] backdrop-blur-[20px] backdrop-saturate-150 border border-white/[0.15] rounded-xl p-2 sm:p-3 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:border-white/[0.25] cursor-pointer"
                >
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg border ${item.gradient === 'primary' ? 'border-primary/40 bg-primary/10' : item.gradient === 'secondary' ? 'border-secondary/40 bg-secondary/10' : 'border-muted bg-muted/30'} flex items-center justify-center mb-1.5 sm:mb-3`}>
                    <item.icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${item.gradient === 'primary' ? 'text-primary' : item.gradient === 'secondary' ? 'text-secondary' : 'text-muted-foreground'}`} />
                  </div>
                  <h3 className="font-semibold text-[11px] sm:text-sm mb-0.5 sm:mb-1 truncate">{item.name}</h3>
                  <p className="text-[9px] sm:text-xs text-muted-foreground truncate">{item.description}</p>
                  <div className="mt-1.5 sm:mt-3 pt-1.5 sm:pt-3 border-t border-border/30">
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground/70 truncate">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>


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
