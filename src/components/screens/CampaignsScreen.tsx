import { Plus, Crown, Users, Calendar, MoreVertical, MessageCircle, StickyNote, Wand2, Skull, Check, Lock, Loader2, LogIn, Swords, Trash2, LogOut, Eye, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useMasterCampaigns, usePlayerCampaigns, CampaignDB, useDeleteCampaign } from "@/hooks/useCampaigns";
import { useLeaveCampaign } from "@/hooks/useSessions";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { CreateCampaignSheet } from "@/components/campaign/CreateCampaignSheet";
import { CampaignDashboard } from "@/components/campaign/CampaignDashboard";
import { JoinCampaignSheet } from "@/components/campaign/JoinCampaignSheet";
import { CampaignNotesSheet } from "@/components/campaign/CampaignNotesSheet";
import { CampaignChatSheet } from "@/components/campaign/CampaignChatSheet";
import { CreateSessionSheet } from "@/components/campaign/CreateSessionSheet";
import { PlayerCombatView } from "@/components/campaign/PlayerCombatView";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FilterType = 'all' | 'mastering' | 'playing';

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

function MasterCampaignCard({ 
  campaign, 
  playerCount, 
  nextSession,
  onClick,
  onChatClick,
  onNotesClick,
  onAgendaClick,
  onDeleteClick
}: { 
  campaign: CampaignDB; 
  playerCount: number;
  nextSession?: string | null;
  onClick: () => void;
  onChatClick: () => void;
  onNotesClick: () => void;
  onAgendaClick: () => void;
  onDeleteClick: () => void;
}) {
  const isActive = !!nextSession;
  const gradient = isActive ? "emerald" : "orange";
  
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

  const IconComponent = isActive ? Wand2 : Skull;

  const formatNextSession = (date: string) => {
    try {
      const d = new Date(date);
      return format(d, "EEE HH'h'", { locale: ptBR });
    } catch {
      return date;
    }
  };

  const formatLastUpdate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: true });
    } catch {
      return date;
    }
  };

  return (
    <div 
      className={cn("bg-gradient-to-br rounded-2xl p-5 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform", gradientClasses[gradient])}
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-12 -mb-12" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center text-2xl", iconBgClasses[gradient])}>
              <IconComponent className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-foreground">{campaign.name}</h3>
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <p className={cn("text-sm", textColorClasses[gradient])}>
                D&D 5e • {playerCount} jogadores
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className={cn("w-4 h-4", textColorClasses[gradient])} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onClick}>
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onChatClick}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNotesClick}>
                <StickyNote className="w-4 h-4 mr-2" />
                Notas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAgendaClick}>
                <Calendar className="w-4 h-4 mr-2" />
                Agendar Sessão
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDeleteClick} className="text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Campanha
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-black/20 rounded-lg p-2.5">
            <p className={cn("text-xs mb-0.5", textColorClasses[gradient])}>Jogadores</p>
            <p className="text-xl font-bold text-foreground">{playerCount}</p>
          </div>
          <div className="bg-black/20 rounded-lg p-2.5">
            <p className={cn("text-xs mb-0.5", textColorClasses[gradient])}>Status</p>
            <p className="text-xs font-bold text-foreground">{isActive ? "Ativa" : "Pausa"}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button 
            className={cn("flex-1 py-2 rounded-lg text-xs font-medium text-foreground", buttonBgClasses[gradient])}
            onClick={(e) => { e.stopPropagation(); onChatClick(); }}
          >
            <MessageCircle className="w-3 h-3 inline mr-2" />Chat
          </button>
          <button 
            className={cn("flex-1 py-2 rounded-lg text-xs font-medium text-foreground", buttonBgClasses[gradient])}
            onClick={(e) => { e.stopPropagation(); onNotesClick(); }}
          >
            <StickyNote className="w-3 h-3 inline mr-2" />Notas
          </button>
          <button 
            className={cn("flex-1 py-2 rounded-lg text-xs font-medium text-foreground", buttonBgClasses[gradient])}
            onClick={(e) => { e.stopPropagation(); onAgendaClick(); }}
          >
            <Calendar className="w-3 h-3 inline mr-2" />Agenda
          </button>
        </div>
        
        <div className={cn("flex items-center justify-between pt-3 border-t", borderClasses[gradient])}>
          <div className="flex items-center gap-2">
            <Calendar className={cn("w-4 h-4", textColorClasses[gradient])} />
            <span className={cn("text-xs", textColorClasses[gradient])}>
              {nextSession ? `Próxima: ${formatNextSession(nextSession)}` : `Atualizado: ${formatLastUpdate(campaign.updated_at)}`}
            </span>
          </div>
          <button className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold",
            gradient === 'emerald' ? "bg-white text-emerald-900" : "bg-white text-orange-900"
          )}>
            Gerenciar
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerCampaignCard({ campaign, masterName, onClick, onChatClick, onNotesClick, onCombatClick, onLeaveClick }: { campaign: CampaignDB; masterName?: string; onClick: () => void; onChatClick: () => void; onNotesClick: () => void; onCombatClick: () => void; onLeaveClick: () => void }) {
  const colors = {
    iconBg: "from-blue-600 to-blue-800",
    buttonBg: "bg-blue-600/20",
    buttonText: "text-blue-400",
    nextSession: "text-blue-400",
  };

  return (
    <div 
      className="bg-dark rounded-xl p-4 border border-border cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center", colors.iconBg)}>
          <Wand2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-foreground truncate">{campaign.name}</h3>
            <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground">Mestre: {masterName || "Desconhecido"} • D&D 5e</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="w-8 h-8 rounded-lg bg-darker flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onClick}>
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onChatClick}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNotesClick}>
              <StickyNote className="w-4 h-4 mr-2" />
              Notas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCombatClick}>
              <Swords className="w-4 h-4 mr-2" />
              Ver Combate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLeaveClick} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Campanha
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex gap-2 mb-3">
        <button 
          className={cn("flex-1 py-2 rounded-lg text-xs font-medium", colors.buttonBg, colors.buttonText)}
          onClick={(e) => { e.stopPropagation(); onChatClick(); }}
        >
          <MessageCircle className="w-3 h-3 inline mr-2" />Chat
        </button>
        <button 
          className={cn("flex-1 py-2 rounded-lg text-xs font-medium", colors.buttonBg, colors.buttonText)}
          onClick={(e) => { e.stopPropagation(); onNotesClick(); }}
        >
          <StickyNote className="w-3 h-3 inline mr-2" />Notas
        </button>
        <button 
          className={cn("flex-1 py-2 rounded-lg text-xs font-medium", colors.buttonBg, colors.buttonText)}
          onClick={(e) => { e.stopPropagation(); onCombatClick(); }}
        >
          <Swords className="w-3 h-3 inline mr-2" />Combate
        </button>
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(campaign.updated_at), { locale: ptBR, addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CampaignsScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDB | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedIsMaster, setSelectedIsMaster] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Quick action sheets
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [showQuickNotes, setShowQuickNotes] = useState(false);
  const [showQuickAgenda, setShowQuickAgenda] = useState(false);
  const [showQuickCombat, setShowQuickCombat] = useState(false);
  const [quickActionCampaign, setQuickActionCampaign] = useState<CampaignDB | null>(null);
  
  // Delete/Leave confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<CampaignDB | null>(null);
  const [campaignToLeave, setCampaignToLeave] = useState<CampaignDB | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const canCreateCampaign = subscription?.canCreateCampaign ?? false;
  const isVisitante = subscription?.tier === 'visitante';
  const deleteCampaign = useDeleteCampaign();
  const leaveCampaign = useLeaveCampaign();

  const { data: masterData, isLoading: loadingMaster } = useMasterCampaigns();
  const { data: playerData, isLoading: loadingPlayer } = usePlayerCampaigns();

  // Open join sheet if ?join=true in URL
  useEffect(() => {
    if (searchParams.get('join') === 'true' && user) {
      setShowJoinSheet(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, user, setSearchParams]);

  const isLoading = loadingMaster || loadingPlayer;

  const masterCampaigns = masterData || [];
  const playerCampaigns = playerData?.map(p => p.campaigns).filter(Boolean) as CampaignDB[] || [];

  const totalCampaigns = masterCampaigns.length + playerCampaigns.length;

  const handleCreateCampaign = () => {
    if (!user) {
      toast.error("Faça login para criar campanhas");
      return;
    }
    if (!canCreateCampaign) {
      setShowPremiumModal(true);
      return;
    }
    setShowCreateSheet(true);
  };

  const handleOpenCampaign = (campaign: CampaignDB, isMaster: boolean) => {
    setSelectedCampaign(campaign);
    setSelectedIsMaster(isMaster);
    setShowDetailSheet(true);
  };

  const handleQuickChat = (campaign: CampaignDB) => {
    setQuickActionCampaign(campaign);
    setShowQuickChat(true);
  };

  const handleQuickNotes = (campaign: CampaignDB) => {
    setQuickActionCampaign(campaign);
    setShowQuickNotes(true);
  };

  const handleQuickAgenda = (campaign: CampaignDB) => {
    setQuickActionCampaign(campaign);
    setShowQuickAgenda(true);
  };

  const handleQuickCombat = (campaign: CampaignDB) => {
    setQuickActionCampaign(campaign);
    setShowQuickCombat(true);
  };

  const handleDeleteClick = (campaign: CampaignDB) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const handleLeaveClick = (campaign: CampaignDB) => {
    setCampaignToLeave(campaign);
    setLeaveDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (campaignToDelete) {
      try {
        await deleteCampaign.mutateAsync(campaignToDelete.id);
        setDeleteDialogOpen(false);
        setCampaignToDelete(null);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const confirmLeave = async () => {
    if (campaignToLeave) {
      try {
        await leaveCampaign.mutateAsync(campaignToLeave.id);
        setLeaveDialogOpen(false);
        setCampaignToLeave(null);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const filteredMasterCampaigns = activeFilter === 'playing' ? [] : masterCampaigns;
  const filteredPlayerCampaigns = activeFilter === 'mastering' ? [] : playerCampaigns;

  return (
    <div className="min-h-screen bg-darker pb-24">
      <AppHeader
        title="Campanhas"
        rightContent={
          <div className="flex items-center gap-2">
            {subscription?.tier && !isVisitante && (
              <div className={cn(
                "px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold",
                subscription.tier === 'mestre' && "bg-gradient-to-r from-amber-500 to-yellow-500 text-black",
                subscription.tier === 'heroi' && "bg-gradient-to-r from-purple-500 to-indigo-500 text-white",
                subscription.tier === 'aldeao' && "bg-muted text-muted-foreground"
              )}>
                {subscription.tier === 'mestre' && <Crown className="w-3 h-3" />}
                {subscription.tier === 'heroi' && <Users className="w-3 h-3" />}
                <span className="capitalize">{subscription.tier}</span>
              </div>
            )}
            {!isVisitante && (
              user ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowJoinSheet(true)}
                  className="gap-1"
                >
                  <Users className="w-4 h-4" />
                  Participar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/auth")}
                  className="gap-1"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar
                </Button>
              )
            )}
            <button 
              onClick={handleCreateCampaign}
              disabled={!canCreateCampaign}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                canCreateCampaign 
                  ? "bg-gradient-to-br from-amber-500 to-yellow-500" 
                  : "bg-muted"
              }`}
            >
              {canCreateCampaign ? <Plus className="w-5 h-5 text-black" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>
        }
      >
        {!isVisitante && (
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
            Mestrando ({masterCampaigns.length})
          </button>
            <button 
              onClick={() => setActiveFilter('playing')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeFilter === 'playing' ? "bg-primary text-foreground" : "bg-dark text-muted-foreground"
              )}
            >
              Jogando ({playerCampaigns.length})
            </button>
          </div>
        )}
      </AppHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isVisitante ? (
        // Visitante view - show access gate
        <div className="px-4 sm:px-5 mt-4 sm:mt-6">
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              Acesso Restrito
            </h3>
            <p className="text-muted-foreground text-sm mb-6 px-4 max-w-md mx-auto">
              Para criar e participar de campanhas, você precisa resgatar um código de acesso. 
              Apoie o Go20 no Catarse para obter seu código!
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => window.open('https://catarse.me/go20', '_blank')}
                className="bg-gradient-primary"
              >
                <Gift className="w-4 h-4 mr-2" />
                Apoiar no Catarse
              </Button>
              <p className="text-xs text-muted-foreground">
                Já tem um código? Vá em Menu → Assinatura para resgatar
              </p>
            </div>
          </div>
        </div>
      ) : totalCampaigns === 0 ? (
        <div className="px-5 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-dark flex items-center justify-center mx-auto mb-4">
            <Wand2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma campanha</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {canCreateCampaign ? "Crie sua primeira campanha ou entre em uma existente!" : "Assine o Premium para criar campanhas ou entre em uma mesa existente."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setShowJoinSheet(true)}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Entrar em Campanha
            </Button>
            <Button
              onClick={handleCreateCampaign}
            >
              {canCreateCampaign ? "Criar Campanha" : "Ver Planos"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Master Campaigns */}
          {filteredMasterCampaigns.length > 0 && (
            <section className="px-5 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase">Mestrando</h2>
                <span className="text-xs text-muted-foreground">{filteredMasterCampaigns.length} campanhas</span>
              </div>
              
              <div className="space-y-4">
                {filteredMasterCampaigns.map((campaign: any) => (
                  <MasterCampaignCard 
                    key={campaign.id} 
                    campaign={campaign}
                    playerCount={campaign.campaign_players?.[0]?.count || 0}
                    nextSession={campaign.sessions?.[0]?.scheduled_at}
                    onClick={() => handleOpenCampaign(campaign, true)}
                    onChatClick={() => handleQuickChat(campaign)}
                    onNotesClick={() => handleQuickNotes(campaign)}
                    onAgendaClick={() => handleQuickAgenda(campaign)}
                    onDeleteClick={() => handleDeleteClick(campaign)}
                  />
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
                  <PlayerCampaignCard 
                    key={campaign.id} 
                    campaign={campaign}
                    onClick={() => handleOpenCampaign(campaign, false)}
                    onChatClick={() => handleQuickChat(campaign)}
                    onNotesClick={() => handleQuickNotes(campaign)}
                    onCombatClick={() => handleQuickCombat(campaign)}
                    onLeaveClick={() => handleLeaveClick(campaign)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Modals & Sheets */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />

      <CreateCampaignSheet
        open={showCreateSheet}
        onOpenChange={setShowCreateSheet}
      />

      <JoinCampaignSheet
        open={showJoinSheet}
        onOpenChange={setShowJoinSheet}
      />

      <CampaignDashboard
        campaign={selectedCampaign}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        isMaster={selectedIsMaster}
      />

      {/* Quick Action Sheets */}
      {quickActionCampaign && (
        <>
          <CampaignChatSheet
            campaignId={quickActionCampaign.id}
            open={showQuickChat}
            onOpenChange={setShowQuickChat}
          />
          <CampaignNotesSheet
            campaignId={quickActionCampaign.id}
            open={showQuickNotes}
            onOpenChange={setShowQuickNotes}
          />
          <CreateSessionSheet
            campaignId={quickActionCampaign.id}
            open={showQuickAgenda}
            onOpenChange={setShowQuickAgenda}
          />
          <PlayerCombatView
            campaignId={quickActionCampaign.id}
            open={showQuickCombat}
            onOpenChange={setShowQuickCombat}
          />
        </>
      )}

      {/* Delete Campaign Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as sessões, notas e dados de "{campaignToDelete?.name}" serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Campaign Confirmation Dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Você será removido de "{campaignToLeave?.name}" e perderá acesso às sessões e notas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmLeave}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
