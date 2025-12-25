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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shop, ShopItem, ShopItemFormData, useShopItems } from "@/hooks/useShops";
import { useCampaignTransactions } from "@/hooks/useShopTransactions";
import {
  Store,
  MapPin,
  User,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Eye,
  EyeOff,
  Coins,
  Package,
  X,
  ShoppingCart,
  BookOpen,
  History,
} from "lucide-react";
import { PredefinedItemsSheet } from "./PredefinedItemsSheet";
import { SellItemSheet } from "./SellItemSheet";
import { ShopTransactionHistory } from "./ShopTransactionHistory";

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

interface ShopDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shop: Shop;
  onEdit: () => void;
  onDelete: () => void;
  players?: CampaignPlayer[];
}

const RARITIES = [
  { value: "comum", label: "Comum", color: "bg-muted text-muted-foreground" },
  { value: "incomum", label: "Incomum", color: "bg-green-500/20 text-green-500" },
  { value: "raro", label: "Raro", color: "bg-blue-500/20 text-blue-500" },
  { value: "muito-raro", label: "Muito Raro", color: "bg-purple-500/20 text-purple-500" },
  { value: "lendario", label: "Lendário", color: "bg-gold/20 text-gold" },
  { value: "artefato", label: "Artefato", color: "bg-red-500/20 text-red-500" },
];

const CATEGORIES = [
  "Armas",
  "Armaduras",
  "Poções",
  "Pergaminhos",
  "Itens Mágicos",
  "Equipamentos",
  "Suprimentos",
  "Comida & Bebida",
  "Ferramentas",
  "Outros",
];

