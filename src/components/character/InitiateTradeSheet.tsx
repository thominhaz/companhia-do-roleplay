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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowRightLeft, 
  Loader2, 
  User, 
  Package, 
  CheckCircle2, 
  Gift, 
  Coins,
  ArrowRight
} from "lucide-react";
import { useCharacterTrades, ItemData, CurrencyData } from "@/hooks/usePlayerTrades";
import { 
  FullCurrency, 
  currencyToCopper, 
  formatCurrency as formatCurrencyUtil, 
  formatCurrencyAsGold 
} from "@/lib/currencyUtils";

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

type TradeType = 'item' | 'currency' | 'gift';
type Step = 'player' | 'item' | 'type' | 'currency';

export function InitiateTradeSheet({
  open,
  onOpenChange,
  campaignId,
  characterId,
  characterInventory,
  campaignPlayers,
}: InitiateTradeSheetProps) {
  const { initiateTrade } = useCharacterTrades(characterId);
  const [step, setStep] = useState<Step>('player');
  const [selectedPlayer, setSelectedPlayer] = useState<CampaignPlayer | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [tradeType, setTradeType] = useState<TradeType>('item');
  const [requestedCurrency, setRequestedCurrency] = useState<FullCurrency>({
    platinum: 0,
    gold: 0,
    silver: 0,
    copper: 0,
  });

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
      offer_type: tradeType,
      requested_currency: tradeType === 'currency' ? requestedCurrency : undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setStep('player');
    setSelectedPlayer(null);
    setSelectedItem(null);
    setTradeType('item');
    setRequestedCurrency({ platinum: 0, gold: 0, silver: 0, copper: 0 });
    onOpenChange(false);
  };

  const handlePlayerSelect = (player: CampaignPlayer) => {
    setSelectedPlayer(player);
    setStep('item');
  };

  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItem(item);
    setStep('type');
  };

  const handleTradeTypeSelect = (type: TradeType) => {
    setTradeType(type);
    if (type === 'currency') {
      setStep('currency');
    }
  };

  const handleBack = () => {
    if (step === 'currency') {
      setStep('type');
    } else if (step === 'type') {
      setStep('item');
      setSelectedItem(null);
    } else if (step === 'item') {
      setStep('player');
      setSelectedPlayer(null);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'player': return 'Propor Troca';
      case 'item': return 'Selecionar Item';
      case 'type': return 'Tipo de Troca';
      case 'currency': return 'Definir Valor';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'player': return 'Escolha um jogador para propor uma troca';
      case 'item': return `Trocar com ${selectedPlayer?.character?.name}`;
      case 'type': return 'O que você quer em troca?';
      case 'currency': return 'Quanto você quer receber?';
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            {getStepTitle()}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {getStepDescription()}
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-8rem)] mt-6">
          {step === 'player' && (
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
          )}

          {step === 'item' && (
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
                      onClick={() => handleItemSelect(item)}
                      className="p-4 rounded-xl border border-border hover:border-primary/50 text-left transition-all"
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
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'type' && (
            <div className="space-y-4 pr-4">
              {/* Selected item summary */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{selectedItem?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Para {selectedPlayer?.character?.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {/* Gift option */}
                <button
                  onClick={() => handleTradeTypeSelect('gift')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    tradeType === 'gift'
                      ? "border-green-500 bg-green-500/10"
                      : "border-border hover:border-green-500/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Gift className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Presente</p>
                      <p className="text-sm text-muted-foreground">
                        Entregar o item sem pedir nada em troca
                      </p>
                    </div>
                    {tradeType === 'gift' && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </button>

                {/* Item trade option */}
                <button
                  onClick={() => handleTradeTypeSelect('item')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    tradeType === 'item'
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <ArrowRightLeft className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Trocar por Item</p>
                      <p className="text-sm text-muted-foreground">
                        Pedir um item em troca
                      </p>
                    </div>
                    {tradeType === 'item' && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </button>

                {/* Currency trade option */}
                <button
                  onClick={() => handleTradeTypeSelect('currency')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    tradeType === 'currency'
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-border hover:border-amber-500/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Coins className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Vender por Moedas</p>
                      <p className="text-sm text-muted-foreground">
                        Pedir dinheiro em troca
                      </p>
                    </div>
                    {tradeType === 'currency' && (
                      <CheckCircle2 className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 'currency' && (
            <div className="space-y-6 pr-4">
              {/* Selected item summary */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{selectedItem?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Vendendo para {selectedPlayer?.character?.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Quanto você quer receber?</Label>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-amber-500 flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      Ouro (PO)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={requestedCurrency.gold || ''}
                      onChange={(e) => setRequestedCurrency(prev => ({
                        ...prev,
                        gold: parseInt(e.target.value) || 0
                      }))}
                      className="text-center"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400 flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-slate-400" />
                      Prata (PP)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={requestedCurrency.silver || ''}
                      onChange={(e) => setRequestedCurrency(prev => ({
                        ...prev,
                        silver: parseInt(e.target.value) || 0
                      }))}
                      className="text-center"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-orange-700 flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-orange-700" />
                      Cobre (PC)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={requestedCurrency.copper || ''}
                      onChange={(e) => setRequestedCurrency(prev => ({
                        ...prev,
                        copper: parseInt(e.target.value) || 0
                      }))}
                      className="text-center"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Total preview */}
                {(requestedCurrency.gold || requestedCurrency.silver || requestedCurrency.copper) ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm text-center">
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-semibold">
                        {requestedCurrency.gold ? `${requestedCurrency.gold} PO ` : ''}
                        {requestedCurrency.silver ? `${requestedCurrency.silver} PP ` : ''}
                        {requestedCurrency.copper ? `${requestedCurrency.copper} PC` : ''}
                      </span>
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-3 pt-4 border-t mt-4">
          {step !== 'player' && (
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
          {(step === 'type' && (tradeType === 'gift' || tradeType === 'item')) && (
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!selectedItem || initiateTrade.isPending}
            >
              {initiateTrade.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : tradeType === 'gift' ? (
                <Gift className="w-4 h-4 mr-2" />
              ) : (
                <ArrowRightLeft className="w-4 h-4 mr-2" />
              )}
              {tradeType === 'gift' ? 'Enviar Presente' : 'Propor Troca'}
            </Button>
          )}
          {step === 'currency' && (
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={
                !selectedItem || 
                initiateTrade.isPending ||
                (!requestedCurrency.gold && !requestedCurrency.silver && !requestedCurrency.copper)
              }
            >
              {initiateTrade.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Coins className="w-4 h-4 mr-2" />
              )}
              Propor Venda
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
