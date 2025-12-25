import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useCampaignSessions } from "@/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Loader2 } from "lucide-react";
import { isFuture, isPast } from "date-fns";
import { CreateSessionSheet } from "../CreateSessionSheet";
import { SessionAttendanceCard } from "../SessionAttendanceCard";

interface DashboardSessionsProps {
  campaign: CampaignDB;
  isMaster: boolean;
}

export function DashboardSessions({ campaign, isMaster }: DashboardSessionsProps) {
  const [showCreateSession, setShowCreateSession] = useState(false);
  const { data: sessions, isLoading } = useCampaignSessions(campaign.id);

  const upcomingSessions = sessions?.filter(s => isFuture(new Date(s.scheduled_at))) || [];
  const pastSessions = sessions?.filter(s => isPast(new Date(s.scheduled_at))) || [];

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
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Sessões Anteriores</h3>
              <div className="space-y-2">
                {pastSessions.map(session => (
                  <SessionAttendanceCard key={session.id} session={session} isUpcoming={false} />
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
    </div>
  );
}
