import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBattleMaps } from "@/hooks/useBattleMaps";
import { useMasterCampaigns, usePlayerCampaigns, CampaignDB } from "@/hooks/useCampaigns";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, Plus, Crown, Users, Loader2, LogIn } from "lucide-react";
import { CreateBattleMapSheet } from "@/components/campaign/battlemap/CreateBattleMapSheet";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MapsScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);

  const { data: masterCampaigns } = useMasterCampaigns();
  const { data: playerCampaigns } = usePlayerCampaigns();

  const allCampaigns: CampaignDB[] = [
    ...(masterCampaigns || []),
    ...(playerCampaigns?.map(p => (p as any).campaigns).filter(Boolean) || []),
  ].filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i) as CampaignDB[];

  const isMasterOf = (campaignId: string) =>
    masterCampaigns?.some(c => c.id === campaignId) || false;

  const campaignFilter = selectedCampaignId === "all" ? undefined : selectedCampaignId;

  // We need to fetch maps for all campaigns or a specific one
  const { data: maps, isLoading } = useBattleMaps(campaignFilter || "");

  // For "all" mode, fetch all campaign maps
  const allMapsQueries = allCampaigns.map(c => c.id);

  if (!user) {
    return (
      <div className="min-h-screen bg-darker pb-24">
        <AppHeader title="Mapas Táticos" />
        <div className="text-center py-16 px-4">
          <Map className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground mb-4">Entre para acessar seus mapas</p>
          <Button onClick={() => navigate("/auth")} className="gap-2">
            <LogIn className="w-4 h-4" /> Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darker pb-24">
      <AppHeader title="Mapas Táticos" />

      <div className="px-5 md:px-8 lg:px-12 py-4 space-y-4 max-w-6xl mx-auto">
        {/* Filters + Create */}
        <div className="flex items-center gap-3">
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="flex-1 bg-card/60 border-border/50">
              <SelectValue placeholder="Todas as campanhas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as campanhas</SelectItem>
              {allCampaigns.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    {isMasterOf(c.id) ? <Crown className="w-3 h-3 text-primary" /> : <Users className="w-3 h-3" />}
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setShowCreate(true)} size="icon" className="shrink-0">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Maps list */}
        <AllCampaignMaps
          campaigns={allCampaigns}
          filterCampaignId={campaignFilter}
          isMasterOf={isMasterOf}
          onOpenMap={(mapId, campaignId) => navigate(`/map/${mapId}`)}
        />
      </div>

      <CreateBattleMapSheet
        open={showCreate}
        onOpenChange={setShowCreate}
        campaigns={allCampaigns.filter(c => isMasterOf(c.id))}
      />
    </div>
  );
}

function AllCampaignMaps({
  campaigns,
  filterCampaignId,
  isMasterOf,
  onOpenMap,
}: {
  campaigns: CampaignDB[];
  filterCampaignId?: string;
  isMasterOf: (id: string) => boolean;
  onOpenMap: (mapId: string, campaignId: string) => void;
}) {
  const filtered = filterCampaignId ? campaigns.filter(c => c.id === filterCampaignId) : campaigns;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16">
        <Map className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Nenhuma campanha encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filtered.map(campaign => (
        <CampaignMapsSection
          key={campaign.id}
          campaign={campaign}
          isMaster={isMasterOf(campaign.id)}
          onOpenMap={onOpenMap}
        />
      ))}
    </div>
  );
}

function CampaignMapsSection({
  campaign,
  isMaster,
  onOpenMap,
}: {
  campaign: CampaignDB;
  isMaster: boolean;
  onOpenMap: (mapId: string, campaignId: string) => void;
}) {
  const { data: maps, isLoading } = useBattleMaps(campaign.id);

  // Players only see active maps
  const visibleMaps = isMaster ? maps : maps?.filter(m => m.is_active);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (!visibleMaps || visibleMaps.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {isMaster ? <Crown className="w-4 h-4 text-primary" /> : <Users className="w-4 h-4 text-muted-foreground" />}
        <h3 className="font-semibold text-sm">{campaign.name}</h3>
        <span className="text-xs text-muted-foreground">({visibleMaps.length})</span>
      </div>

      <div className="space-y-3">
        {visibleMaps.map(map => (
          <button
            key={map.id}
            onClick={() => onOpenMap(map.id, campaign.id)}
            className={cn(
              "relative w-full text-left rounded-2xl border border-border/30 bg-surface-1/80 backdrop-blur-md overflow-hidden",
              "hover:border-primary/30 hover:shadow-depth-md hover:scale-[1.01] transition-all group shadow-depth-sm"
            )}
          >
            <div className="flex items-center gap-3 p-4">
              {/* Thumbnail */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-border/30 bg-muted/30 overflow-hidden flex-shrink-0">
                {map.image_url ? (
                  <img src={map.image_url} alt={map.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Map className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-foreground truncate">{map.name}</h4>
                  {map.is_active && (
                    <span className="text-[10px] bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      ATIVO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {map.grid_width}×{map.grid_height}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {map.token_positions.length} tokens
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
