import { useState, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Gift, 
  ArrowLeftRight, 
  Package, 
  Check, 
  X, 
  Loader2, 
  ChevronRight,
  User,
  CheckCircle2,
  Clock,
  Coins
} from "lucide-react";
import { useCharacterTrades, PlayerTrade, ItemData, CurrencyData } from "@/hooks/usePlayerTrades";
import { 
  FullCurrency, 
  currencyToCopper, 
  formatCurrency as formatCurrencyUtil, 
  formatCurrencyAsGold,
  hasEnoughCurrency,
  normalizeCurrency
} from "@/lib/currencyUtils";

interface PlayerTradeModalProps {
  characterId: string;
  characterInventory: any[];
  characterCurrency?: FullCurrency;
}

const RARITIES: Record<string, { label: string; color: string }> = {
  comum: { label: "Comum", color: "bg-muted text-muted-foreground" },
  incomum: { label: "Incomum", color: "bg-green-500/20 text-green-500" },
  raro: { label: "Raro", color: "bg-blue-500/20 text-blue-500" },
  "muito-raro": { label: "Muito Raro", color: "bg-purple-500/20 text-purple-500" },
  lendario: { label: "Lendário", color: "bg-gold/20 text-gold" },
  artefato: { label: "Artefato", color: "bg-red-500/20 text-red-500" },
};

