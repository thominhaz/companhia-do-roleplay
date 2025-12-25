import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins, User, Package, Loader2, Search } from "lucide-react";
import { ShopItem } from "@/hooks/useShops";
import { useCampaignTransactions, CreateTransactionData } from "@/hooks/useShopTransactions";

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

interface SellItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  shopName: string;
  campaignId: string;
  item: ShopItem;
  players: CampaignPlayer[];
}

export function SellItemSheet({
  open,
  onOpenChange,
  shopId,
  shopName,
  campaignId,
  item,
  players,
}: SellItemSheetProps) {
  const { createTransaction } = useCampaignTransactions(campaignId);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [priceGold, setPriceGold] = useState(item.price_gold);
  const [priceSilver, setPriceSilver] = useState(item.price_silver);
  const [priceCopper, setPriceCopper] = useState(item.price_copper);

  // Filter players that have characters assigned
  const playersWithCharacters = players.filter(p => p.character_id && p.character);

  const handleSend = async () => {
    const player = playersWithCharacters.find(p => p.id === selectedPlayer);
    if (!player || !player.character_id) return;

    const transactionData: CreateTransactionData = {
      shop_id: shopId,
      shop_item_id: item.id,
      campaign_id: campaignId,
      buyer_user_id: player.user_id,
      buyer_character_id: player.character_id,
      quantity,
      price_gold: priceGold,
      price_silver: priceSilver,
      price_copper: priceCopper,
      item_data: {
        name: item.name,
        description: item.description || undefined,
        category: item.category || undefined,
        rarity: item.rarity,
      },
    };

    await createTransaction.mutateAsync(transactionData);
    onOpenChange(false);
    // Reset form
    setSelectedPlayer("");
    setQuantity(1);
    setPriceGold(item.price_gold);
    setPriceSilver(item.price_silver);
    setPriceCopper(item.price_copper);
  };

  const formatPrice = (gold: number, silver: number, copper: number) => {
    const parts = [];
    if (gold > 0) parts.push(`${gold} PO`);
    if (silver > 0) parts.push(`${silver} PP`);
    if (copper > 0) parts.push(`${copper} PC`);
    return parts.length > 0 ? parts.join(", ") : "Grátis";
  };

  const maxQuantity = item.quantity !== null ? item.quantity : 99;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Vender Item
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-60px)] mt-4">
          <div className="space-y-6 pb-6">
            {/* Item info */}
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Preço base: {formatPrice(item.price_gold, item.price_silver, item.price_copper)}
                  </p>
                  {item.quantity !== null && (
                    <p className="text-xs text-muted-foreground">
                      Estoque: {item.quantity}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Select player */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Jogador
              </Label>
              {playersWithCharacters.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl text-center">
                  Nenhum jogador com personagem na campanha
                </div>
              ) : (
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um jogador" />
                  </SelectTrigger>
                  <SelectContent>
                    {playersWithCharacters.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{player.character?.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({player.character?.class} Nv.{player.character?.level})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, maxQuantity))}
              />
            </div>

            {/* Custom price */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Preço (pode ajustar)
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Ouro (PO)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={priceGold}
                    onChange={(e) => setPriceGold(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prata (PP)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={priceSilver}
                    onChange={(e) => setPriceSilver(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cobre (PC)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={priceCopper}
                    onChange={(e) => setPriceCopper(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              {quantity > 1 && (
                <p className="text-xs text-muted-foreground">
                  Total: {formatPrice(priceGold * quantity, priceSilver * quantity, priceCopper * quantity)}
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
              <h4 className="font-medium mb-2">Resumo da Oferta</h4>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Item:</span>{" "}
                  {item.name} x{quantity}
                </p>
                <p>
                  <span className="text-muted-foreground">Preço total:</span>{" "}
                  <span className="text-gold">
                    {formatPrice(priceGold * quantity, priceSilver * quantity, priceCopper * quantity)}
                  </span>
                </p>
                {selectedPlayer && (
                  <p>
                    <span className="text-muted-foreground">Para:</span>{" "}
                    {playersWithCharacters.find(p => p.id === selectedPlayer)?.character?.name}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSend}
                disabled={!selectedPlayer || createTransaction.isPending}
              >
                {createTransaction.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Enviar Oferta
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
