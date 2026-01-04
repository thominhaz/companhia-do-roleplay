import { useState } from "react";
import { Monster } from "@/data/monsters";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMasterCampaigns } from "@/hooks/useCampaigns";
import { useActiveEncounter, useAddCombatant } from "@/hooks/useCombat";
import { Swords, Plus, Loader2, AlertTriangle, Dices } from "lucide-react";
import { toast } from "sonner";

interface AddMonsterToCombatSheetProps {
  monster: Monster | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Parse HP from string like "135 (18d10 + 36)"
function parseHP(hitPoints: string): { current: number; max: number } {
  const match = hitPoints.match(/^(\d+)/);
  const hp = match ? parseInt(match[1]) : 10;
  return { current: hp, max: hp };
}

// Parse AC from string like "17 (armadura natural)"
function parseAC(armorClass: string): number {
  const match = armorClass.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 10;
}

// Get DEX modifier for initiative
function getDexModifier(dexStat: string): number {
  // DEX stat is like "14 (+2)"
  const match = dexStat.match(/\(([+-]?\d+)\)/);
  return match ? parseInt(match[1]) : 0;
}

// Roll initiative (d20 + DEX mod)
function rollInitiative(dexMod: number): number {
  const roll = Math.floor(Math.random() * 20) + 1;
  return roll + dexMod;
}

export function AddMonsterToCombatSheet({ monster, open, onOpenChange }: AddMonsterToCombatSheetProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: masterCampaigns, isLoading: loadingCampaigns } = useMasterCampaigns();
  const { data: encounter, isLoading: loadingEncounter } = useActiveEncounter(selectedCampaignId);
  const addCombatant = useAddCombatant();

  const handleAddToCombat = async () => {
    if (!monster || !encounter) return;

    setIsAdding(true);
    try {
      const hp = parseHP(monster.hitPoints);
      const ac = parseAC(monster.armorClass);
      const dexMod = getDexModifier(monster.stats.DEX);

      for (let i = 0; i < quantity; i++) {
        const name = quantity > 1 
          ? `${customName || monster.name} ${i + 1}`
          : customName || monster.name;
        
        const initiative = rollInitiative(dexMod);

        await addCombatant.mutateAsync({
          encounter_id: encounter.id,
          name,
          initiative,
          current_hp: hp.current,
          max_hp: hp.max,
          armor_class: ac,
          is_player: false,
          conditions: [],
          character_id: null,
          notes: `ND ${monster.challenge}`,
          sort_order: 0,
        });
      }

      toast.success(
        quantity > 1 
          ? `${quantity}x ${monster.name} adicionados ao combate!`
          : `${monster.name} adicionado ao combate!`
      );
      
      onOpenChange(false);
      setQuantity(1);
      setCustomName("");
      setSelectedCampaignId("");
    } catch (error) {
      toast.error("Erro ao adicionar monstro ao combate");
    } finally {
      setIsAdding(false);
    }
  };

  if (!monster) return null;

  const hp = parseHP(monster.hitPoints);
  const ac = parseAC(monster.armorClass);
  const dexMod = getDexModifier(monster.stats.DEX);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-destructive" />
            Adicionar ao Combate
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(70vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Monster Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-lg">{monster.name}</h3>
              <p className="text-sm text-muted-foreground italic">{monster.meta}</p>
              <div className="flex gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">PV:</span>
                  <span className="font-medium">{hp.max}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">CA:</span>
                  <span className="font-medium">{ac}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Iniciativa:</span>
                  <span className="font-medium">d20{dexMod >= 0 ? `+${dexMod}` : dexMod}</span>
                </div>
              </div>
            </div>

            {/* Campaign Selection */}
            <div className="space-y-2">
              <Label>Campanha</Label>
              {loadingCampaigns ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando campanhas...
                </div>
              ) : masterCampaigns.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  Você não é mestre de nenhuma campanha
                </div>
              ) : (
                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterCampaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Encounter Status */}
            {selectedCampaignId && (
              <div className="space-y-2">
                <Label>Combate Ativo</Label>
                {loadingEncounter ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando...
                  </div>
                ) : !encounter ? (
                  <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 p-3 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    Nenhum combate ativo nesta campanha. Inicie um combate primeiro.
                  </div>
                ) : (
                  <div className="text-sm bg-green-500/10 text-green-500 p-3 rounded-lg">
                    ✓ {encounter.name} - Rodada {encounter.round}
                  </div>
                )}
              </div>
            )}

            {/* Quantity & Custom Name */}
            {encounter && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome Customizado (opcional)</Label>
                    <Input
                      placeholder={monster.name}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </div>
                </div>

                {quantity > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Serão adicionados: {Array.from({ length: quantity }, (_, i) => 
                      `${customName || monster.name} ${i + 1}`
                    ).join(", ")}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <Dices className="w-4 h-4" />
                  A iniciativa será rolada automaticamente (d20{dexMod >= 0 ? `+${dexMod}` : dexMod}) para cada monstro
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Action Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleAddToCombat}
            disabled={!encounter || isAdding}
            className="w-full gap-2"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {quantity > 1 
              ? `Adicionar ${quantity}x ${customName || monster.name}`
              : `Adicionar ${customName || monster.name}`
            }
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
