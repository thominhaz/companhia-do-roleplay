import { useState } from "react";
import { TokenPosition, TokenSize, TOKEN_SIZE_LABELS } from "@/hooks/useBattleMaps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserPlus, Trash2, ChevronLeft, ChevronRight, Plus, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#06b6d4",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#78716c",
  "#1e293b", "#ffffff",
];

const PRESET_ICONS = [
  "🐉", "💀", "👹", "🧟", "🐺", "🕷️", "👻", "🦇",
  "⚔️", "🛡️", "🏹", "🔥", "❄️", "⚡", "🌿", "🌑",
  "D", "G", "O", "S", "B", "Z", "T", "W",
];

interface PlayerInfo {
  user_id: string;
  character?: { id: string; name: string } | null;
}

interface Props {
  tokens: TokenPosition[];
  players: PlayerInfo[];
  onAddPlayers: () => void;
  onAddMonster: (name?: string, color?: string, size?: TokenSize, icon?: string) => void;
  onRemoveToken: (tokenId: string) => void;
  onUpdateToken?: (tokenId: string, updates: Partial<TokenPosition>) => void;
  isMobile?: boolean;
}

export function MapEditorToolbar({ tokens, players, onAddPlayers, onAddMonster, onRemoveToken, onUpdateToken, isMobile }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [monsterName, setMonsterName] = useState("");
  const [monsterColor, setMonsterColor] = useState(PRESET_COLORS[0]);
  const [monsterSize, setMonsterSize] = useState<TokenSize>("medium");
  const [monsterIcon, setMonsterIcon] = useState("");

  const playerTokens = tokens.filter(t => t.isPlayer);
  const monsterTokens = tokens.filter(t => !t.isPlayer);

  const handleAddMonster = () => {
    onAddMonster(
      monsterName.trim() || undefined,
      monsterColor,
      monsterSize,
      monsterIcon.trim() || undefined,
    );
    setMonsterName("");
    setMonsterIcon("");
  };

  // Mobile mode: render as scrollable content (no wrapper chrome)
  if (isMobile) {
    return (
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 pb-6">
          {/* Players */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Jogadores</span>
              <Button variant="ghost" size="sm" onClick={onAddPlayers} className="h-7 px-2 text-xs gap-1">
                <UserPlus className="w-3 h-3" /> Adicionar
              </Button>
            </div>
            {playerTokens.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {playerTokens.map(token => (
                  <div key={token.id} className="flex items-center gap-2 text-xs bg-background/50 rounded-lg px-2 py-2">
                    <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: token.color }} />
                    <span className="flex-1 truncate">{token.name}</span>
                    <button onClick={() => onRemoveToken(token.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add monster */}
          <div className="space-y-3">
            <span className="text-xs font-medium text-muted-foreground">Novo Monstro / NPC</span>

            <Input
              placeholder="Nome do token..."
              value={monsterName}
              onChange={e => setMonsterName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddMonster()}
              className="h-9 text-sm bg-background/50 border-border/30"
            />

            {/* Color + Size row */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[10px] text-muted-foreground">Cor</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setMonsterColor(c)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-transform active:scale-90",
                        monsterColor === c ? "border-primary scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="w-28 space-y-1">
                <span className="text-[10px] text-muted-foreground">Tamanho</span>
                <Select value={monsterSize} onValueChange={v => setMonsterSize(v as TokenSize)}>
                  <SelectTrigger className="h-8 text-xs bg-background/50 border-border/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(TOKEN_SIZE_LABELS) as [TokenSize, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Icons */}
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground">Ícone / Letra</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setMonsterIcon(monsterIcon === icon ? "" : icon)}
                    className={cn(
                      "w-7 h-7 rounded text-sm flex items-center justify-center border transition-colors active:scale-90",
                      monsterIcon === icon
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background/50 text-foreground border-border/30"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleAddMonster}
              className="w-full h-9 text-sm gap-1"
            >
              <Plus className="w-4 h-4" /> Adicionar Token
            </Button>
          </div>

          {/* Existing monster tokens */}
          {monsterTokens.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">No mapa ({monsterTokens.length})</span>
              <div className="grid grid-cols-2 gap-1.5">
                {monsterTokens.map(token => (
                  <div key={token.id} className="flex items-center gap-2 text-xs bg-background/50 rounded-lg px-2 py-2">
                    <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: token.color }}>
                      {token.icon || token.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="truncate block text-xs">{token.name}</span>
                      {token.size && token.size !== 'medium' && (
                        <span className="text-[9px] text-muted-foreground">{TOKEN_SIZE_LABELS[token.size]}</span>
                      )}
                    </div>
                    <button onClick={() => onRemoveToken(token.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    );
  }

  // Desktop: collapsible sidebar
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
    <div className="w-64 bg-card/60 border-r border-border/50 flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tokens</span>
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} className="w-6 h-6">
          <ChevronLeft className="w-3 h-3" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Players */}
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
                    <button onClick={() => onRemoveToken(token.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add monster */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Monstros / NPCs</span>

            <Input
              placeholder="Nome do token..."
              value={monsterName}
              onChange={e => setMonsterName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddMonster()}
              className="h-7 text-xs bg-background/50 border-border/30"
            />

            {/* Color */}
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground">Cor</span>
              <div className="flex flex-wrap gap-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setMonsterColor(c)}
                    className={cn(
                      "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                      monsterColor === c ? "border-primary scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground">Tamanho</span>
              <Select value={monsterSize} onValueChange={v => setMonsterSize(v as TokenSize)}>
                <SelectTrigger className="h-7 text-xs bg-background/50 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(TOKEN_SIZE_LABELS) as [TokenSize, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Icons */}
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground">Ícone / Letra</span>
              <div className="flex flex-wrap gap-1">
                {PRESET_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setMonsterIcon(monsterIcon === icon ? "" : icon)}
                    className={cn(
                      "w-6 h-6 rounded text-xs flex items-center justify-center border transition-colors",
                      monsterIcon === icon
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background/50 text-foreground border-border/30 hover:bg-muted"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Ou digite..."
                value={monsterIcon}
                onChange={e => setMonsterIcon(e.target.value.slice(0, 2))}
                maxLength={2}
                className="h-6 text-xs bg-background/50 border-border/30 mt-1"
              />
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleAddMonster}
              className="w-full h-7 text-xs gap-1"
            >
              <Plus className="w-3 h-3" /> Adicionar Token
            </Button>
          </div>

          {/* Existing monster tokens */}
          {monsterTokens.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">No mapa</span>
              {monsterTokens.map(token => (
                <TokenListItem
                  key={token.id}
                  token={token}
                  onRemove={() => onRemoveToken(token.id)}
                  onUpdate={onUpdateToken ? (updates) => onUpdateToken(token.id, updates) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function TokenListItem({
  token,
  onRemove,
  onUpdate,
}: {
  token: TokenPosition;
  onRemove: () => void;
  onUpdate?: (updates: Partial<TokenPosition>) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs bg-background/50 rounded-lg px-2 py-1.5 group">
      <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: token.color }}>
        {token.icon || token.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <span className="truncate block">{token.name}</span>
        {token.size && token.size !== 'medium' && (
          <span className="text-[9px] text-muted-foreground">{TOKEN_SIZE_LABELS[token.size]}</span>
        )}
      </div>

      {onUpdate && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <Settings2 className="w-3 h-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" className="w-48 p-2 space-y-2">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground">Cor</span>
              <div className="flex flex-wrap gap-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => onUpdate({ color: c })}
                    className={cn(
                      "w-4 h-4 rounded-full border-2 hover:scale-110 transition-transform",
                      token.color === c ? "border-primary" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground">Tamanho</span>
              <Select value={token.size || 'medium'} onValueChange={v => onUpdate({ size: v as TokenSize })}>
                <SelectTrigger className="h-6 text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(TOKEN_SIZE_LABELS) as [TokenSize, string][]).map(([k, l]) => (
                    <SelectItem key={k} value={k} className="text-xs">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <button onClick={onRemove} className="text-destructive hover:text-destructive/80">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}
