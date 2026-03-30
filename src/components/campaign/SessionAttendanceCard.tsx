import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, X, HelpCircle, Calendar, MapPin, Clock, 
  Users, ChevronDown, ChevronUp, Loader2, Trash2, Ban,
  MoreVertical
} from "lucide-react";
import { format, formatDistanceToNow, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  SessionDB, 
  useSessionAttendance, 
  useUpdateAttendance, 
  useMyAttendance,
  useDeleteSession,
  useUpdateSession,
} from "@/hooks/useSessions";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface SessionAttendanceCardProps {
  session: SessionDB;
  isUpcoming?: boolean;
  isMaster?: boolean;
}

export function SessionAttendanceCard({ session, isUpcoming = true, isMaster = false }: SessionAttendanceCardProps) {
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const { data: attendance, isLoading: loadingAttendance, refetch } = useSessionAttendance(session.id);
  const { data: myAttendance, isLoading: loadingMyAttendance } = useMyAttendance(session.id);
  const updateAttendance = useUpdateAttendance();
  const deleteSession = useDeleteSession();
  const updateSession = useUpdateSession();

  // Realtime subscription for attendance updates
  useEffect(() => {
    const channel = supabase
      .channel(`attendance-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_attendance',
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id, refetch]);

  const handleAttendance = (status: 'confirmed' | 'declined' | 'tentative') => {
    updateAttendance.mutate({ sessionId: session.id, status });
  };

  const confirmedCount = attendance?.filter(a => a.status === 'confirmed').length || 0;
  const declinedCount = attendance?.filter(a => a.status === 'declined').length || 0;
  const tentativeCount = attendance?.filter(a => a.status === 'tentative').length || 0;

  const statusConfig = {
    confirmed: { icon: Check, label: 'Confirmado', color: 'bg-secondary/20 text-secondary border-secondary/30' },
    declined: { icon: X, label: 'Ausente', color: 'bg-destructive/20 text-destructive border-destructive/30' },
    tentative: { icon: HelpCircle, label: 'Talvez', color: 'bg-gold/20 text-gold border-gold/30' },
    pending: { icon: Clock, label: 'Pendente', color: 'bg-muted text-muted-foreground border-muted' },
  };

  const currentStatus = myAttendance?.status || 'pending';
  const StatusConfig = statusConfig[currentStatus];

  return (
    <div className={cn(
      "rounded-xl border transition-colors",
      isUpcoming ? "bg-card border-primary/30" : "bg-muted/30 border-transparent"
    )}>
      {/* Main Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{session.title}</h4>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(session.scheduled_at), "dd/MM/yyyy", { locale: ptBR })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(session.scheduled_at), "HH:mm", { locale: ptBR })}
              </div>
              {session.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{session.location}</span>
                </div>
              )}
            </div>
          </div>
          
          {isUpcoming && (
            <Badge variant="outline" className="flex-shrink-0 border-primary/30 text-primary">
              {formatDistanceToNow(new Date(session.scheduled_at), { locale: ptBR, addSuffix: true })}
            </Badge>
          )}
        </div>

        {/* Attendance Actions - Only for upcoming sessions */}
        {isUpcoming && isFuture(new Date(session.scheduled_at)) && (
          <div className="space-y-3">
            {/* Current Status */}
            {!loadingMyAttendance && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sua presença:</span>
                <Badge variant="outline" className={cn("text-xs", StatusConfig.color)}>
                  <StatusConfig.icon className="w-3 h-3 mr-1" />
                  {StatusConfig.label}
                </Badge>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={currentStatus === 'confirmed' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 gap-1 h-9",
                  currentStatus === 'confirmed' && "bg-green-600 hover:bg-green-700"
                )}
                onClick={() => handleAttendance('confirmed')}
                disabled={updateAttendance.isPending}
              >
                {updateAttendance.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Confirmar
              </Button>
              <Button
                size="sm"
                variant={currentStatus === 'tentative' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 gap-1 h-9",
                  currentStatus === 'tentative' && "bg-amber-600 hover:bg-amber-700"
                )}
                onClick={() => handleAttendance('tentative')}
                disabled={updateAttendance.isPending}
              >
                <HelpCircle className="w-3 h-3" />
                Talvez
              </Button>
              <Button
                size="sm"
                variant={currentStatus === 'declined' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 gap-1 h-9",
                  currentStatus === 'declined' && "bg-red-600 hover:bg-red-700"
                )}
                onClick={() => handleAttendance('declined')}
                disabled={updateAttendance.isPending}
              >
                <X className="w-3 h-3" />
                Ausente
              </Button>
            </div>

            {/* Attendance Summary */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>
                  <span className="text-green-500 font-medium">{confirmedCount}</span> confirmados
                  {tentativeCount > 0 && (
                    <>, <span className="text-amber-500 font-medium">{tentativeCount}</span> talvez</>
                  )}
                  {declinedCount > 0 && (
                    <>, <span className="text-red-500 font-medium">{declinedCount}</span> ausentes</>
                  )}
                </span>
              </div>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Attendance Details */}
      {showDetails && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {loadingAttendance ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : attendance && attendance.length > 0 ? (
            <div className="space-y-1.5">
              {attendance.map((a) => {
                const config = statusConfig[a.status];
                return (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{a.profile?.display_name || 'Jogador'}</span>
                    <Badge variant="outline" className={cn("text-xs", config.color)}>
                      <config.icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              Ninguém respondeu ainda
            </p>
          )}
        </div>
      )}
    </div>
  );
}
