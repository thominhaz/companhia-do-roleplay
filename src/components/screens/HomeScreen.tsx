import { Loader2, Calendar, Sparkles, Sword, Users, BookOpen, Hexagon } from "lucide-react";
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

// D20 Icon component
const D20Icon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="8.5" x2="22" y2="8.5" />
    <line x1="2" y1="15.5" x2="12" y2="22" />
    <line x1="22" y1="15.5" x2="12" y2="22" />
    <line x1="2" y1="8.5" x2="12" y2="2" />
    <line x1="22" y1="8.5" x2="12" y2="2" />
  </svg>
);

const quickActions = [
  { id: "create", label: "Criar Ficha", icon: Sword, gradient: "from-arcane-purple via-arcane-cyan to-arcane-teal" },
  { id: "join", label: "Entrar em Mesa", icon: Users, gradient: "from-blue-600 via-blue-500 to-cyan-500" },
  { id: "dice", label: "Rolar Dados", icon: D20Icon, gradient: "from-emerald-600 via-emerald-500 to-teal-500" },
  { id: "compendium", label: "Compêndio", icon: BookOpen, gradient: "from-amber-600 via-amber-500 to-yellow-500" },
];

// Map class to gradient and icon style
const classStyles: Record<string, { gradient: string; accent: string }> = {
  Guerreiro: { gradient: "from-red-700 via-red-600 to-orange-600", accent: "text-red-400" },
  Mago: { gradient: "from-blue-700 via-blue-600 to-cyan-600", accent: "text-blue-400" },
  Paladino: { gradient: "from-amber-600 via-yellow-500 to-amber-400", accent: "text-amber-400" },
  Ladino: { gradient: "from-slate-700 via-slate-600 to-gray-500", accent: "text-slate-400" },
  Clerigo: { gradient: "from-zinc-300 via-zinc-200 to-white", accent: "text-zinc-300" },
  Barbaro: { gradient: "from-orange-700 via-orange-600 to-red-600", accent: "text-orange-400" },
  Bardo: { gradient: "from-purple-700 via-purple-600 to-pink-600", accent: "text-purple-400" },
  Druida: { gradient: "from-green-700 via-green-600 to-emerald-600", accent: "text-green-400" },
  Feiticeiro: { gradient: "from-pink-700 via-pink-600 to-rose-600", accent: "text-pink-400" },
  Bruxo: { gradient: "from-violet-700 via-violet-600 to-purple-600", accent: "text-violet-400" },
  Monge: { gradient: "from-cyan-700 via-cyan-600 to-teal-600", accent: "text-cyan-400" },
  Patrulheiro: { gradient: "from-emerald-700 via-emerald-600 to-green-600", accent: "text-emerald-400" },
};

interface RecentItem {
  id: string;
  name: string;
  description: string;
  gradient: string;
  time: string;
  type: 'character' | 'campaign';
  level?: number;
}

