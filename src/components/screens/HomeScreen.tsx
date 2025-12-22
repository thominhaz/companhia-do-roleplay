import { Loader2, Calendar, Plus, ChevronRight, Hexagon, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useCharacters } from "@/hooks/useCharacters";
import { useAllCampaigns } from "@/hooks/useCampaigns";
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

const diceTypes = ["d20", "d12", "d10", "d8", "d6", "d4"];

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const { data: characters, isLoading: loadingChars } = useCharacters();
  const { data: campaignsData, isLoading: loadingCampaigns } = useAllCampaigns();
  const { data: upcomingSessions } = useUpcomingSessions(1);
  const navigate = useNavigate();

  const isPremium = subscription?.status === "premium";
  const isLoading = loadingChars || loadingCampaigns;
  
  // Get most recent campaign
  const activeCampaign = campaignsData?.master[0] || campaignsData?.player[0];
  
  // Get recent characters (limit 2)
  const recentCharacters = characters?.slice(0, 2) || [];

  const handleCreateCharacter = () => {
    if (!user) {
      toast.error("Faça login para criar um personagem", {
        action: { label: "Entrar", onClick: () => navigate("/auth") }
      });
      return;
    }
    navigate('/characters?create=true');
  };

  const handleRollDice = (dice: string) => {
    const sides = parseInt(dice.replace('d', ''));
    const result = Math.floor(Math.random() * sides) + 1;
    toast.success(`🎲 ${dice}: ${result}`, { duration: 3000 });
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-arcane-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <AppHeader
        rightContent={
          <div className="flex items-center gap-4">
            {!user ? (
              <button 
                onClick={() => navigate("/auth")}
                className="px-4 py-2 text-sm font-medium bg-arcane-600 hover:bg-arcane-500 rounded-lg text-white transition-colors"
              >
                Entrar
              </button>
            ) : (
              <>
                <NotificationBell />
                <button className="w-10 h-10 rounded-full bg-slate-800 border border-white/20 overflow-hidden hover:border-arcane-500 transition-all">
                  <img 
                    src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Main Content */}
      <main className="px-4 md:px-8 pb-8 max-w-7xl mx-auto">
        {/* Portal Title */}
        <div className="mb-8 mt-2">
          <h1 className="font-serif text-3xl lg:text-4xl text-white font-bold tracking-tight mb-1">
            Portal do Aventureiro
          </h1>
          <p className="text-slate-400 text-sm">Sua jornada continua aqui.</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Active Campaign Hero Banner */}
          <div className="col-span-1 lg:col-span-8 relative h-64 rounded-2xl overflow-hidden group border border-white/10 shadow-2xl">
            {activeCampaign ? (
              <>
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ 
                    backgroundImage: activeCampaign.image_url 
                      ? `url(${activeCampaign.image_url})` 
                      : "url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2000&auto=format&fit=crop')" 
                  }}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                
                <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold bg-arcane-600/90 text-white backdrop-blur border border-white/10 mb-3 inline-block shadow-arcane">
                        Campanha Ativa
                      </span>
                      <h2 className="font-serif text-2xl md:text-3xl text-white font-bold mb-2 leading-tight">
                        {activeCampaign.name}
                      </h2>
                      <p className="text-slate-300 text-sm md:text-base max-w-lg line-clamp-2">
                        {activeCampaign.description || "Uma aventura épica aguarda..."}
                      </p>
                    </div>
                    <button 
                      onClick={() => onNavigate?.("campaigns")}
                      className="hidden sm:flex items-center gap-2 bg-white text-slate-950 px-6 py-3 rounded-lg font-bold hover:bg-mystic-400 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-mystic"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Jogar
                    </button>
                    {/* Mobile Play Button */}
                    <button 
                      onClick={() => onNavigate?.("campaigns")}
                      className="sm:hidden w-12 h-12 rounded-full bg-mystic-400 flex items-center justify-center text-slate-900 shadow-mystic animate-pulse"
                    >
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50">
                <p className="text-slate-400 text-sm mb-4">Nenhuma campanha ativa</p>
                <button 
                  onClick={() => onNavigate?.("campaigns")}
                  className="px-4 py-2 bg-arcane-600 text-white rounded-lg text-sm font-medium hover:bg-arcane-500 transition-colors"
                >
                  Explorar Campanhas
                </button>
              </div>
            )}
          </div>

          {/* Create Character Card */}
          <div 
            onClick={handleCreateCharacter}
            className="col-span-1 lg:col-span-4 glass-panel rounded-2xl p-6 flex flex-col justify-center items-center text-center hover-glow cursor-pointer group transition-all relative overflow-hidden min-h-[200px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-arcane-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-arcane-500 transition-all shadow-lg relative z-10">
              <Plus className="w-8 h-8 text-arcane-400" />
            </div>
            <h3 className="font-serif text-xl font-bold text-white mb-1 relative z-10">Novo Personagem</h3>
            <p className="text-slate-400 text-sm relative z-10">Forje um novo herói.</p>
          </div>

          {/* Recent Characters Section */}
          <div className="col-span-1 lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-white font-bold">Personagens Recentes</h3>
              <button 
                onClick={() => onNavigate?.("characters")}
                className="text-sm text-arcane-400 hover:text-white transition-colors"
              >
                Ver todos
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-arcane-400" />
              </div>
            ) : recentCharacters.length === 0 ? (
              <div className="glass-panel p-6 rounded-xl text-center">
                <p className="text-slate-400 text-sm">Nenhum personagem criado ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentCharacters.map((char) => {
                  const hpPercent = (char.current_hp / char.max_hp) * 100;
                  const hpColor = hpPercent > 50 ? "from-green-500 to-green-400" : hpPercent > 25 ? "from-yellow-500 to-yellow-400" : "from-red-500 to-red-400";
                  
                  return (
                    <div 
                      key={char.id}
                      onClick={() => navigate(`/characters?id=${char.id}`)}
                      className="glass-panel p-4 rounded-xl border border-white/5 hover:border-arcane-500/50 transition-colors flex items-center gap-4 cursor-pointer group relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-arcane-500/5 to-transparent" />
                      <div 
                        className="w-16 h-16 rounded-lg bg-slate-800 bg-cover border border-white/10 group-hover:border-arcane-500 transition-all shadow-lg"
                        style={{ 
                          backgroundImage: char.image_url 
                            ? `url(${char.image_url})` 
                            : `url(https://api.dicebear.com/7.x/adventurer/svg?seed=${char.name})` 
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-bold text-lg text-white group-hover:text-arcane-400 transition-colors truncate">
                          {char.name}
                        </h4>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                          {char.race} • {char.class} • Nvl {char.level}
                        </p>
                        <div className="w-28 h-1.5 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                          <div 
                            className={`h-full bg-gradient-to-r ${hpColor}`}
                            style={{ width: `${hpPercent}%` }}
                          />
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dice Roller Card */}
          <div className="col-span-1 lg:col-span-4">
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group h-full flex flex-col justify-center">
              <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                <Hexagon className="w-40 h-40 text-white" />
              </div>
              
              <h3 className="font-serif text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Hexagon className="w-5 h-5 text-mystic-400" />
                Dados
              </h3>
              
              <div className="grid grid-cols-6 lg:grid-cols-3 gap-2">
                {diceTypes.map((dice) => (
                  <button
                    key={dice}
                    onClick={() => handleRollDice(dice)}
                    className="aspect-square flex items-center justify-center bg-slate-800/50 hover:bg-arcane-600 hover:text-white text-slate-400 border border-white/5 rounded-lg font-bold text-sm transition-all shadow-sm hover:shadow-arcane"
                  >
                    {dice}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}