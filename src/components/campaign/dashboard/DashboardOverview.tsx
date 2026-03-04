import { CampaignDB } from "@/hooks/useCampaigns";
import { 
  Users, Calendar, Swords, StickyNote, MessageCircle, 
  Library, Crown, Copy, Share2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DashboardOverviewProps {
  campaign: CampaignDB;
  isMaster: boolean;
  sessions?: any[];
  players?: any[];
  onNavigate: (section: any) => void;
}

export function DashboardOverview({ campaign, isMaster, sessions, players, onNavigate }: DashboardOverviewProps) {
  const upcomingSessions = sessions?.filter(s => isFuture(new Date(s.scheduled_at))) || [];
  const nextSession = upcomingSessions[0];

  const handleCopyInviteCode = () => {
    if (campaign.invite_code) {
      navigator.clipboard.writeText(campaign.invite_code);
      toast.success("Código copiado: " + campaign.invite_code);
    }
  };

  const quickActions = [
    { id: 'sessions', label: 'Sessões', icon: Calendar, color: 'text-primary', bgColor: 'bg-primary/10' },
    { id: 'combat', label: 'Combate', icon: Swords, color: 'text-destructive', bgColor: 'bg-destructive/10', masterOnly: true },
    { id: 'notes', label: 'Notas', icon: StickyNote, color: 'text-accent-foreground', bgColor: 'bg-accent/50' },
    { id: 'chat', label: 'Chat', icon: MessageCircle, color: 'text-secondary', bgColor: 'bg-secondary/10' },
    { id: 'players', label: 'Jogadores', icon: Users, color: 'text-primary', bgColor: 'bg-primary/10' },
    { id: 'compendium', label: 'Compêndio', icon: Library, color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
  ].filter(action => !action.masterOnly || isMaster);

  return (
    <div className="space-y-6">
      {/* Campaign Header Card */}
      <div className="relative rounded-2xl overflow-hidden">
        {campaign.image_url ? (
          <>
            <img 
              src={campaign.image_url} 
              alt={campaign.name}
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </>
        ) : (
          <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end gap-4">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-background",
              campaign.image_url ? "bg-card" : "bg-primary/30"
            )}>
              {campaign.image_url ? (
                <img src={campaign.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Crown className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
              <p className="text-sm text-muted-foreground">
                {isMaster ? "Você é o Mestre" : "Jogador"} • D&D 5e
              </p>
            </div>
          </div>
        </div>
      </div>

      {campaign.description && (
        <p className="text-sm text-muted-foreground">{campaign.description}</p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl p-4 text-center border border-border">
          <Users className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{players?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Jogadores</p>
        </div>
        <div className="bg-card rounded-xl p-4 text-center border border-border">
          <Calendar className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{sessions?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Sessões</p>
        </div>
        <div className="bg-card rounded-xl p-4 text-center border border-border">
          <Swords className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">-</p>
          <p className="text-xs text-muted-foreground">Combates</p>
        </div>
        <div className="bg-card rounded-xl p-4 text-center border border-border">
          <StickyNote className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">-</p>
          <p className="text-xs text-muted-foreground">Notas</p>
        </div>
      </div>

      {/* Invite Code (Master only) */}
      {isMaster && campaign.invite_code && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Código de Convite</p>
              <p className="text-xl font-mono font-bold tracking-widest">{campaign.invite_code}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyInviteCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Next Session */}
      {nextSession && (
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Próxima Sessão</p>
              <p className="font-semibold">{nextSession.title}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(nextSession.scheduled_at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Acesso Rápido</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl transition-colors",
                  action.bgColor,
                  "hover:opacity-80"
                )}
              >
                <Icon className={cn("w-6 h-6", action.color)} />
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