function buildRecentItems(characters: CharacterDB[], campaigns: { master: CampaignDB[]; player: CampaignDB[] }): RecentItem[] {
  const items: RecentItem[] = [];

  characters.forEach(char => {
    const style = classStyles[char.class] || classStyles.Guerreiro;
    items.push({
      id: char.id,
      name: char.name,
      description: `${char.race} ${char.class}`,
      gradient: style.gradient,
      time: formatDistanceToNow(new Date(char.updated_at), { locale: ptBR, addSuffix: false }),
      type: 'character',
      level: char.level,
    });
  });

  campaigns.master.forEach(campaign => {
    items.push({
      id: campaign.id,
      name: campaign.name,
      description: "Mestre",
      gradient: "from-arcane-gold via-amber-500 to-yellow-600",
      time: formatDistanceToNow(new Date(campaign.updated_at), { locale: ptBR, addSuffix: false }),
      type: 'campaign',
    });
  });

  campaigns.player.forEach(campaign => {
    items.push({
      id: campaign.id,
      name: campaign.name,
      description: "Jogador",
      gradient: "from-arcane-cyan via-teal-500 to-cyan-600",
      time: formatDistanceToNow(new Date(campaign.updated_at), { locale: ptBR, addSuffix: false }),
      type: 'campaign',
    });
  });

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
  const activeCharacter = characters?.[0];
  
  const recentItems = buildRecentItems(
    characters || [], 
    campaignsData || { master: [], player: [] }
  );

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'create':
        if (!user) {
          toast.error("Faça login para criar um personagem", {
            action: { label: "Entrar", onClick: () => navigate("/auth") }
          });
          return;
        }
        navigate('/characters?create=true');
        break;
      case 'join':
        if (!user) {
          toast.error("Faça login para entrar em uma campanha", {
            action: { label: "Entrar", onClick: () => navigate("/auth") }
          });
          return;
        }
        navigate('/campaigns?join=true');
        break;
      case 'dice':
        navigate('/tools?tool=dice');
        break;
      case 'compendium':
        navigate('/tools?tool=spells');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-darker pb-24 hex-pattern">
      {/* Vignette overlay */}
      <div className="fixed inset-0 vignette pointer-events-none z-0" />
      
      <AppHeader
        rightContent={
          <div className="flex items-center gap-2">
            {!user && (
              <button 
                onClick={() => navigate("/auth")}
                className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-arcane-cyan to-arcane-teal rounded-xl text-primary-foreground shadow-arcane hover:scale-105 transition-transform"
              >
                Entrar
              </button>
            )}
            <NotificationBell />
          </div>
        }
      >
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-muted-foreground text-sm">Bem-vindo de volta</p>
            <h1 className="text-xl font-display font-bold mt-0.5 tracking-wide">
              Olá, <span className="text-arcane-cyan">{displayName}</span>
            </h1>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${
                isPremium 
                  ? "bg-arcane-gold/10 text-arcane-gold border-arcane-gold/30" 
                  : "bg-muted/50 text-muted-foreground border-border"
              }`}>
                {isPremium ? (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Premium
                  </span>
                ) : "Free"}
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
      <section className="px-5 mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-3 h-52">
          {/* Active Character Card */}
          <div className="col-span-2 glass-card rounded-2xl p-4 relative overflow-hidden noise-overlay">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-radial from-arcane-cyan/10 to-transparent -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-radial from-arcane-purple/10 to-transparent -ml-8 -mb-8" />
            
            {/* Corner runes */}
            <div className="absolute top-3 right-3 w-4 h-4 border border-arcane-cyan/30 rotate-45 animate-rune-pulse" />
            <div className="absolute bottom-3 left-3 w-3 h-3 border border-arcane-gold/20 rotate-45" />
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-arcane-cyan" />
                </div>
              ) : activeCharacter ? (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${classStyles[activeCharacter.class]?.gradient || 'from-arcane-cyan to-arcane-teal'} flex items-center justify-center shadow-lg`}>
                        <Hexagon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-arcane-cyan uppercase tracking-widest">Ativo</span>
                        <p className="text-xs text-muted-foreground">Nível {activeCharacter.level}</p>
                      </div>
                    </div>
                    <h3 className="text-lg font-display font-bold leading-tight tracking-wide">{activeCharacter.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeCharacter.race} • {activeCharacter.class}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 glass rounded-lg px-3 py-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">HP</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-arcane-cyan">{activeCharacter.current_hp}</span>
                        <span className="text-xs text-muted-foreground">/{activeCharacter.max_hp}</span>
                      </div>
                      <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-gradient-to-r from-arcane-cyan to-arcane-teal rounded-full transition-all"
                          style={{ width: `${(activeCharacter.current_hp / activeCharacter.max_hp) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="glass rounded-lg px-3 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CA</p>
                      <span className="text-lg font-bold text-arcane-gold">{activeCharacter.armor_class}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-3 border border-arcane-cyan/20">
                    <Sword className="w-7 h-7 text-arcane-cyan animate-pulse-glow" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">A taverna está vazia...</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Crie seu primeiro herói</p>
                  <button 
                    onClick={() => {
                      if (!user) {
                        toast.error("Faça login para criar um personagem", {
                          action: { label: "Entrar", onClick: () => navigate("/auth") }
                        });
                        return;
                      }
                      navigate("/characters?create=true");
                    }}
                    className="mt-3 px-4 py-2 bg-gradient-to-r from-arcane-cyan to-arcane-teal rounded-lg text-xs font-semibold text-primary-foreground shadow-arcane hover:scale-105 transition-transform"
                  >
                    Criar Personagem
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Next Session Card */}
          <div className="col-span-1 glass-card rounded-2xl p-3 relative overflow-hidden noise-overlay">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-radial from-arcane-gold/10 to-transparent -mr-8 -mt-8" />
            
            <div className="relative z-10 h-full flex flex-col">
              {loadingSessions ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-arcane-gold" />
                </div>
              ) : nextSession ? (
                <>
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-arcane-gold/20 to-amber-600/10 flex items-center justify-center mb-2 border border-arcane-gold/20">
                      <Calendar className="w-5 h-5 text-arcane-gold" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Próxima</p>
                    <p className="text-2xl font-display font-bold mt-1 text-arcane-gold">
                      {format(new Date(nextSession.scheduled_at), "dd", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(nextSession.scheduled_at), "MMM", { locale: ptBR })} • {format(new Date(nextSession.scheduled_at), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] font-medium leading-tight text-center text-muted-foreground truncate">
                      {nextSession.campaign_name}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mb-2 border border-border">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Próxima</p>
                    <p className="text-xl font-display font-bold mt-1 text-muted-foreground">--</p>
                    <p className="text-xs text-muted-foreground/70">Sessão</p>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] font-medium leading-tight text-center text-muted-foreground/70">
                      Nenhuma agendada
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-5 mt-8 relative z-10">
        <h2 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button 
                key={action.id} 
                className="flex flex-col items-center gap-2 group"
                onClick={() => handleQuickAction(action.id)}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-active:scale-95 transition-transform relative overflow-hidden`}>
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/20 rounded-2xl" />
                  <Icon className="w-6 h-6 text-white relative z-10" />
                </div>
                <span className="text-[11px] text-muted-foreground text-center leading-tight font-medium group-hover:text-foreground transition-colors">{action.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recents */}
      <section className="mt-8 mb-6 relative z-10">
        <div className="px-5 flex items-center justify-between mb-4">
          <h2 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest">Recentes</h2>
          <button 
            onClick={() => onNavigate?.("characters")}
            className="text-xs text-arcane-cyan font-medium hover:text-arcane-cyan/80 transition-colors"
          >
            Ver Todos
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-arcane-cyan" />
          </div>
        ) : recentItems.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum item recente</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-5 pb-2">
              {recentItems.map((item) => (
                <div 
                  key={`${item.type}-${item.id}`}
                  className="flex-shrink-0 w-36 glass-card rounded-xl p-3 hover:border-arcane-cyan/30 transition-colors cursor-pointer group"
                  onClick={() => {
                    if (item.type === 'character') {
                      navigate(`/characters?view=${item.id}`);
                    } else {
                      navigate(`/campaigns?view=${item.id}`);
                    }
                  }}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-105 transition-transform`}>
                    {item.level && (
                      <span className="text-xs font-bold text-white">{item.level}</span>
                    )}
                    {!item.level && (
                      <Hexagon className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-0.5 truncate group-hover:text-arcane-cyan transition-colors">{item.name}</h3>
                  <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground/60 truncate">{item.time} atrás</p>
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