import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCharacterHistory, CharacterHistoryEntry } from "@/hooks/useCharacterHistory";
import { useSubscription } from "@/hooks/useSubscription";
import { History, Clock, ArrowRight, Lock, Crown, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface CharacterHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterName: string;
}

function formatDisplayValue(value: string | null, fieldName: string): string {
  if (!value || value === 'null' || value === '""') return '(vazio)';
  
  // Try to parse JSON for complex objects
  try {
    const parsed = JSON.parse(value);
    
    // Handle attributes
    if (fieldName === 'attributes' && typeof parsed === 'object') {
      const attrs = parsed as Record<string, number>;
      return Object.entries(attrs)
        .map(([key, val]) => `${key.slice(0, 3).toUpperCase()}: ${val}`)
        .join(', ');
    }
    
    // Handle arrays
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return '(vazio)';
      if (parsed.length <= 3) {
        return parsed.map(item => 
          typeof item === 'object' ? item.name || JSON.stringify(item) : item
        ).join(', ');
      }
      return `${parsed.length} itens`;
    }
    
    // Handle currency
    if (fieldName === 'currency' && typeof parsed === 'object') {
      const currencies = parsed as Record<string, number>;
      return Object.entries(currencies)
        .filter(([_, val]) => val > 0)
        .map(([key, val]) => `${val} ${key}`)
        .join(', ') || '(sem moedas)';
    }
    
    // Handle other objects
    if (typeof parsed === 'object') {
      return JSON.stringify(parsed).slice(0, 50) + '...';
    }
    
    return String(parsed);
  } catch {
    // Not JSON, return as is
    return value.length > 50 ? value.slice(0, 50) + '...' : value;
  }
}

function HistoryEntry({ entry }: { entry: CharacterHistoryEntry }) {
  const timeAgo = formatDistanceToNow(new Date(entry.created_at), { 
    addSuffix: true, 
    locale: ptBR 
  });
  const fullDate = format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <div className="p-3 rounded-xl bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary" className="text-xs">
          {entry.field_label}
        </Badge>
        <span className="text-[10px] text-muted-foreground" title={fullDate}>
          {timeAgo}
        </span>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 min-w-0">
          <p className="text-muted-foreground text-xs mb-0.5">De:</p>
          <p className="text-foreground truncate text-xs bg-destructive/10 rounded px-2 py-1">
            {formatDisplayValue(entry.old_value, entry.field_name)}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-muted-foreground text-xs mb-0.5">Para:</p>
          <p className="text-foreground truncate text-xs bg-green-500/10 rounded px-2 py-1">
            {formatDisplayValue(entry.new_value, entry.field_name)}
          </p>
        </div>
      </div>
    </div>
  );
}

function groupEntriesByDate(entries: CharacterHistoryEntry[]): Record<string, CharacterHistoryEntry[]> {
  const groups: Record<string, CharacterHistoryEntry[]> = {};
  
  entries.forEach(entry => {
    const date = format(new Date(entry.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
  });
  
  return groups;
}

export function CharacterHistorySheet({ 
  open, 
  onOpenChange, 
  characterId, 
  characterName 
}: CharacterHistorySheetProps) {
  const { data: history, isLoading } = useCharacterHistory(characterId);
  const { data: subscription } = useSubscription();
  
  const hasAccess = subscription?.limits.hasHistorico ?? false;
  const groupedHistory = history ? groupEntriesByDate(history) : {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Alterações
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{characterName}</p>
        </SheetHeader>

        {!hasAccess ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Recurso Premium</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              O histórico de alterações está disponível para assinantes dos planos Herói e Mestre.
            </p>
            <div className="flex items-center gap-2 text-gold">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium">Faça upgrade para desbloquear</span>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !history || history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Clock className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum histórico ainda</h3>
            <p className="text-sm text-muted-foreground text-center">
              As alterações feitas neste personagem aparecerão aqui.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(85vh-8rem)]">
            <div className="space-y-6 pb-8">
              {Object.entries(groupedHistory).map(([date, entries]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground font-medium">
                      {format(new Date(date), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <HistoryEntry key={entry.id} entry={entry} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
