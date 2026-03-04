import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coins, Package, Check, X, Clock, Ban, User } from "lucide-react";
import { ShopTransaction } from "@/hooks/useShopTransactions";

interface ShopTransactionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: ShopTransaction[];
  shopName: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { 
    label: "Pendente", 
    color: "bg-gold/20 text-gold border-gold/30",
    icon: <Clock className="w-3 h-3" />,
  },
  accepted: { 
    label: "Aceito", 
    color: "bg-secondary/20 text-secondary border-secondary/30",
    icon: <Check className="w-3 h-3" />,
  },
  rejected: { 
    label: "Recusado", 
    color: "bg-destructive/20 text-destructive border-destructive/30",
    icon: <X className="w-3 h-3" />,
  },
  cancelled: { 
    label: "Cancelado", 
    color: "bg-muted text-muted-foreground border-muted",
    icon: <Ban className="w-3 h-3" />,
  },
};

const RARITIES: Record<string, { label: string; color: string }> = {
  comum: { label: "Comum", color: "bg-muted text-muted-foreground" },
  incomum: { label: "Incomum", color: "bg-secondary/20 text-secondary" },
  raro: { label: "Raro", color: "bg-primary/20 text-primary" },
  "muito-raro": { label: "Muito Raro", color: "bg-accent-foreground/20 text-accent-foreground" },
  lendario: { label: "Lendário", color: "bg-gold/20 text-gold" },
  artefato: { label: "Artefato", color: "bg-destructive/20 text-destructive" },
};

export function ShopTransactionHistory({
  open,
  onOpenChange,
  transactions,
  shopName,
}: ShopTransactionHistoryProps) {
  const formatPrice = (gold: number, silver: number, copper: number) => {
    const parts = [];
    if (gold > 0) parts.push(`${gold} PO`);
    if (silver > 0) parts.push(`${silver} PP`);
    if (copper > 0) parts.push(`${copper} PC`);
    return parts.length > 0 ? parts.join(", ") : "Grátis";
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMM yyyy, HH:mm", { locale: ptBR });
  };

  const getRarityStyle = (rarity?: string) => {
    return RARITIES[rarity || "comum"] || RARITIES.comum;
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  // Group transactions by date
  const groupedByDate = transactions.reduce((acc, tx) => {
    const date = format(new Date(tx.created_at), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, ShopTransaction[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Histórico de Transações
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {shopName} • {transactions.length} transação(ões)
            </p>
          </SheetHeader>

          <ScrollArea className="flex-1 p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhuma transação registrada</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDates.map((date) => (
                  <div key={date}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                      {format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </h4>
                    <div className="space-y-3">
                      {groupedByDate[date].map((tx) => {
                        const statusConfig = getStatusConfig(tx.status);
                        const rarityStyle = getRarityStyle(tx.item_data.rarity);
                        
                        return (
                          <div
                            key={tx.id}
                            className="bg-card rounded-xl p-4 border border-border"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{tx.item_data.name}</span>
                                  {tx.quantity > 1 && (
                                    <Badge variant="outline" className="text-xs">
                                      x{tx.quantity}
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${rarityStyle.color}`}
                                  >
                                    {rarityStyle.label}
                                  </Badge>
                                </div>
                                
                                {tx.character?.name && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <User className="w-3 h-3" />
                                    {tx.character.name}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className="flex items-center gap-1 text-gold">
                                    <Coins className="w-3 h-3" />
                                    {formatPrice(tx.price_gold, tx.price_silver, tx.price_copper)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(tx.created_at), "HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
                              </div>
                              
                              <Badge
                                variant="outline"
                                className={`flex items-center gap-1 ${statusConfig.color}`}
                              >
                                {statusConfig.icon}
                                {statusConfig.label}
                              </Badge>
                            </div>
                            
                            {tx.responded_at && tx.status !== 'pending' && (
                              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                                {tx.status === 'accepted' ? 'Aceito' : tx.status === 'rejected' ? 'Recusado' : 'Cancelado'} em {formatDate(tx.responded_at)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}