export function ShopDetailSheet({
  open,
  onOpenChange,
  shop,
  onEdit,
  onDelete,
  players = [],
}: ShopDetailSheetProps) {
  const { items, isLoading, createItem, updateItem, deleteItem } = useShopItems(shop.id);
  const { transactions } = useCampaignTransactions(shop.campaign_id, shop.id);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showPredefinedItems, setShowPredefinedItems] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [sellItem, setSellItem] = useState<ShopItem | null>(null);
  const [itemForm, setItemForm] = useState<ShopItemFormData>({
    name: "",
    description: "",
    price_gold: 0,
    price_silver: 0,
    price_copper: 0,
    quantity: null,
    category: "",
    rarity: "comum",
    is_available: true,
    notes: "",
  });

  const resetItemForm = () => {
    setItemForm({
      name: "",
      description: "",
      price_gold: 0,
      price_silver: 0,
      price_copper: 0,
      quantity: null,
      category: "",
      rarity: "comum",
      is_available: true,
      notes: "",
    });
    setEditingItem(null);
  };

  const handleAddItem = () => {
    resetItemForm();
    setShowItemForm(true);
  };

  const handleEditItem = (item: ShopItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || "",
      price_gold: item.price_gold,
      price_silver: item.price_silver,
      price_copper: item.price_copper,
      quantity: item.quantity,
      category: item.category || "",
      rarity: item.rarity,
      is_available: item.is_available,
      notes: item.notes || "",
    });
    setShowItemForm(true);
  };

  const handleSubmitItem = async () => {
    if (!itemForm.name.trim()) return;

    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, ...itemForm });
    } else {
      await createItem.mutateAsync(itemForm);
    }
    setShowItemForm(false);
    resetItemForm();
  };

  const handleDeleteItem = async (id: string) => {
    await deleteItem.mutateAsync(id);
  };

  const formatPrice = (gold: number, silver: number, copper: number) => {
    const parts = [];
    if (gold > 0) parts.push(`${gold} PO`);
    if (silver > 0) parts.push(`${silver} PP`);
    if (copper > 0) parts.push(`${copper} PC`);
    return parts.length > 0 ? parts.join(", ") : "Grátis";
  };

  const getRarityStyle = (rarity: string) => {
    return RARITIES.find((r) => r.value === rarity)?.color || RARITIES[0].color;
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || "Outros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShopItem[]>);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="flex items-center gap-2">
                      {shop.name}
                      {shop.is_hidden && (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </SheetTitle>
                    {shop.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {shop.location}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={onEdit}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tags */}
              {shop.tags && shop.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {shop.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* NPC */}
              {shop.npc && (
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  Lojista: <span className="text-foreground">{shop.npc.name}</span>
                </div>
              )}

              {/* Description */}
              {shop.description && (
                <p className="text-sm text-muted-foreground mt-3">
                  {shop.description}
                </p>
              )}
            </SheetHeader>

            {/* Items */}
            <ScrollArea className="flex-1 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Inventário ({items.length})
                </h3>
                <div className="flex gap-2">
                  {transactions.length > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => setShowHistory(true)}>
                      <History className="w-4 h-4 mr-1" />
                      {transactions.length}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setShowPredefinedItems(true)}>
                    <BookOpen className="w-4 h-4 mr-1" />
                    SRD
                  </Button>
                  <Button size="sm" onClick={handleAddItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    Novo
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhum item na loja</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleAddItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar primeiro item
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedItems).map(([category, categoryItems]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border ${
                              !item.is_available ? "opacity-50 bg-muted/30" : "bg-card"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.name}</span>
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${getRarityStyle(item.rarity)}`}
                                  >
                                    {RARITIES.find((r) => r.value === item.rarity)?.label}
                                  </Badge>
                                  {!item.is_available && (
                                    <Badge variant="outline" className="text-xs">
                                      Indisponível
                                    </Badge>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {item.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className="flex items-center gap-1 text-gold">
                                    <Coins className="w-3 h-3" />
                                    {formatPrice(item.price_gold, item.price_silver, item.price_copper)}
                                  </span>
                                  {item.quantity !== null && (
                                    <span className="text-muted-foreground">
                                      Estoque: {item.quantity}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {players.length > 0 && item.is_available && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary"
                                    onClick={() => setSellItem(item)}
                                  >
                                    <ShoppingCart className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditItem(item)}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Item Form Sheet */}
      <Sheet open={showItemForm} onOpenChange={setShowItemForm}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>
              {editingItem ? "Editar Item" : "Novo Item"}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Espada Longa +1"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={itemForm.description}
                onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Uma espada finamente trabalhada..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Ouro (PO)</Label>
                <Input
                  type="number"
                  min={0}
                  value={itemForm.price_gold}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, price_gold: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Prata (PP)</Label>
                <Input
                  type="number"
                  min={0}
                  value={itemForm.price_silver}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, price_silver: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Cobre (PC)</Label>
                <Input
                  type="number"
                  min={0}
                  value={itemForm.price_copper}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, price_copper: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={itemForm.category || ""}
                  onValueChange={(value) => setItemForm((prev) => ({ ...prev, category: value }))}
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
                  value={itemForm.rarity}
                  onValueChange={(value) => setItemForm((prev) => ({ ...prev, rarity: value }))}
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
              <Label>Quantidade em Estoque</Label>
              <Input
                type="number"
                min={0}
                value={itemForm.quantity ?? ""}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    quantity: e.target.value === "" ? null : parseInt(e.target.value),
                  }))
                }
                placeholder="Ilimitado"
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para estoque ilimitado
              </p>
            </div>

            <div className="space-y-2">
              <Label>Notas (visível apenas para o mestre)</Label>
              <Textarea
                value={itemForm.notes}
                onChange={(e) => setItemForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas secretas sobre este item..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <p className="text-sm font-medium">Disponível para venda</p>
                <p className="text-xs text-muted-foreground">
                  Desative para itens esgotados ou reservados
                </p>
              </div>
              <Switch
                checked={itemForm.is_available}
                onCheckedChange={(checked) =>
                  setItemForm((prev) => ({ ...prev, is_available: checked }))
                }
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowItemForm(false);
                  resetItemForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitItem}
                disabled={createItem.isPending || updateItem.isPending}
              >
                {(createItem.isPending || updateItem.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingItem ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Loja</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{shop.name}"? Todos os itens da loja
              também serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete();
                setShowDeleteDialog(false);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Predefined Items Sheet */}
      <PredefinedItemsSheet
        open={showPredefinedItems}
        onOpenChange={setShowPredefinedItems}
        onSelectItem={async (item) => {
          await createItem.mutateAsync(item);
        }}
      />

      {/* Sell Item Sheet */}
      {sellItem && (
        <SellItemSheet
          open={!!sellItem}
          onOpenChange={(open) => !open && setSellItem(null)}
          shopId={shop.id}
          shopName={shop.name}
          campaignId={shop.campaign_id}
          item={sellItem}
          players={players}
        />
      )}

      {/* Transaction History */}
      <ShopTransactionHistory
        open={showHistory}
        onOpenChange={setShowHistory}
        transactions={transactions}
        shopName={shop.name}
      />
    </>
  );
}
