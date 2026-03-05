import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useBattleMaps, useUpdateBattleMap, useDeleteBattleMap, useActivateBattleMap, TokenPosition } from "@/hooks/useBattleMaps";
import { useCampaignPlayers } from "@/hooks/useSessions";
import { BattleMapCanvas } from "../battlemap/BattleMapCanvas";
import { CreateBattleMapSheet } from "../battlemap/CreateBattleMapSheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Map, Plus, Trash2, Eye, EyeOff, UserPlus, Loader2, Swords } from "lucide-react";

const TOKEN_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

interface Props {
  campaign: CampaignDB;
  isMaster: boolean;
}

export function DashboardBattleMap({ campaign, isMaster }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

  const { data: maps, isLoading } = useBattleMaps(campaign.id);
  const { data: players } = useCampaignPlayers(campaign.id);
  const updateMap = useUpdateBattleMap();
  const deleteMap = useDeleteBattleMap();
  const activateMap = useActivateBattleMap();

  const activeMap = maps?.find(m => m.id === selectedMapId) || maps?.[0] || null;

  const handleTokenMove = (tokenId: string, x: number, y: number) => {
    if (!activeMap) return;
    const newTokens = activeMap.token_positions.map(t =>
      t.id === tokenId ? { ...t, x, y } : t
    );
    updateMap.mutate({
      id: activeMap.id,
      campaignId: campaign.id,
      token_positions: newTokens,
    });
  };

  const addPlayerTokens = () => {
    if (!activeMap || !players) return;
    const existing = activeMap.token_positions;
    const newTokens: TokenPosition[] = [...existing];
    let col = 0;

    players.forEach((player, i) => {
      if (!player.character) return;
      // Skip if already has a token
      if (existing.some(t => t.characterId === player.character!.id)) return;
      newTokens.push({
        id: `player-${player.character.id}`,
        name: player.character.name,
        x: col,
        y: (activeMap.grid_height || 20) - 1,
        color: TOKEN_COLORS[i % TOKEN_COLORS.length],
        isPlayer: true,
        characterId: player.character.id,
      });
      col++;
    });

    updateMap.mutate({
      id: activeMap.id,
      campaignId: campaign.id,
      token_positions: newTokens,
    });
  };

  const addMonsterToken = () => {
    if (!activeMap) return;
    const count = activeMap.token_positions.filter(t => !t.isPlayer).length;
    const name = `Monstro ${count + 1}`;
    const newToken: TokenPosition = {
      id: `monster-${Date.now()}`,
      name,
      x: Math.floor(activeMap.grid_width / 2),
      y: 0,
      color: TOKEN_COLORS[(count + 5) % TOKEN_COLORS.length],
      isPlayer: false,
    };
    updateMap.mutate({
      id: activeMap.id,
      campaignId: campaign.id,
      token_positions: [...activeMap.token_positions, newToken],
    });
  };

  const removeToken = (tokenId: string) => {
    if (!activeMap) return;
    updateMap.mutate({
      id: activeMap.id,
      campaignId: campaign.id,
      token_positions: activeMap.token_positions.filter(t => t.id !== tokenId),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold">Mapa Tático</h2>
          <p className="text-sm text-muted-foreground">{maps?.length || 0} mapa(s) criado(s)</p>
        </div>
        {isMaster && (
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Mapa
          </Button>
        )}
      </div>

      {/* Map selector */}
      {maps && maps.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={activeMap?.id || ""}
            onValueChange={(id) => setSelectedMapId(id)}
          >
            <SelectTrigger className="w-56 bg-muted/50 border-0">
              <SelectValue placeholder="Selecione um mapa" />
            </SelectTrigger>
            <SelectContent>
              {maps.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <Map className="w-3 h-3" />
                    {m.name}
                    {m.is_active && <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded">ATIVO</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isMaster && activeMap && (
            <>
              <Button
                variant={activeMap.is_active ? "secondary" : "outline"}
                size="sm"
                onClick={() => activateMap.mutate({ id: activeMap.id, campaignId: campaign.id })}
                className="gap-1"
              >
                {activeMap.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {activeMap.is_active ? "Ativo" : "Ativar"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover mapa?</AlertDialogTitle>
                    <AlertDialogDescription>O mapa "{activeMap.name}" será removido permanentemente.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground"
                      onClick={() => {
                        deleteMap.mutate({ id: activeMap.id, campaignId: campaign.id });
                        setSelectedMapId(null);
                      }}
                    >Remover</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      )}

      {/* Canvas */}
      {activeMap ? (
        <div className="space-y-3">
          <div className="h-[50vh] sm:h-[60vh] rounded-xl overflow-hidden border border-border">
            <BattleMapCanvas
              gridWidth={activeMap.grid_width}
              gridHeight={activeMap.grid_height}
              cellSize={activeMap.cell_size}
              imageUrl={activeMap.image_url}
              tokens={activeMap.token_positions}
              onTokenMove={handleTokenMove}
              readOnly={!isMaster}
            />
          </div>

          {/* Token controls */}
          {isMaster && (
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={addPlayerTokens} className="gap-1">
                <UserPlus className="w-3 h-3" /> Jogadores
              </Button>
              <Button variant="outline" size="sm" onClick={addMonsterToken} className="gap-1">
                <Swords className="w-3 h-3" /> Monstro
              </Button>
            </div>
          )}

          {/* Token list */}
          {activeMap.token_positions.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeMap.token_positions.map(token => (
                <div key={token.id} className="flex items-center gap-2 bg-card rounded-lg p-2 border border-border text-sm">
                  <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: token.color }} />
                  <span className="flex-1 truncate">{token.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({token.x},{token.y})
                  </span>
                  {isMaster && (
                    <button
                      onClick={() => removeToken(token.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <Map className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground mb-2">Nenhum mapa criado</p>
          {isMaster && (
            <Button onClick={() => setShowCreate(true)} variant="outline">
              Criar Primeiro Mapa
            </Button>
          )}
        </div>
      )}

      <CreateBattleMapSheet
        open={showCreate}
        onOpenChange={setShowCreate}
        campaigns={[{ id: campaign.id, name: campaign.name, master_id: campaign.master_id, description: campaign.description, image_url: campaign.image_url, invite_code: campaign.invite_code, theme_color: campaign.theme_color, icon: campaign.icon, created_at: campaign.created_at, updated_at: campaign.updated_at } as any]}
        defaultCampaignId={campaign.id}
      />
    </div>
  );
}
