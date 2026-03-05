import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBattleMaps, useUpdateBattleMap, useDeleteBattleMap, useActivateBattleMap, TokenPosition, BattleMap } from "@/hooks/useBattleMaps";
import { useCampaignPlayers } from "@/hooks/useSessions";
import { useMasterCampaigns } from "@/hooks/useCampaigns";
import { BattleMapCanvas } from "@/components/campaign/battlemap/BattleMapCanvas";
import { MapEditorToolbar } from "@/components/campaign/battlemap/MapEditorToolbar";
import { MapEditorTopBar } from "@/components/campaign/battlemap/MapEditorTopBar";
import { MapGridSettings } from "@/components/campaign/battlemap/MapGridSettings";
import { Loader2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOKEN_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

export default function MapEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: masterCampaigns } = useMasterCampaigns();

  // We need to find which campaign this map belongs to
  // Fetch all campaign maps to find the right one
  const [activeMap, setActiveMap] = useState<BattleMap | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [showGridSettings, setShowGridSettings] = useState(false);

  // Try to find the map across campaigns
  const allCampaignIds = masterCampaigns?.map(c => c.id) || [];

  // We'll use a search approach - fetch maps for each campaign
  return (
    <MapEditorInner
      mapId={id || ""}
      onBack={() => navigate(-1)}
    />
  );
}

