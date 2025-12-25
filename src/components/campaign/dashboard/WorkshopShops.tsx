import { useState } from "react";
import { CampaignDB } from "@/hooks/useCampaigns";
import { useShops, Shop, ShopFormData } from "@/hooks/useShops";
import { ShopFormSheet } from "./ShopFormSheet";
import { ShopDetailSheet } from "./ShopDetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Plus,
  Search,
  MapPin,
  User,
  EyeOff,
  Loader2,
  Package,
} from "lucide-react";

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
}

interface WorkshopShopsProps {
  campaign: CampaignDB;
  players?: CampaignPlayer[];
}

export function WorkshopShops({ campaign, players = [] }: WorkshopShopsProps) {
  const { shops, isLoading, createShop, updateShop, deleteShop } = useShops(campaign.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  const handleCreateShop = async (data: ShopFormData) => {
    await createShop.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdateShop = async (data: ShopFormData) => {
    if (!editingShop) return;
    await updateShop.mutateAsync({ id: editingShop.id, ...data });
    setEditingShop(null);
  };

  const handleDeleteShop = async () => {
    if (!selectedShop) return;
    await deleteShop.mutateAsync(selectedShop.id);
    setSelectedShop(null);
  };

  const handleEditFromDetail = () => {
    if (selectedShop) {
      setEditingShop(selectedShop);
      setSelectedShop(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Store className="w-5 h-5" />
            Oficina de Lojas
          </h2>
          <p className="text-sm text-muted-foreground">
            Crie mercadores e lojas para sua campanha
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Nova Loja
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar lojas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Shops List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 border border-dashed border-border text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-primary/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? "Nenhuma loja encontrada" : "Nenhuma loja criada"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            {searchQuery
              ? "Tente buscar com outros termos"
              : "Crie sua primeira loja para organizar o comércio da sua campanha."}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Criar Loja
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredShops.map((shop) => (
            <div
              key={shop.id}
              onClick={() => setSelectedShop(shop)}
              className="bg-card rounded-xl p-4 border border-border hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold truncate">{shop.name}</h4>
                    {shop.is_hidden && (
                      <EyeOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  {shop.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {shop.location}
                    </p>
                  )}
                  {shop.npc && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" />
                      {shop.npc.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              {shop.tags && shop.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {shop.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {shop.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{shop.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Sheet */}
      <ShopFormSheet
        open={showForm || !!editingShop}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingShop(null);
          }
        }}
        campaignId={campaign.id}
        shop={editingShop}
        onSubmit={editingShop ? handleUpdateShop : handleCreateShop}
        isLoading={createShop.isPending || updateShop.isPending}
      />

      {/* Detail Sheet */}
      {selectedShop && (
        <ShopDetailSheet
          open={!!selectedShop}
          onOpenChange={(open) => !open && setSelectedShop(null)}
          shop={selectedShop}
          onEdit={handleEditFromDetail}
          onDelete={handleDeleteShop}
          players={players}
        />
      )}
    </div>
  );
}
