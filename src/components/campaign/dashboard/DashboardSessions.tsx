import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useCampaignSessions, SessionDB } from "@/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Loader2, History, BookOpen, Sparkles, Coins } from "lucide-react";
import { isFuture, isPast, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateSessionSheet } from "../CreateSessionSheet";
import { SessionAttendanceCard } from "../SessionAttendanceCard";
import { SessionRecapSheet } from "../SessionRecapSheet";
import { cn } from "@/lib/utils";

interface DashboardSessionsProps {
  campaign: CampaignDB;
  isMaster: boolean;
}

export function DashboardSessions({ campaign, isMaster }: DashboardSessionsProps) {
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionDB | null>(null);
  const [showRecap, setShowRecap] = useState(false);
  
  const { data: sessions, isLoading } = useCampaignSessions(campaign.id);

  const upcomingSessions = sessions?.filter(s => isFuture(new Date(s.scheduled_at))) || [];
  const pastSessions = sessions?.filter(s => isPast(new Date(s.scheduled_at))) || [];

  const handleOpenRecap = (session: SessionDB) => {
    setSelectedSession(session);
    setShowRecap(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Sessões</h2>
          <p className="text-sm text-muted-foreground">Gerencie as sessões da campanha</p>
        </div>
        {isMaster && (
          <Button onClick={() => setShowCreateSession(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Sessão
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {upcomingSessions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Próximas Sessões</h3>
              <div className="space-y-3">
                {upcomingSessions.map(session => (
                  <SessionAttendanceCard key={session.id} session={session} isUpcoming={true} />
                ))}
              </div>
            </div>
          )}

          {pastSessions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Histórico de Sessões
              </h3>
              <div className="space-y-2">
                {pastSessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => handleOpenRecap(session)}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all hover:border-primary/50",
                      session.summary || session.recap 
                        ? "bg-card border-border" 
                        : "bg-muted/30 border-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold truncate">{session.title}</h4>
                          {session.status === 'completed' && (
                            <Badge variant="outline" className="text-[10px] bg-secondary/10 text-secondary border-secondary/30">
                              Concluída
                            </Badge>
                          )}
                          {(session.summary || session.recap) && (
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                              <BookOpen className="w-3 h-3 mr-1" />
                              Resumo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(session.scheduled_at), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        {session.summary && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {session.summary}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {(session.xp_awarded && session.xp_awarded > 0) && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Sparkles className="w-3 h-3 text-primary" />
                            {session.xp_awarded} XP
                          </Badge>
                        )}
                        {(session.gold_awarded && session.gold_awarded > 0) && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Coins className="w-3 h-3 text-gold" />
                            {session.gold_awarded} PO
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sessions?.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Nenhuma sessão agendada</p>
              {isMaster && (
                <Button onClick={() => setShowCreateSession(true)} variant="outline">
                  Agendar Primeira Sessão
                </Button>
              )}
            </div>
          )}
        </>
      )}

      <CreateSessionSheet
        open={showCreateSession}
        onOpenChange={setShowCreateSession}
        campaignId={campaign.id}
      />

      <SessionRecapSheet
        session={selectedSession}
        open={showRecap}
        onOpenChange={setShowRecap}
        isMaster={isMaster}
      />
    </div>
  );
}
