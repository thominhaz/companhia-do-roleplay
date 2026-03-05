import { useState } from "react";
import { TokenPosition } from "@/hooks/useBattleMaps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, Swords, Trash2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerInfo {
  user_id: string;
  character?: { id: string; name: string } | null;
}

interface Props {
  tokens: TokenPosition[];
  players: PlayerInfo[];
  onAddPlayers: () => void;
  onAddMonster: (name?: string) => void;
  onRemoveToken: (tokenId: string) => void;
}

export function MapEditorToolbar({ tokens, players, onAddPlayers, onAddMonster, onRemoveToken }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [monsterName, setMonsterName] = useState("");

  const playerTokens = tokens.filter(t => t.isPlayer);
  const monsterTokens = tokens.filter(t => !t.isPlayer);

  const handleAddMonster = () => {
    onAddMonster(monsterName.trim() || undefined);
    setMonsterName("");
  };

  if (collapsed) {
    return (
      <div className="w-10 bg-card/60 border-r border-border/50 flex flex-col items-center pt-2">
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} className="w-8 h-8">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-56 bg-card/60 border-r border-border/50 flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tokens</span>
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} className="w-6 h-6">
          <ChevronLeft className="w-3 h-3" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Add players section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Jogadores</span>
              <Button variant="ghost" size="sm" onClick={onAddPlayers} className="h-6 px-2 text-xs gap-1">
                <UserPlus className="w-3 h-3" /> Adicionar
              </Button>
            </div>
            {playerTokens.length > 0 && (
              <div className="space-y-1">
                {playerTokens.map(token => (
                  <div key={token.id} className="flex items-center gap-2 text-xs bg-background/50 rounded-lg px-2 py-1.5">
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: token.color }} />
                    <span className="flex-1 truncate">{token.name}</span>
                    <span className="text-[10px] text-muted-foreground">({token.x},{token.y})</span>
                    <button onClick={() => onRemoveToken(token.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add monsters section */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Monstros / NPCs</span>
            <div className="flex gap-1">
              <Input
                placeholder="Nome do token..."
                value={monsterName}
                onChange={e => setMonsterName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddMonster()}
                className="h-7 text-xs bg-background/50 border-0"
              />
              <Button variant="ghost" size="icon" onClick={handleAddMonster} className="h-7 w-7 shrink-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {monsterTokens.length > 0 && (
              <div className="space-y-1">
                {monsterTokens.map(token => (
                  <div key={token.id} className="flex items-center gap-2 text-xs bg-background/50 rounded-lg px-2 py-1.5">
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: token.color }} />
                    <span className="flex-1 truncate">{token.name}</span>
                    <span className="text-[10px] text-muted-foreground">({token.x},{token.y})</span>
                    <button onClick={() => onRemoveToken(token.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
