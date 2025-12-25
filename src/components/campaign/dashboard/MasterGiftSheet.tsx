import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gift, Loader2, User, Package } from "lucide-react";
import { useCampaignTrades, ItemData } from "@/hooks/usePlayerTrades";

interface CampaignPlayer {
  id: string;
  user_id: string;
  character_id: string | null;
  character?: {
    id: string;
    name: string;
    class: string;
    level: number;
  } | null;
  profile?: {
    display_name: string | null;
  } | null;
}

interface MasterGiftSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  players: CampaignPlayer[];
}

const RARITIES = [
  { value: "comum", label: "Comum" },
  { value: "incomum", label: "Incomum" },
  { value: "raro", label: "Raro" },
  { value: "muito-raro", label: "Muito Raro" },
  { value: "lendario", label: "Lendário" },
  { value: "artefato", label: "Artefato" },
];

const CATEGORIES = [
  "Armas",
  "Armaduras",
  "Poções",
  "Pergaminhos",
  "Itens Mágicos",
  "Equipamentos",
  "Suprimentos",
  "Tesouros",
  "Outros",
];

export function MasterGiftSheet({
  open,
  onOpenChange,
  campaignId,
  players,
}: MasterGiftSheetProps) {
  const { createMasterGift } = useCampaignTrades(campaignId);
  const [selectedPlayer, setSelectedPlayer] = useState<CampaignPlayer | null>(null);
  const [itemData, setItemData] = useState<ItemData>({
    name: "",
    description: "",
    category: "",
    rarity: "comum",
    quantity: 1,
  });

  const playersWithCharacters = players.filter(p => p.character_id && p.character);

  const handleSubmit = async () => {
    if (!selectedPlayer?.character_id || !itemData.name.trim()) return;

    await createMasterGift.mutateAsync({
      receiver_user_id: selectedPlayer.user_id,
      receiver_character_id: selectedPlayer.character_id,
      item_data: itemData,
    });

    // Reset form
    setSelectedPlayer(null);
    setItemData({
      name: "",
      description: "",
      category: "",
      rarity: "comum",
      quantity: 1,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Entregar Item (Modo Admin)
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Entregue itens diretamente aos jogadores sem passar pela loja
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-8rem)] mt-6">
          <div className="space-y-6 pr-4">
            {/* Player Selection */}
            <div className="space-y-2">
              <Label>Jogador *</Label>
              {playersWithCharacters.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-xl text-center">
                  Nenhum jogador com personagem na campanha
                </div>
              ) : (
                <div className="grid gap-2">
                  {playersWithCharacters.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPlayer?.id === player.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{player.character?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {player.character?.class} Nv.{player.character?.level}
                            {player.profile?.display_name && ` • ${player.profile.display_name}`}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Item Form */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Package className="w-4 h-4" />
                Dados do Item
              </div>

              <div className="space-y-2">
                <Label>Nome do Item *</Label>
                <Input
                  value={itemData.name}
                  onChange={(e) => setItemData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Espada Longa +1"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={itemData.description}
                  onChange={(e) => setItemData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Uma espada finamente trabalhada..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={itemData.category || ""}
                    onValueChange={(value) => setItemData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Raridade</Label>
                  <Select
                    value={itemData.rarity || "comum"}
                    onValueChange={(value) => setItemData(prev => ({ ...prev, rarity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RARITIES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min={1}
                  value={itemData.quantity || 1}
                  onChange={(e) => setItemData(prev => ({ 
                    ...prev, 
                    quantity: parseInt(e.target.value) || 1 
                  }))}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-4 border-t mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!selectedPlayer?.character_id || !itemData.name.trim() || createMasterGift.isPending}
          >
            {createMasterGift.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Gift className="w-4 h-4 mr-2" />
            )}
            Entregar Item
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}