export function PlayerTradeModal({ characterId, characterInventory, characterCurrency }: PlayerTradeModalProps) {
  const { 
    pendingTrades, 
    hasPendingTrades,
    acceptMasterGift,
    rejectTrade,
    selectReceiverItem,
    selectReceiverCurrency,
    confirmTrade,
    cancelTrade,
  } = useCharacterTrades(characterId);
  
  const [selectedTrade, setSelectedTrade] = useState<PlayerTrade | null>(null);
  const [selectingItem, setSelectingItem] = useState(false);
  const [selectingCurrency, setSelectingCurrency] = useState(false);
  const [offeredCurrency, setOfferedCurrency] = useState<FullCurrency>({ platinum: 0, gold: 0, silver: 0, copper: 0 });
  const [processing, setProcessing] = useState(false);

  const getRarityStyle = (rarity?: string) => {
    return RARITIES[rarity || "comum"] || RARITIES.comum;
  };

  // Determine if this character is the initiator or receiver
  const isInitiator = selectedTrade?.initiator_character_id === characterId;
  const isReceiver = selectedTrade?.receiver_character_id === characterId;

  // Items available for trade (not equipped)
  const tradableItems = useMemo(() => {
    return characterInventory.filter(item => !item.isEquipped && item.quantity > 0);
  }, [characterInventory]);

  // Check if initiator wants currency
  const initiatorWantsCurrency = selectedTrade?.initiator_item_data?.offer_type === 'currency';
  const requestedCurrency = (selectedTrade?.initiator_item_data as any)?.requested_currency as CurrencyData | undefined;

  const handleAcceptGift = async () => {
    if (!selectedTrade) return;
    setProcessing(true);
    try {
      await acceptMasterGift.mutateAsync(selectedTrade.id);
      setSelectedTrade(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTrade) return;
    setProcessing(true);
    try {
      await rejectTrade.mutateAsync(selectedTrade.id);
      setSelectedTrade(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectItem = async (item: any) => {
    if (!selectedTrade) return;
    setProcessing(true);
    try {
      await selectReceiverItem.mutateAsync({
        tradeId: selectedTrade.id,
        item_data: {
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
          rarity: item.rarity,
          quantity: 1,
        },
      });
      setSelectingItem(false);
      setSelectedTrade(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleOfferCurrency = async () => {
    if (!selectedTrade) return;
    
    // Check if player has enough currency using total copper comparison
    const playerCurrency = normalizeCurrency(characterCurrency);
    
    if (!hasEnoughCurrency(playerCurrency, offeredCurrency)) {
      return;
    }

    setProcessing(true);
    try {
      await selectReceiverCurrency.mutateAsync({
        tradeId: selectedTrade.id,
        currency: offeredCurrency,
      });
      setSelectingCurrency(false);
      setOfferedCurrency({ platinum: 0, gold: 0, silver: 0, copper: 0 });
      setSelectedTrade(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedTrade) return;
    setProcessing(true);
    try {
      await confirmTrade.mutateAsync({
        tradeId: selectedTrade.id,
        isInitiator,
      });
      setSelectedTrade(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedTrade) return;
    setProcessing(true);
    try {
      await cancelTrade.mutateAsync(selectedTrade.id);
      setSelectedTrade(null);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (currency?: CurrencyData) => {
    if (!currency) return '';
    return formatCurrencyUtil(normalizeCurrency(currency));
  };

  if (!hasPendingTrades) return null;

  const renderTradeContent = () => {
    if (!selectedTrade) return null;

    // Master gift or Player gift
    if (selectedTrade.trade_type === 'master_gift' || selectedTrade.trade_type === 'player_gift') {
      const isFromMaster = selectedTrade.trade_type === 'master_gift';
      return (
        <>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              {isFromMaster ? 'Presente do Mestre' : 'Presente de Jogador'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isFromMaster 
                ? 'O mestre está te enviando um item!'
                : `${selectedTrade.initiator_character?.name} quer te dar um item!`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 bg-muted/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{selectedTrade.initiator_item_data.name}</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getRarityStyle(selectedTrade.initiator_item_data.rarity).color}`}
                  >
                    {getRarityStyle(selectedTrade.initiator_item_data.rarity).label}
                  </Badge>
                </div>
                {selectedTrade.initiator_item_data.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTrade.initiator_item_data.description}
                  </p>
                )}
                {(selectedTrade.initiator_item_data.quantity ?? 1) > 1 && (
                  <p className="text-sm mt-1">Quantidade: {selectedTrade.initiator_item_data.quantity}</p>
                )}
              </div>
            </div>
          </div>

          <AlertDialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-destructive border-destructive/50"
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
              Recusar
            </Button>
            <Button className="flex-1" onClick={handleAcceptGift} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              Aceitar
            </Button>
          </AlertDialogFooter>
        </>
      );
    }

    // Player trade - waiting for receiver to select item or currency
    if (selectedTrade.status === 'pending_receiver' && isReceiver) {
      // Selecting currency
      if (selectingCurrency) {
        const playerGold = characterCurrency?.gold || 0;
        const playerSilver = characterCurrency?.silver || 0;
        const playerCopper = characterCurrency?.copper || 0;

        return (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Pagar com Moedas</AlertDialogTitle>
              <AlertDialogDescription>
                {requestedCurrency 
                  ? `Pedido: ${formatCurrency(requestedCurrency)}`
                  : 'Quanto você quer oferecer?'
                }
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 space-y-4">
              <div className="text-xs text-muted-foreground">
                Seu dinheiro: {playerGold} PO, {playerSilver} PP, {playerCopper} PC
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-amber-500">Ouro (PO)</Label>
                  <Input
                    type="number"
                    min="0"
                    max={playerGold}
                    value={offeredCurrency.gold || ''}
                    onChange={(e) => setOfferedCurrency(prev => ({
                      ...prev,
                      gold: Math.min(parseInt(e.target.value) || 0, playerGold)
                    }))}
                    className="text-center"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Prata (PP)</Label>
                  <Input
                    type="number"
                    min="0"
                    max={playerSilver}
                    value={offeredCurrency.silver || ''}
                    onChange={(e) => setOfferedCurrency(prev => ({
                      ...prev,
                      silver: Math.min(parseInt(e.target.value) || 0, playerSilver)
                    }))}
                    className="text-center"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-orange-700">Cobre (PC)</Label>
                  <Input
                    type="number"
                    min="0"
                    max={playerCopper}
                    value={offeredCurrency.copper || ''}
                    onChange={(e) => setOfferedCurrency(prev => ({
                      ...prev,
                      copper: Math.min(parseInt(e.target.value) || 0, playerCopper)
                    }))}
                    className="text-center"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <AlertDialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectingCurrency(false)} disabled={processing}>
                Voltar
              </Button>
              <Button 
                onClick={handleOfferCurrency} 
                disabled={processing || (!offeredCurrency.gold && !offeredCurrency.silver && !offeredCurrency.copper)}
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4 mr-1" />}
                Confirmar Pagamento
              </Button>
            </AlertDialogFooter>
          </>
        );
      }

      // Selecting item
      if (selectingItem) {
        return (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Selecione seu item para troca</AlertDialogTitle>
              <AlertDialogDescription>
                Escolha o item que deseja oferecer em troca
              </AlertDialogDescription>
            </AlertDialogHeader>

            <ScrollArea className="max-h-[300px] my-4">
              {tradableItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Você não tem itens disponíveis para troca
                </div>
              ) : (
                <div className="space-y-2">
                  {tradableItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      disabled={processing}
                      className="w-full p-3 rounded-xl border border-border hover:border-primary/50 text-left transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.quantity > 1 && (
                              <span className="text-xs text-muted-foreground ml-2">x{item.quantity}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setSelectingItem(false)} disabled={processing}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing}>
                Recusar Troca
              </Button>
            </AlertDialogFooter>
          </>
        );
      }

      // Main trade proposal view
      return (
        <>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {initiatorWantsCurrency ? (
                <Coins className="w-5 h-5 text-amber-500" />
              ) : (
                <ArrowLeftRight className="w-5 h-5 text-primary" />
              )}
              {initiatorWantsCurrency ? 'Proposta de Venda' : 'Proposta de Troca'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTrade.initiator_character?.name} quer {initiatorWantsCurrency ? 'vender' : 'trocar'} com você
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <p className="text-xs text-muted-foreground mb-2">Item oferecido:</p>
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{selectedTrade.initiator_item_data.name}</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getRarityStyle(selectedTrade.initiator_item_data.rarity).color}`}
                >
                  {getRarityStyle(selectedTrade.initiator_item_data.rarity).label}
                </Badge>
              </div>
              {selectedTrade.initiator_item_data.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTrade.initiator_item_data.description}
                </p>
              )}
            </div>

            {initiatorWantsCurrency && requestedCurrency && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm">
                  <span className="text-muted-foreground">Preço pedido: </span>
                  <span className="font-semibold">{formatCurrency(requestedCurrency)}</span>
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter className="flex flex-col gap-2">
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={handleReject} disabled={processing}>
                Recusar
              </Button>
              {initiatorWantsCurrency ? (
                <Button className="flex-1" onClick={() => {
                  if (requestedCurrency) {
                    setOfferedCurrency(requestedCurrency);
                  }
                  setSelectingCurrency(true);
                }} disabled={processing}>
                  <Coins className="w-4 h-4 mr-2" />
                  Pagar
                </Button>
              ) : (
                <Button className="flex-1" onClick={() => setSelectingItem(true)} disabled={processing}>
                  Selecionar Item
                </Button>
              )}
            </div>
            {!initiatorWantsCurrency && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setSelectingCurrency(true)} 
                disabled={processing}
              >
                <Coins className="w-4 h-4 mr-2" />
                Oferecer Dinheiro
              </Button>
            )}
          </AlertDialogFooter>
        </>
      );
    }

    // Player trade - pending confirmations
    if (selectedTrade.status === 'pending_confirmations') {
      const myConfirmed = isInitiator ? selectedTrade.initiator_confirmed : selectedTrade.receiver_confirmed;
      const receiverOffersCurrency = selectedTrade.receiver_item_data?.offer_type === 'currency';
      const receiverCurrency = selectedTrade.receiver_item_data?.currency as CurrencyData | undefined;

      return (
        <>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
              Confirmar Troca
            </AlertDialogTitle>
            <AlertDialogDescription>
              Revise os itens e confirme a troca
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 space-y-4">
            {/* Initiator's item */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {selectedTrade.initiator_character?.name} oferece:
                </p>
                {selectedTrade.initiator_confirmed && (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                )}
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{selectedTrade.initiator_item_data.name}</span>
                  <Badge variant="secondary" className={`text-xs ${getRarityStyle(selectedTrade.initiator_item_data.rarity).color}`}>
                    {getRarityStyle(selectedTrade.initiator_item_data.rarity).label}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Receiver's offer */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {selectedTrade.receiver_character?.name} oferece:
                </p>
                {selectedTrade.receiver_confirmed && (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                )}
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                {receiverOffersCurrency ? (
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="font-medium">{formatCurrency(receiverCurrency)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{selectedTrade.receiver_item_data?.name}</span>
                    <Badge variant="secondary" className={`text-xs ${getRarityStyle(selectedTrade.receiver_item_data?.rarity).color}`}>
                      {getRarityStyle(selectedTrade.receiver_item_data?.rarity).label}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 text-sm">
              {myConfirmed ? (
                <span className="text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Você confirmou
                </span>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Aguardando sua confirmação
                </span>
              )}
            </div>
          </div>

          <AlertDialogFooter className="flex gap-2">
            {isInitiator && !myConfirmed && (
              <Button variant="outline" onClick={handleCancel} disabled={processing}>
                Cancelar
              </Button>
            )}
            {!isInitiator && !myConfirmed && (
              <Button variant="outline" onClick={handleReject} disabled={processing}>
                Recusar
              </Button>
            )}
            {!myConfirmed && (
              <Button className="flex-1" onClick={handleConfirm} disabled={processing}>
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                Confirmar Troca
              </Button>
            )}
            {myConfirmed && (
              <Button variant="outline" className="flex-1" onClick={() => setSelectedTrade(null)}>
                Aguardando outro jogador...
              </Button>
            )}
          </AlertDialogFooter>
        </>
      );
    }

    return null;
  };

  return (
    <>
      {/* Floating indicator */}
      <div 
        className="fixed bottom-20 left-4 z-50 animate-bounce cursor-pointer"
        onClick={() => setSelectedTrade(pendingTrades[0])}
      >
        <div className="relative bg-amber-500 text-white rounded-full p-3 shadow-lg">
          <ArrowLeftRight className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {pendingTrades.length}
          </span>
        </div>
      </div>

      {/* Trade modal */}
      <AlertDialog open={!!selectedTrade} onOpenChange={() => {
        setSelectedTrade(null);
        setSelectingItem(false);
        setSelectingCurrency(false);
        setOfferedCurrency({ gold: 0, silver: 0, copper: 0 });
      }}>
        <AlertDialogContent className="max-w-md">
          {renderTradeContent()}

          {/* More trades indicator */}
          {pendingTrades.length > 1 && (
            <div className="text-center text-xs text-muted-foreground mt-2">
              + {pendingTrades.length - 1} outra(s) troca(s) pendente(s)
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
