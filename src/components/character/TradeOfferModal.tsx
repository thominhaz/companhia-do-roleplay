import { useState } from "react";
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
import { Coins, Package, Store, Check, X, Loader2, AlertTriangle } from "lucide-react";
import { useCharacterPendingOffers, ShopTransaction } from "@/hooks/useShopTransactions";

interface TradeOfferModalProps {
  characterId: string;
  characterCurrency: {
    gold: number;
    silver: number;
    copper: number;
  };
}

const RARITIES: Record<string, { label: string; color: string }> = {
  comum: { label: "Comum", color: "bg-muted text-muted-foreground" },
  incomum: { label: "Incomum", color: "bg-green-500/20 text-green-500" },
  raro: { label: "Raro", color: "bg-blue-500/20 text-blue-500" },
  "muito-raro": { label: "Muito Raro", color: "bg-purple-500/20 text-purple-500" },
  lendario: { label: "Lendário", color: "bg-gold/20 text-gold" },
  artefato: { label: "Artefato", color: "bg-red-500/20 text-red-500" },
};

export function TradeOfferModal({ characterId, characterCurrency }: TradeOfferModalProps) {
  const { offers, respondToOffer, hasOffers } = useCharacterPendingOffers(characterId);
  const [selectedOffer, setSelectedOffer] = useState<ShopTransaction | null>(null);
  const [processing, setProcessing] = useState(false);

  if (!hasOffers) return null;

  const formatPrice = (gold: number, silver: number, copper: number) => {
    const parts = [];
    if (gold > 0) parts.push(`${gold} PO`);
    if (silver > 0) parts.push(`${silver} PP`);
    if (copper > 0) parts.push(`${copper} PC`);
    return parts.length > 0 ? parts.join(", ") : "Grátis";
  };

  // Convert all to copper for comparison
  const toCopper = (gold: number, silver: number, copper: number) => 
    gold * 100 + silver * 10 + copper;

  const playerTotalCopper = toCopper(
    characterCurrency.gold || 0,
    characterCurrency.silver || 0,
    characterCurrency.copper || 0
  );

  const canAfford = (offer: ShopTransaction) => {
    const priceCopper = toCopper(offer.price_gold, offer.price_silver, offer.price_copper);
    return playerTotalCopper >= priceCopper;
  };

  const calculateNewCurrency = (offer: ShopTransaction) => {
    const priceCopper = toCopper(offer.price_gold, offer.price_silver, offer.price_copper);
    const newTotalCopper = playerTotalCopper - priceCopper;
    
    return {
      gold: Math.floor(newTotalCopper / 100),
      silver: Math.floor((newTotalCopper % 100) / 10),
      copper: newTotalCopper % 10,
    };
  };

  const handleAccept = async (offer: ShopTransaction) => {
    if (!canAfford(offer)) {
      return;
    }

    setProcessing(true);
    try {
      const newCurrency = calculateNewCurrency(offer);
      await respondToOffer.mutateAsync({
        transactionId: offer.id,
        accept: true,
        characterCurrency,
        newCurrency,
      });
      setSelectedOffer(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (offer: ShopTransaction) => {
    setProcessing(true);
    try {
      await respondToOffer.mutateAsync({
        transactionId: offer.id,
        accept: false,
      });
      setSelectedOffer(null);
    } finally {
      setProcessing(false);
    }
  };

  const getRarityStyle = (rarity?: string) => {
    return RARITIES[rarity || "comum"] || RARITIES.comum;
  };

  return (
    <>
      {/* Floating indicator */}
      <div 
        className="fixed bottom-20 right-4 z-50 animate-bounce cursor-pointer"
        onClick={() => setSelectedOffer(offers[0])}
      >
        <div className="relative bg-primary text-primary-foreground rounded-full p-3 shadow-lg">
          <Store className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {offers.length}
          </span>
        </div>
      </div>

      {/* Offer detail modal */}
      <AlertDialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Oferta de Compra
            </AlertDialogTitle>
            {selectedOffer?.shop?.name && (
              <AlertDialogDescription>
                Oferta da loja: {selectedOffer.shop.name}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>

          {selectedOffer && (
            <div className="space-y-4">
              {/* Item info */}
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{selectedOffer.item_data.name}</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getRarityStyle(selectedOffer.item_data.rarity).color}`}
                      >
                        {getRarityStyle(selectedOffer.item_data.rarity).label}
                      </Badge>
                    </div>
                    {selectedOffer.item_data.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedOffer.item_data.description}
                      </p>
                    )}
                    {selectedOffer.quantity > 1 && (
                      <p className="text-sm mt-1">Quantidade: {selectedOffer.quantity}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Preço:</span>
                  <span className="flex items-center gap-1 text-gold font-semibold">
                    <Coins className="w-4 h-4" />
                    {formatPrice(
                      selectedOffer.price_gold,
                      selectedOffer.price_silver,
                      selectedOffer.price_copper
                    )}
                  </span>
                </div>
              </div>

              {/* Player currency */}
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Seu dinheiro:</span>
                  <span>
                    {characterCurrency.gold || 0} PO, {characterCurrency.silver || 0} PP, {characterCurrency.copper || 0} PC
                  </span>
                </div>
                {canAfford(selectedOffer) ? (
                  <div className="flex items-center justify-between text-sm mt-2 text-green-500">
                    <span>Após compra:</span>
                    <span>
                      {(() => {
                        const newCurrency = calculateNewCurrency(selectedOffer);
                        return `${newCurrency.gold} PO, ${newCurrency.silver} PP, ${newCurrency.copper} PC`;
                      })()}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Dinheiro insuficiente!
                  </div>
                )}
              </div>
            </div>
          )}

          <AlertDialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-destructive border-destructive/50"
              onClick={() => selectedOffer && handleReject(selectedOffer)}
              disabled={processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
              Recusar
            </Button>
            <Button
              className="flex-1"
              onClick={() => selectedOffer && handleAccept(selectedOffer)}
              disabled={processing || (selectedOffer && !canAfford(selectedOffer))}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Aceitar
                </>
              )}
            </Button>
          </AlertDialogFooter>

          {/* More offers indicator */}
          {offers.length > 1 && (
            <div className="text-center text-xs text-muted-foreground">
              + {offers.length - 1} outra(s) oferta(s)
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
