import { Bell, Loader2 } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const quickActions = [
  { id: "create", label: "Criar Ficha", icon: Plus, gradient: "from-primary to-purple-700" },
  { id: "join", label: "Entrar em Mesa", icon: Link, gradient: "from-blue-600 to-blue-800" },
  { id: "dice", label: "Rolar Dados", icon: Dices, gradient: "from-green-600 to-green-800" },
  { id: "note", label: "Nota Rápida", icon: StickyNote, gradient: "from-amber-600 to-amber-800" },
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
  Guerreiro: "from-red-600 to-red-800",
  Mago: "from-blue-600 to-blue-800",
  Paladino: "from-yellow-600 to-yellow-800",
  Ladino: "from-gray-600 to-gray-800",
  Clerigo: "from-white to-gray-300",
  Barbaro: "from-orange-600 to-orange-800",
  Bardo: "from-purple-600 to-purple-800",
  Druida: "from-green-600 to-green-800",
  Feiticeiro: "from-pink-600 to-pink-800",
  Bruxo: "from-violet-600 to-violet-800",
  Monge: "from-cyan-600 to-cyan-800",
  Patrulheiro: "from-emerald-600 to-emerald-800",
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

export function HomeScreen() {
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const { data: characters, isLoading: loadingChars } = useCharacters();
  const { data: campaignsData, isLoading: loadingCampaigns } = useAllCampaigns();
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Aventureiro";
  const isPremium = subscription?.status === "premium";

  const isLoading = loadingChars || loadingCampaigns;

  // Get most recent character as active
  const activeCharacter = characters?.[0];
  
  // Build recent items
  const recentItems = buildRecentItems(
    characters || [], 
    campaignsData || { master: [], player: [] }
  );

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 bg-gradient-to-b from-dark to-darker">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Go20" className="w-10 h-10" />
            <div>
              <p className="text-muted-foreground text-sm">Bem-vindo de volta</p>
              <h1 className="text-xl font-bold">
                Olá, {displayName} {user ? "🖐️" : ""}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!user && (
              <button 
                onClick={() => navigate("/auth")}
                className="px-4 py-2 text-sm font-medium bg-gradient-primary rounded-xl text-foreground"
              >
                Entrar
              </button>
            )}
            <div className="relative">
              <button className="w-11 h-11 rounded-full bg-dark flex items-center justify-center relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-darker" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Subscription Badge */}
        {user && (
          <div className="mt-3 flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              isPremium 
                ? "bg-gold/20 text-gold" 
                : "bg-muted text-muted-foreground"
            }`}>
              {isPremium ? "Premium" : "Free"}
            </span>
            {!isPremium && characters && (
              <span className="text-xs text-muted-foreground">
                {characters.length}/3 personagens
              </span>
            )}
          </div>
        )}
      </header>

      {/* Hero Grid */}
      <section className="px-5 mt-6">
        <div className="grid grid-cols-3 gap-3 h-48">
          {/* Active Character Card */}
          <div className="col-span-2 bg-gradient-to-br from-purple-900 to-purple-700 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-foreground opacity-5 rounded-full -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-foreground opacity-5 rounded-full -ml-8 -mb-8" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-300" />
                </div>
              ) : activeCharacter ? (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-purple-200">ATIVO</span>
                    </div>
                    <h3 className="text-lg font-bold leading-tight">{activeCharacter.name}</h3>
                    <p className="text-xs text-purple-200 mt-1">
                      {activeCharacter.race} {activeCharacter.class} • Nv {activeCharacter.level}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-background/20 rounded-lg px-2 py-1.5">
                      <p className="text-xs text-purple-200">HP</p>
                      <p className="text-sm font-bold">{activeCharacter.current_hp}/{activeCharacter.max_hp}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Shield className="w-8 h-8 text-purple-300 mb-2" />
                  <p className="text-sm text-purple-200">Nenhum personagem</p>
                  <button 
                    onClick={() => navigate("/characters")}
                    className="mt-2 px-3 py-1 bg-purple-500 rounded-lg text-xs font-medium"
                  >
                    Criar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Next Session Card */}
          <div className="col-span-1 bg-gradient-to-br from-pink-900 to-pink-700 rounded-2xl p-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-foreground opacity-5 rounded-full -mr-8 -mt-8" />
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs text-pink-200 font-medium">PRÓXIMA</p>
                <p className="text-lg font-bold mt-1">--</p>
                <p className="text-xs text-pink-200">Sessão</p>
              </div>
              <div className="mt-2 pt-2 border-t border-pink-600 border-opacity-40">
                <p className="text-xs font-medium leading-tight text-center text-pink-200">Sem sessões</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-5 mt-8">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4">AÇÕES RÁPIDAS</h2>
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button 
              key={action.id} 
              className="flex flex-col items-center gap-2"
              onClick={() => {
                if (action.id === 'create') navigate('/characters');
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
          <button className="text-xs text-primary font-medium">Ver Todos</button>
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
            <div className="flex gap-3 px-5 pb-2">
              {recentItems.map((item) => (
                <div 
                  key={`${item.type}-${item.id}`}
                  className="flex-shrink-0 w-40 bg-dark rounded-xl p-3 border border-border"
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
