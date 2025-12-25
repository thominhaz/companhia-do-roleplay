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
  Clock
} from "lucide-react";
import { useCharacterTrades, PlayerTrade, ItemData } from "@/hooks/usePlayerTrades";

interface PlayerTradeModalProps {
  characterId: string;
  characterInventory: any[];
}

const RARITIES: Record<string, { label: string; color: string }> = {
  comum: { label: "Comum", color: "bg-muted text-muted-foreground" },
  incomum: { label: "Incomum", color: "bg-green-500/20 text-green-500" },
  raro: { label: "Raro", color: "bg-blue-500/20 text-blue-500" },
  "muito-raro": { label: "Muito Raro", color: "bg-purple-500/20 text-purple-500" },
  lendario: { label: "Lendário", color: "bg-gold/20 text-gold" },
  artefato: { label: "Artefato", color: "bg-red-500/20 text-red-500" },
};

export function PlayerTradeModal({ characterId, characterInventory }: PlayerTradeModalProps) {
  const { 
    pendingTrades, 
    hasPendingTrades,
    acceptMasterGift,
    rejectTrade,
    selectReceiverItem,
    confirmTrade,
    cancelTrade,
  } = useCharacterTrades(characterId);
  
  const [selectedTrade, setSelectedTrade] = useState<PlayerTrade | null>(null);
  const [selectingItem, setSelectingItem] = useState(false);
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

  if (!hasPendingTrades) return null;

  const renderTradeContent = () => {
    if (!selectedTrade) return null;

    // Master gift
    if (selectedTrade.trade_type === 'master_gift') {
      return (
        <>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Presente do Mestre
            </AlertDialogTitle>
            <AlertDialogDescription>
              O mestre está te enviando um item!
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

    // Player trade - waiting for receiver to select item
    if (selectedTrade.status === 'pending_receiver' && isReceiver) {
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

      return (
        <>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
              Proposta de Troca
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTrade.initiator_character?.name} quer trocar com você
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
          </div>

          <AlertDialogFooter className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleReject} disabled={processing}>
              Recusar
            </Button>
            <Button className="flex-1" onClick={() => setSelectingItem(true)} disabled={processing}>
              Selecionar Item
            </Button>
          </AlertDialogFooter>
        </>
      );
    }

    // Player trade - pending confirmations
    if (selectedTrade.status === 'pending_confirmations') {
      const myConfirmed = isInitiator ? selectedTrade.initiator_confirmed : selectedTrade.receiver_confirmed;
      const otherConfirmed = isInitiator ? selectedTrade.receiver_confirmed : selectedTrade.initiator_confirmed;

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

            {/* Receiver's item */}
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
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedTrade.receiver_item_data?.name}</span>
                  <Badge variant="secondary" className={`text-xs ${getRarityStyle(selectedTrade.receiver_item_data?.rarity).color}`}>
                    {getRarityStyle(selectedTrade.receiver_item_data?.rarity).label}
                  </Badge>
                </div>
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