function MapEditorInner({ mapId, onBack }: { mapId: string; onBack: () => void }) {
  const { user } = useAuth();
  const { data: masterCampaigns } = useMasterCampaigns();
  const navigate = useNavigate();

  // We need to find the map - search through master campaigns
  const [foundMap, setFoundMap] = useState<BattleMap | null>(null);
  const [foundCampaignId, setFoundCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGridSettings, setShowGridSettings] = useState(false);

  const updateMap = useUpdateBattleMap();
  const deleteMap = useDeleteBattleMap();
  const activateMap = useActivateBattleMap();

  // Search for the map in all master campaigns
  useEffect(() => {
    if (!masterCampaigns || masterCampaigns.length === 0) {
      setLoading(false);
      return;
    }

    // Import supabase to do a direct query
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("battle_maps")
        .select("*")
        .eq("id", mapId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (data) {
            setFoundMap({
              ...data,
              token_positions: (data.token_positions as any) || [],
            } as BattleMap);
            setFoundCampaignId(data.campaign_id);
          }
          setLoading(false);
        });
    });
  }, [mapId, masterCampaigns]);

  // Refetch map data when it changes
  const { data: maps } = useBattleMaps(foundCampaignId || "");
  const { data: players } = useCampaignPlayers(foundCampaignId || "");

  const currentMap = useMemo(() => {
    return maps?.find(m => m.id === mapId) || foundMap;
  }, [maps, mapId, foundMap]);

  const isMaster = masterCampaigns?.some(c => c.id === foundCampaignId) || false;

  const handleTokenMove = useCallback((tokenId: string, x: number, y: number) => {
    if (!currentMap || !foundCampaignId) return;
    const newTokens = currentMap.token_positions.map(t =>
      t.id === tokenId ? { ...t, x, y } : t
    );
    updateMap.mutate({
      id: currentMap.id,
      campaignId: foundCampaignId,
      token_positions: newTokens,
    });
  }, [currentMap, foundCampaignId, updateMap]);

  const addPlayerTokens = useCallback(() => {
    if (!currentMap || !players || !foundCampaignId) return;
    const existing = currentMap.token_positions;
    const newTokens: TokenPosition[] = [...existing];
    let col = 0;

    players.forEach((player, i) => {
      if (!player.character) return;
      if (existing.some(t => t.characterId === player.character!.id)) return;
      newTokens.push({
        id: `player-${player.character.id}`,
        name: player.character.name,
        x: col,
        y: (currentMap.grid_height) - 1,
        color: TOKEN_COLORS[i % TOKEN_COLORS.length],
        isPlayer: true,
        characterId: player.character.id,
      });
      col++;
    });

    updateMap.mutate({
      id: currentMap.id,
      campaignId: foundCampaignId,
      token_positions: newTokens,
    });
  }, [currentMap, players, foundCampaignId, updateMap]);

  const addMonsterToken = useCallback((name?: string) => {
    if (!currentMap || !foundCampaignId) return;
    const count = currentMap.token_positions.filter(t => !t.isPlayer).length;
    const tokenName = name || `Monstro ${count + 1}`;
    const newToken: TokenPosition = {
      id: `monster-${Date.now()}`,
      name: tokenName,
      x: Math.floor(currentMap.grid_width / 2),
      y: 0,
      color: TOKEN_COLORS[(count + 5) % TOKEN_COLORS.length],
      isPlayer: false,
    };
    updateMap.mutate({
      id: currentMap.id,
      campaignId: foundCampaignId,
      token_positions: [...currentMap.token_positions, newToken],
    });
  }, [currentMap, foundCampaignId, updateMap]);

  const removeToken = useCallback((tokenId: string) => {
    if (!currentMap || !foundCampaignId) return;
    updateMap.mutate({
      id: currentMap.id,
      campaignId: foundCampaignId,
      token_positions: currentMap.token_positions.filter(t => t.id !== tokenId),
    });
  }, [currentMap, foundCampaignId, updateMap]);

  const handleGridChange = useCallback((gridWidth: number, gridHeight: number, cellSize: number) => {
    if (!currentMap || !foundCampaignId) return;
    updateMap.mutate({
      id: currentMap.id,
      campaignId: foundCampaignId,
      grid_width: gridWidth,
      grid_height: gridHeight,
    });
  }, [currentMap, foundCampaignId, updateMap]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!currentMap || !foundCampaignId) return;
    const { supabase } = await import("@/integrations/supabase/client");
    const ext = file.name.split('.').pop();
    const path = `${foundCampaignId}/battlemap-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('campaign-images')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from('campaign-images')
      .getPublicUrl(path);
    updateMap.mutate({
      id: currentMap.id,
      campaignId: foundCampaignId,
      image_url: publicUrl,
    });
  }, [currentMap, foundCampaignId, updateMap]);

  const handleToggleActive = useCallback(() => {
    if (!currentMap || !foundCampaignId) return;
    activateMap.mutate({ id: currentMap.id, campaignId: foundCampaignId, currentlyActive: currentMap.is_active });
  }, [currentMap, foundCampaignId, activateMap]);

  const handleDelete = useCallback(() => {
    if (!currentMap || !foundCampaignId) return;
    deleteMap.mutate({ id: currentMap.id, campaignId: foundCampaignId });
    navigate("/?tab=maps");
  }, [currentMap, foundCampaignId, deleteMap, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-darker flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentMap) {
    return (
      <div className="min-h-screen bg-darker flex flex-col items-center justify-center gap-4">
        <Map className="w-16 h-16 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Mapa não encontrado</p>
        <Button variant="outline" onClick={onBack}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-darker flex flex-col overflow-hidden">
      {/* Top bar */}
      <MapEditorTopBar
        map={currentMap}
        isMaster={isMaster}
        onBack={onBack}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        onToggleGridSettings={() => setShowGridSettings(s => !s)}
        onImageUpload={handleImageUpload}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Lateral toolbar */}
        {isMaster && (
          <MapEditorToolbar
            tokens={currentMap.token_positions}
            players={players || []}
            onAddPlayers={addPlayerTokens}
            onAddMonster={addMonsterToken}
            onRemoveToken={removeToken}
          />
        )}

        {/* Canvas */}
        <div className="flex-1 relative">
          <BattleMapCanvas
            gridWidth={currentMap.grid_width}
            gridHeight={currentMap.grid_height}
            cellSize={currentMap.cell_size}
            imageUrl={currentMap.image_url}
            tokens={currentMap.token_positions}
            onTokenMove={handleTokenMove}
            readOnly={!isMaster}
            allowedCharacterId={!isMaster ? players?.find(p => p.user_id === user?.id)?.character?.id : undefined}
          />

          {/* Grid settings overlay */}
          {showGridSettings && isMaster && (
            <MapGridSettings
              gridWidth={currentMap.grid_width}
              gridHeight={currentMap.grid_height}
              cellSize={currentMap.cell_size}
              onClose={() => setShowGridSettings(false)}
              onChange={handleGridChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
