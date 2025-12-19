import { Plus, Crown, Users, Calendar, MoreVertical, MessageCircle, StickyNote, Hash, Signal, Brain, Wand2, Eye, Skull, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type FilterType = 'all' | 'mastering' | 'playing';

interface MasterCampaign {
  id: string;
  name: string;
  system: string;
  playerCount: number;
  session: number;
  level: string;
  status: 'Ativa' | 'Pausa';
  nextSession?: string;
  lastSession?: string;
  icon: 'dragon' | 'skull';
  gradient: 'emerald' | 'orange';
}

interface PlayerCampaign {
  id: string;
  name: string;
  system: string;
  masterName: string;
  session: number;
  level?: number;
  sanity?: number;
  nextSession: string;
  icon: 'wand' | 'eye';
  color: 'blue' | 'purple';
}

const mockMasterCampaigns: MasterCampaign[] = [
  {
    id: "1",
    name: "O Despertar dos Dragões",
    system: "D&D 5e",
    playerCount: 4,
    session: 12,
    level: "7-8",
    status: "Ativa",
    nextSession: "Sáb 21h",
    icon: "dragon",
    gradient: "emerald",
  },
  {
    id: "2",
    name: "Curse of Strahd",
    system: "D&D 5e",
    playerCount: 3,
    session: 8,
    level: "5-6",
    status: "Pausa",
    lastSession: "há 2 semanas",
    icon: "skull",
    gradient: "orange",
  },
];

const mockPlayerCampaigns: PlayerCampaign[] = [
  {
    id: "3",
    name: "Academia de Magia",
    system: "D&D 5e",
    masterName: "Rafael",
    session: 15,
    level: 9,
    nextSession: "Dom 19h",
    icon: "wand",
    color: "blue",
  },
  {
    id: "4",
    name: "Call of Cthulhu",
    system: "CoC 7e",
    masterName: "Ana",
    session: 6,
    sanity: 85,
    nextSession: "Sex 20h",
    icon: "eye",
    color: "purple",
  },
];

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 backdrop-blur-sm">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      <div className="relative bg-gradient-to-br from-dark to-darker rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500 opacity-10 rounded-full -ml-12 -mb-12" />
        
        <div className="relative z-10">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Acesso Restrito</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Este recurso é exclusivo para assinantes do <span className="text-amber-400 font-semibold">Plano Mestre</span>. Desbloqueie todas as ferramentas para mestres!
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-primary via-purple-700 to-purple-900 rounded-2xl p-5 mb-6 shadow-xl border border-purple-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-lg text-foreground">Plano Mestre</h4>
            </div>
            <ul className="text-sm space-y-2 mb-5">
              {[
                "Campanhas ilimitadas",
                "Ferramentas avançadas de mestre",
                "Gerador de NPCs com IA",
                "Combat Tracker completo",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="text-center">
              <span className="text-2xl font-bold text-foreground">R$ 19,90</span>
              <span className="text-sm text-purple-200">/mês</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-muted rounded-xl text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">
              Depois
            </button>
            <button className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
              Assinar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MasterCampaignCard({ campaign }: { campaign: MasterCampaign }) {
  const gradientClasses = {
    emerald: "from-emerald-900 to-emerald-700",
    orange: "from-orange-900 to-red-700",
  };

  const iconBgClasses = {
    emerald: "bg-emerald-500",
    orange: "bg-orange-500",
  };

  const textColorClasses = {
    emerald: "text-emerald-200",
    orange: "text-orange-200",
  };

  const buttonBgClasses = {
    emerald: "bg-emerald-600/40",
    orange: "bg-orange-600/40",
  };

  const borderClasses = {
    emerald: "border-emerald-600/40",
    orange: "border-orange-600/40",
  };

  const IconComponent = campaign.icon === 'dragon' ? Wand2 : Skull;

  return (
    <div className={cn("bg-gradient-to-br rounded-2xl p-5 relative overflow-hidden", gradientClasses[campaign.gradient])}>
      <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-12 -mb-12" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center text-2xl", iconBgClasses[campaign.gradient])}>
              <IconComponent className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-foreground">{campaign.name}</h3>
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <p className={cn("text-sm", textColorClasses[campaign.gradient])}>
                {campaign.system} • {campaign.playerCount} jogadores
              </p>
            </div>
          </div>
          <button className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center">
            <MoreVertical className={cn("w-4 h-4", textColorClasses[campaign.gradient])} />
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-black/20 rounded-lg p-2.5">
            <p className={cn("text-xs mb-0.5", textColorClasses[campaign.gradient])}>Sessão</p>
            <p className="text-xl font-bold text-foreground">{campaign.session}</p>
          </div>
          <div className="bg-black/20 rounded-lg p-2.5">
            <p className={cn("text-xs mb-0.5", textColorClasses[campaign.gradient])}>Nível</p>
            <p className="text-xl font-bold text-foreground">{campaign.level}</p>
          </div>
          <div className="bg-black/20 rounded-lg p-2.5">
            <p className={cn("text-xs mb-0.5", textColorClasses[campaign.gradient])}>Status</p>
            <p className="text-xs font-bold text-foreground">{campaign.status}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button className={cn("flex-1 py-2 rounded-lg text-xs font-medium text-foreground", buttonBgClasses[campaign.gradient])}>
            <MessageCircle className="w-3 h-3 inline mr-2" />Chat
          </button>
          <button className={cn("flex-1 py-2 rounded-lg text-xs font-medium text-foreground", buttonBgClasses[campaign.gradient])}>
            <StickyNote className="w-3 h-3 inline mr-2" />Notas
          </button>
          <button className={cn("flex-1 py-2 rounded-lg text-xs font-medium text-foreground", buttonBgClasses[campaign.gradient])}>
            <Calendar className="w-3 h-3 inline mr-2" />Agenda
          </button>
        </div>
        
        <div className={cn("flex items-center justify-between pt-3 border-t", borderClasses[campaign.gradient])}>
          <div className="flex items-center gap-2">
            <Calendar className={cn("w-4 h-4", textColorClasses[campaign.gradient])} />
            <span className={cn("text-xs", textColorClasses[campaign.gradient])}>
              {campaign.nextSession ? `Próxima: ${campaign.nextSession}` : `Última: ${campaign.lastSession}`}
            </span>
          </div>
          <button className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold",
            campaign.gradient === 'emerald' ? "bg-white text-emerald-900" : "bg-white text-orange-900"
          )}>
            Gerenciar
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerCampaignCard({ campaign }: { campaign: PlayerCampaign }) {
  const colorClasses = {
    blue: {
      iconBg: "from-blue-600 to-blue-800",
      buttonBg: "bg-blue-600/20",
      buttonText: "text-blue-400",
      nextSession: "text-blue-400",
    },
    purple: {
      iconBg: "from-purple-600 to-purple-800",
      buttonBg: "bg-purple-600/20",
      buttonText: "text-purple-400",
      nextSession: "text-purple-400",
    },
  };

  const colors = colorClasses[campaign.color];
  const IconComponent = campaign.icon === 'wand' ? Wand2 : Eye;

  return (
    <div className="bg-dark rounded-xl p-4 border border-border">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center", colors.iconBg)}>
          <IconComponent className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-foreground truncate">{campaign.name}</h3>
            <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground">Mestre: {campaign.masterName} • {campaign.system}</p>
        </div>
        <button className="w-8 h-8 rounded-lg bg-darker flex items-center justify-center">
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      
      <div className="flex gap-2 mb-3">
        <button className={cn("flex-1 py-2 rounded-lg text-xs font-medium", colors.buttonBg, colors.buttonText)}>
          <MessageCircle className="w-3 h-3 inline mr-2" />Chat
        </button>
        <button className={cn("flex-1 py-2 rounded-lg text-xs font-medium", colors.buttonBg, colors.buttonText)}>
          <StickyNote className="w-3 h-3 inline mr-2" />Notas
        </button>
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Hash className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Sessão {campaign.session}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {campaign.level ? (
            <>
              <Signal className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Nv {campaign.level}</span>
            </>
          ) : (
            <>
              <Brain className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{campaign.sanity} Sanidade</span>
            </>
          )}
        </div>
        <div className="flex-1" />
        <span className={cn("text-xs", colors.nextSession)}>{campaign.nextSession}</span>
      </div>
    </div>
  );
}

export function CampaignsScreen() {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const isPremium = subscription?.status === 'premium';

  const totalCampaigns = mockMasterCampaigns.length + mockPlayerCampaigns.length;

  const handleCreateCampaign = () => {
    if (!user) {
      toast.error("Faça login para criar campanhas");
      return;
    }
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    console.log("Create campaign");
  };

  const filteredMasterCampaigns = activeFilter === 'playing' ? [] : mockMasterCampaigns;
  const filteredPlayerCampaigns = activeFilter === 'mastering' ? [] : mockPlayerCampaigns;

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-b from-dark to-darker px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Campanhas</h1>
            {isPremium && (
              <div className="px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full">
                <Crown className="w-3 h-3 text-black" />
              </div>
            )}
          </div>
          <button 
            onClick={handleCreateCampaign}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center shadow-lg"
          >
            <Plus className="w-5 h-5 text-foreground" />
          </button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button 
            onClick={() => setActiveFilter('all')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeFilter === 'all' ? "bg-primary text-foreground" : "bg-dark text-muted-foreground"
            )}
          >
            Todas ({totalCampaigns})
          </button>
          <button 
            onClick={() => setActiveFilter('mastering')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeFilter === 'mastering' ? "bg-primary text-foreground" : "bg-dark text-muted-foreground"
            )}
          >
            Mestrando ({mockMasterCampaigns.length})
          </button>
          <button 
            onClick={() => setActiveFilter('playing')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeFilter === 'playing' ? "bg-primary text-foreground" : "bg-dark text-muted-foreground"
            )}
          >
            Jogando ({mockPlayerCampaigns.length})
          </button>
        </div>
      </header>

      {/* Master Campaigns */}
      {filteredMasterCampaigns.length > 0 && (
        <section className="px-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">Mestrando</h2>
            <span className="text-xs text-muted-foreground">{filteredMasterCampaigns.length} campanhas</span>
          </div>
          
          <div className="space-y-4">
            {filteredMasterCampaigns.map((campaign) => (
              <MasterCampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>
      )}

      {/* Player Campaigns */}
      {filteredPlayerCampaigns.length > 0 && (
        <section className="px-5 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">Jogando</h2>
            <span className="text-xs text-muted-foreground">{filteredPlayerCampaigns.length} campanhas</span>
          </div>
          
          <div className="space-y-3">
            {filteredPlayerCampaigns.map((campaign) => (
              <PlayerCampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>
      )}

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
}
