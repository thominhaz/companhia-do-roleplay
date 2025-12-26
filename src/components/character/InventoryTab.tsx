import { useState } from "react";
import { 
  Backpack, 
  Package, 
  ArrowRightLeft, 
  Coins, 
  Search,
  Plus,
  Sword,
  Shield as ShieldIcon,
  Shirt,
  CircleDot,
  ChevronRight,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VisualEquipmentDisplay } from "./VisualEquipmentDisplay";
import { InventoryManagementSheet } from "./InventoryManagementSheet";
import { InitiateTradeSheet } from "./InitiateTradeSheet";

interface InventoryTabProps {
  character: any;
  characterCampaign?: any;
  campaignPlayers?: any[];
}

const RARITY_COLORS: Record<string, string> = {
  comum: "text-muted-foreground",
  incomum: "text-green-400",
  raro: "text-blue-400",
  "muito raro": "text-purple-400",
  lendário: "text-orange-400",
  artefato: "text-red-400",
};

function ItemCard({ item, onSelect }: { item: any; onSelect?: () => void }) {
  const isEquipped = item.isEquipped;
  const rarityColor = RARITY_COLORS[item.rarity?.toLowerCase()] || "text-muted-foreground";
  
  // Determine icon based on item type
  const getItemIcon = () => {
    const type = item.type?.toLowerCase() || item.category?.toLowerCase() || "";
    if (type.includes("weapon") || type.includes("arma")) return Sword;
    if (type.includes("armor") || type.includes("armadura")) return Shirt;
    if (type.includes("shield") || type.includes("escudo")) return ShieldIcon;
    return Package;
  };
  
  const Icon = getItemIcon();
  
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200
        ${isEquipped 
          ? "bg-primary/10 border border-primary/30 hover:bg-primary/20" 
          : "bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50"
        }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
        ${isEquipped ? "bg-primary/20" : "bg-muted/50"}`}
      >
        <Icon className={`w-5 h-5 ${isEquipped ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{item.name}</span>
          {isEquipped && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary text-primary">
              Equipado
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {item.quantity && item.quantity > 1 && (
            <span className="text-xs text-muted-foreground">x{item.quantity}</span>
          )}
          {item.rarity && (
            <span className={`text-[10px] ${rarityColor}`}>{item.rarity}</span>
          )}
          {item.damage && (
            <span className="text-[10px] text-red-400">{item.damage}</span>
          )}
          {item.armorClass && (
            <span className="text-[10px] text-blue-400">CA +{item.armorClass}</span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

export function InventoryTab({ character, characterCampaign, campaignPlayers }: InventoryTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("equipar");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInventorySheet, setShowInventorySheet] = useState(false);
  const [showTradeSheet, setShowTradeSheet] = useState(false);
  
  const equipment = (character.equipment as any[]) || [];
  const inventory = (character.inventory as any[]) || [];
  const currency = character.currency as any || {};
  
  // Combine and categorize items
  const allItems = [
    ...equipment.map(item => ({ ...item, source: 'equipment' })),
    ...inventory.map(item => ({ ...item, source: 'inventory' })),
  ];
  
  const filteredItems = allItems.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const equippedItems = filteredItems.filter(item => item.isEquipped);
  const unequippedItems = filteredItems.filter(item => !item.isEquipped);
  
  // Currency display
  const currencies = [
    { key: 'platinum', label: 'Platina', abbr: 'PL', color: 'text-slate-300', value: currency.platinum || 0 },
    { key: 'gold', label: 'Ouro', abbr: 'PO', color: 'text-yellow-400', value: currency.gold || 0 },
    { key: 'electrum', label: 'Electrum', abbr: 'PE', color: 'text-cyan-400', value: currency.electrum || 0 },
    { key: 'silver', label: 'Prata', abbr: 'PP', color: 'text-gray-400', value: currency.silver || 0 },
    { key: 'copper', label: 'Cobre', abbr: 'PC', color: 'text-orange-500', value: currency.copper || 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Currency Bar */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            Moedas
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => setShowInventorySheet(true)}
          >
            Gerenciar
          </Button>
        </div>
        <div className="flex gap-2">
          {currencies.map(({ key, abbr, color, value }) => (
            <div key={key} className="flex-1 text-center bg-muted/30 rounded-xl p-2">
              <p className={`text-sm font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-muted-foreground">{abbr}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="w-full grid grid-cols-3 bg-muted/30 p-1 rounded-xl">
          <TabsTrigger value="equipar" className="rounded-lg data-[state=active]:bg-card">
            <Shirt className="w-4 h-4 mr-1.5" />
            Equipar
          </TabsTrigger>
          <TabsTrigger value="inventario" className="rounded-lg data-[state=active]:bg-card">
            <Backpack className="w-4 h-4 mr-1.5" />
            Itens
          </TabsTrigger>
          <TabsTrigger value="trocas" className="rounded-lg data-[state=active]:bg-card">
            <ArrowRightLeft className="w-4 h-4 mr-1.5" />
            Trocas
          </TabsTrigger>
        </TabsList>

        {/* Equipment Visual Tab */}
        <TabsContent value="equipar" className="mt-4">
          <VisualEquipmentDisplay character={character} />
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventario" className="mt-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar itens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/30"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setShowInventorySheet(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Adicionar Item
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {/* Equipped Section */}
              {equippedItems.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                    <CircleDot className="w-3 h-3" />
                    Equipados ({equippedItems.length})
                  </h4>
                  <div className="space-y-2">
                    {equippedItems.map((item, i) => (
                      <ItemCard 
                        key={item.id || i} 
                        item={item}
                        onSelect={() => setShowInventorySheet(true)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Unequipped Section */}
              {unequippedItems.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    Inventário ({unequippedItems.length})
                  </h4>
                  <div className="space-y-2">
                    {unequippedItems.map((item, i) => (
                      <ItemCard 
                        key={item.id || i} 
                        item={item}
                        onSelect={() => setShowInventorySheet(true)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setShowInventorySheet(true)}
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Adicionar Item
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Trades Tab */}
        <TabsContent value="trocas" className="mt-4">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 text-center">
            <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold mb-2">Sistema de Trocas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {characterCampaign 
                ? "Inicie uma troca com outros jogadores da campanha"
                : "Entre em uma campanha para trocar itens com outros jogadores"
              }
            </p>
            {characterCampaign && campaignPlayers && campaignPlayers.length > 1 && (
              <Button onClick={() => setShowTradeSheet(true)}>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Propor Troca
              </Button>
            )}
            {(!characterCampaign || !campaignPlayers || campaignPlayers.length <= 1) && (
              <p className="text-xs text-muted-foreground mt-2">
                Não há outros jogadores disponíveis para troca
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Sheets */}
      <InventoryManagementSheet
        open={showInventorySheet}
        onOpenChange={setShowInventorySheet}
        character={character}
      />

      {characterCampaign && (
        <InitiateTradeSheet
          open={showTradeSheet}
          onOpenChange={setShowTradeSheet}
          campaignId={characterCampaign.id}
          characterId={character.id}
          characterInventory={[
            ...inventory.filter((item: any) => !item.isEquipped),
            ...equipment
              .filter((item: any) => !item.isEquipped)
              .map((item: any) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                quantity: item.quantity || 1,
                category: item.type === 'weapon' ? 'Armas' : item.type === 'armor' ? 'Armaduras' : item.type === 'shield' ? 'Escudos' : item.category,
                rarity: item.rarity,
                source: 'equipment',
              }))
          ]}
          campaignPlayers={campaignPlayers || []}
        />
      )}
    </div>
  );
}
