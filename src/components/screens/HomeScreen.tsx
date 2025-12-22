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
import { useSubscription } from "@/hooks/useSubscription";
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

interface HomeScreenProps {
  onNavigate?: (tab: TabRoute) => void;
}

const quickActions = [
  { id: "create", label: "Criar Ficha", icon: Plus, gradient: "from-solar-orange to-solar-orange/70" },
  { id: "join", label: "Entrar em Mesa", icon: Link, gradient: "from-cyan-blue to-cyan-blue/70" },
  { id: "dice", label: "Rolar Dados", icon: Dices, gradient: "from-cosmic-purple to-cosmic-purple/70" },
  { id: "note", label: "Nota Rápida", icon: StickyNote, gradient: "from-magenta-red to-magenta-red/70" },
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
  Guerreiro: "from-magenta-red to-magenta-red/70",
  Mago: "from-cyan-blue to-cyan-blue/70",
  Paladino: "from-solar-orange to-solar-orange/70",
  Ladino: "from-muted to-muted/70",
  Clerigo: "from-foreground to-foreground/70",
  Barbaro: "from-solar-orange to-magenta-red",
  Bardo: "from-cosmic-purple to-cosmic-purple/70",
  Druida: "from-cyan-blue to-cosmic-purple",
  Feiticeiro: "from-magenta-red to-cosmic-purple",
  Bruxo: "from-cosmic-purple to-magenta-red",
  Monge: "from-cyan-blue to-cyan-blue/70",
  Patrulheiro: "from-cyan-blue to-solar-orange",
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
      gradient: classGradients[char.class] || "from-purple-600 to-purple-800",
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
      gradient: "from-emerald-600 to-emerald-800",
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
      gradient: "from-red-600 to-red-800",
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

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Aventureiro";
  const isPremium = subscription?.status === "premium";

  const isLoading = loadingChars || loadingCampaigns;
  const nextSession = upcomingSessions?.[0];

  // Get most recent character as active
  const activeCharacter = characters?.[0];
  
  // Build recent items
  const recentItems = buildRecentItems(
    characters || [], 
    campaignsData || { master: [], player: [] }
  );

  return (
    <div className="min-h-screen bg-darker pb-24">
      <AppHeader
        rightContent={
          <div className="flex items-center gap-2">
            {!user && (
              <button 
                onClick={() => navigate("/auth")}
                className="px-4 py-2 text-sm font-medium bg-gradient-primary rounded-xl text-foreground"
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
            <p className="text-muted-foreground text-sm">Bem-vindo de volta</p>
            <h1 className="text-xl font-bold mt-0.5">
              Olá, {displayName} {user ? "🖐️" : ""}
            </h1>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                isPremium 
                  ? "bg-solar-orange/20 text-solar-orange" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {isPremium ? "Premium" : "Free"}
              </span>
              {!isPremium && characters && (
                <span className="text-xs text-muted-foreground">
                  {characters.length}/3
                </span>
              )}
            </div>
          )}
        </div>
      </AppHeader>

      {/* Hero Grid */}
      <section className="px-5 mt-6">
        <div className="grid grid-cols-3 gap-3 h-48">
          {/* Active Character Card */}
          <div className="col-span-2 bg-gradient-to-br from-cosmic-purple to-cosmic-purple/70 rounded-2xl p-4 relative overflow-hidden parallax-scale">
            <div className="absolute top-0 right-0 w-32 h-32 bg-foreground opacity-5 rounded-full -mr-10 -mt-10 parallax-float" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-foreground opacity-5 rounded-full -ml-8 -mb-8 parallax-float-delayed" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-foreground/70" />
                </div>
              ) : activeCharacter ? (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-solar-orange/30 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-solar-orange" />
                      </div>
                      <span className="text-xs font-medium text-foreground/80">ATIVO</span>
                    </div>
                    <h3 className="text-lg font-bold leading-tight">{activeCharacter.name}</h3>
                    <p className="text-xs text-foreground/70 mt-1">
                      {activeCharacter.race} {activeCharacter.class} • Nv {activeCharacter.level}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-background/20 rounded-lg px-2 py-1.5">
                      <p className="text-xs text-foreground/70">HP</p>
                      <p className="text-sm font-bold">{activeCharacter.current_hp}/{activeCharacter.max_hp}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Shield className="w-8 h-8 text-foreground/50 mb-2" />
                  <p className="text-sm text-foreground/70">Nenhum personagem</p>
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
                      navigate("/characters?create=true");
                    }}
                    className="mt-2 px-3 py-1 bg-solar-orange rounded-lg text-xs font-medium text-background"
                  >
                    Criar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Next Session Card */}
          <div className="col-span-1 bg-gradient-to-br from-magenta-red to-magenta-red/70 rounded-2xl p-3 relative overflow-hidden parallax-scale">
            <div className="absolute top-0 right-0 w-20 h-20 bg-foreground opacity-5 rounded-full -mr-8 -mt-8 parallax-float-delayed" />
            <div className="relative z-10 h-full flex flex-col">
              {loadingSessions ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-foreground/70" />
                </div>
              ) : nextSession ? (
                <>
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-solar-orange/30 flex items-center justify-center mb-2">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] text-foreground/80 font-medium uppercase">Próxima</p>
                    <p className="text-lg font-bold mt-0.5">
                      {format(new Date(nextSession.scheduled_at), "dd/MM", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-foreground/70">
                      {format(new Date(nextSession.scheduled_at), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-foreground/20">
                    <p className="text-[10px] font-medium leading-tight text-center text-foreground/70 truncate">
                      {nextSession.campaign_name}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-foreground/20 flex items-center justify-center mb-2">
                      <Calendar className="w-5 h-5 text-foreground/50" />
                    </div>
                    <p className="text-[10px] text-foreground/80 font-medium uppercase">Próxima</p>
                    <p className="text-lg font-bold mt-0.5">--</p>
                    <p className="text-xs text-foreground/70">Sessão</p>
                  </div>
                  <div className="pt-2 border-t border-foreground/20">
                    <p className="text-[10px] font-medium leading-tight text-center text-foreground/70">
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
      <section className="px-5 mt-8">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4">AÇÕES RÁPIDAS</h2>
        <div className="grid grid-cols-4 gap-4 stagger-fast">
          {quickActions.map((action) => (
            <button 
              key={action.id} 
              className="flex flex-col items-center gap-2"
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
                    navigate('/characters?create=true');
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
                    navigate('/campaigns?join=true');
                    break;
                  case 'dice':
                    navigate('/tools?tool=dice');
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
                    navigate('/campaigns');
                    break;
                }
              }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-muted-foreground text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Recents */}
      <section className="mt-8 mb-6">
        <div className="px-5 flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground">RECENTES</h2>
          <button 
            onClick={() => onNavigate?.("characters")}
            className="text-xs text-primary font-medium hover:underline"
          >
            Ver Todos
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : recentItems.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum item recente</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-5 pb-2 stagger-fast">
              {recentItems.map((item) => (
                <div 
                  key={`${item.type}-${item.id}`}
                  className="flex-shrink-0 w-40 bg-dark rounded-xl p-3 border border-border card-interactive"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-3`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1 truncate">{item.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground/70 truncate">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
