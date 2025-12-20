import { useCombatLogs, CombatLog } from "@/hooks/useCombatLogs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Heart, 
  Skull, 
  Zap, 
  Play, 
  Square, 
  SkipForward,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CombatLogPanelProps {
  encounterId: string;
}

function getLogIcon(actionType: string) {
  switch (actionType) {
    case 'damage':
      return <Skull className="w-3 h-3 text-red-500" />;
    case 'heal':
      return <Heart className="w-3 h-3 text-green-500" />;
    case 'condition_add':
    case 'condition_remove':
      return <Zap className="w-3 h-3 text-yellow-500" />;
    case 'turn_start':
      return <SkipForward className="w-3 h-3 text-blue-500" />;
    case 'combat_start':
      return <Play className="w-3 h-3 text-primary" />;
    case 'combat_end':
      return <Square className="w-3 h-3 text-muted-foreground" />;
    default:
      return <Zap className="w-3 h-3" />;
  }
}

function getLogMessage(log: CombatLog) {
  const name = log.combatant_name || 'Alguém';
  
  switch (log.action_type) {
    case 'damage':
      return (
        <>
          <span className="font-medium">{name}</span>
          <span className="text-muted-foreground"> recebeu </span>
          <span className="text-red-500 font-medium">{log.value} de dano</span>
        </>
      );
    case 'heal':
      return (
        <>
          <span className="font-medium">{name}</span>
          <span className="text-muted-foreground"> foi curado em </span>
          <span className="text-green-500 font-medium">{log.value} HP</span>
        </>
      );
    case 'condition_add':
      return (
        <>
          <span className="font-medium">{name}</span>
          <span className="text-muted-foreground"> ficou </span>
          <span className="text-yellow-500 font-medium">{log.details}</span>
        </>
      );
    case 'condition_remove':
      return (
        <>
          <span className="font-medium">{name}</span>
          <span className="text-muted-foreground"> não está mais </span>
          <span className="text-green-500 font-medium">{log.details}</span>
        </>
      );
    case 'turn_start':
      return (
        <>
          <span className="text-muted-foreground">Turno de </span>
          <span className="font-medium text-primary">{name}</span>
        </>
      );
    case 'combat_start':
      return <span className="text-primary font-medium">Combate iniciado!</span>;
    case 'combat_end':
      return <span className="text-muted-foreground font-medium">Combate encerrado</span>;
    default:
      return <span>{log.details || 'Ação desconhecida'}</span>;
  }
}

export function CombatLogPanel({ encounterId }: CombatLogPanelProps) {
  const { data: logs, isLoading } = useCombatLogs(encounterId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        Nenhuma ação registrada ainda
      </div>
    );
  }

  return (
    <ScrollArea className="h-40">
      <div className="space-y-1 p-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className={cn(
              "flex items-start gap-2 text-xs py-1.5 px-2 rounded-md",
              "hover:bg-muted/50 transition-colors"
            )}
          >
            <div className="mt-0.5">{getLogIcon(log.action_type)}</div>
            <div className="flex-1 min-w-0">
              <p className="leading-relaxed">{getLogMessage(log)}</p>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(log.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
