import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Map, Crown } from "lucide-react";
import { useCreateBattleMap } from "@/hooks/useBattleMaps";
import { CampaignDB } from "@/hooks/useCampaigns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaigns: CampaignDB[];
  defaultCampaignId?: string;
}

export function CreateBattleMapSheet({ open, onOpenChange, campaigns, defaultCampaignId }: Props) {
  const [name, setName] = useState("Novo Mapa");
  const [selectedCampaignId, setSelectedCampaignId] = useState(defaultCampaignId || "");
  const createMap = useCreateBattleMap();

  const handleCreate = async () => {
    if (!selectedCampaignId || !name.trim()) return;
    try {
      await createMap.mutateAsync({
        campaign_id: selectedCampaignId,
        name,
        grid_width: 20,
        grid_height: 20,
      });
      setName("Novo Mapa");
      onOpenChange(false);
    } catch {}
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[50vh] rounded-t-3xl">
        <SheetHeader className="text-left mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Map className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Criar Mapa Tático</SheetTitle>
              <p className="text-sm text-muted-foreground">Configure grid e imagem após a criação</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Campanha</Label>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger className="bg-muted/50 border-0">
                <SelectValue placeholder="Selecione a campanha" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <Crown className="w-3 h-3 text-primary" />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {campaigns.length === 0 && (
              <p className="text-xs text-muted-foreground">Você precisa ser mestre de uma campanha para criar mapas.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nome do Mapa</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="bg-muted/50 border-0" />
          </div>

          <Button
            onClick={handleCreate}
            disabled={!name.trim() || !selectedCampaignId || createMap.isPending}
            className="w-full h-12 text-base font-semibold"
          >
            {createMap.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar Mapa
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
