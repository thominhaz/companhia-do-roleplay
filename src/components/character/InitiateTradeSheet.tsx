import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Loader2, User, Package, CheckCircle2 } from "lucide-react";
import { useCharacterTrades, ItemData } from "@/hooks/usePlayerTrades";

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity?: number;
  category?: string;
  rarity?: string;
}

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

interface InitiateTradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  characterId: string;
  characterInventory: InventoryItem[];
  campaignPlayers: CampaignPlayer[];
}

const RARITY_COLORS: Record<string, string> = {
  comum: "bg-muted text-muted-foreground",
  incomum: "bg-green-500/20 text-green-400",
  raro: "bg-blue-500/20 text-blue-400",
  "muito-raro": "bg-purple-500/20 text-purple-400",
  lendario: "bg-orange-500/20 text-orange-400",
  artefato: "bg-red-500/20 text-red-400",
};

export function InitiateTradeSheet({
  open,
  onOpenChange,
  campaignId,
  characterId,
  characterInventory,
  campaignPlayers,
}: InitiateTradeSheetProps) {
  const { initiateTrade } = useCharacterTrades(characterId);
  const [step, setStep] = useState<'player' | 'item'>('player');
  const [selectedPlayer, setSelectedPlayer] = useState<CampaignPlayer | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Filter out current character from players list
  const otherPlayers = campaignPlayers.filter(
    p => p.character_id && p.character_id !== characterId
  );

  const handleSubmit = async () => {
    if (!selectedPlayer?.character_id || !selectedItem) return;

    const itemData: ItemData = {
      id: selectedItem.id,
      name: selectedItem.name,
      description: selectedItem.description,
      category: selectedItem.category,
      rarity: selectedItem.rarity,
      quantity: selectedItem.quantity || 1,
    };

    await initiateTrade.mutateAsync({
      campaign_id: campaignId,
      receiver_user_id: selectedPlayer.user_id,
      receiver_character_id: selectedPlayer.character_id,
      item_data: itemData,
    });

    // Reset and close
    setStep('player');
    setSelectedPlayer(null);
    setSelectedItem(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setStep('player');
    setSelectedPlayer(null);
    setSelectedItem(null);
    onOpenChange(false);
  };

  const handlePlayerSelect = (player: CampaignPlayer) => {
    setSelectedPlayer(player);
    setStep('item');
  };

  const handleBack = () => {
    if (step === 'item') {
      setStep('player');
      setSelectedItem(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            {step === 'player' ? 'Propor Troca' : 'Selecionar Item'}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {step === 'player' 
              ? 'Escolha um jogador para propor uma troca'
              : `Trocar com ${selectedPlayer?.character?.name}`
            }
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-8rem)] mt-6">
          {step === 'player' ? (
            <div className="space-y-4 pr-4">
              {otherPlayers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum outro jogador com personagem na campanha</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {otherPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handlePlayerSelect(player)}
                      className="p-4 rounded-xl border border-border hover:border-primary/50 text-left transition-all hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{player.character?.name}</p>
                          <p className="text-sm text-muted-foreground">
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
          ) : (
            <div className="space-y-4 pr-4">
              {characterInventory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Você não tem itens no inventário</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {characterInventory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedItem?.id === item.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{item.name}</p>
                            {item.quantity && item.quantity > 1 && (
                              <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {item.rarity && (
                              <Badge className={`text-[10px] ${RARITY_COLORS[item.rarity] || RARITY_COLORS.comum}`}>
                                {item.rarity}
                              </Badge>
                            )}
                            {item.category && (
                              <span className="text-xs text-muted-foreground">{item.category}</span>
                            )}
                          </div>
                        </div>
                        {selectedItem?.id === item.id && (
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-3 pt-4 border-t mt-4">
          {step === 'item' && (
            <Button variant="outline" onClick={handleBack}>
              Voltar
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          {step === 'item' && (
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!selectedItem || initiateTrade.isPending}
            >
              {initiateTrade.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRightLeft className="w-4 h-4 mr-2" />
              )}
              Propor Troca
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
