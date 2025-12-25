import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Sword, Shield, Plus, Coins } from "lucide-react";
import armasData from "@/data/equipment/armas.json";
import armadurasData from "@/data/equipment/armaduras.json";
import { ShopItemFormData } from "@/hooks/useShops";

interface PredefinedItemsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItem: (item: ShopItemFormData) => void;
}

const CURRENCY_TO_GOLD: Record<string, number> = {
  cp: 0.01,
  sp: 0.1,
  gp: 1,
  pp: 10,
};

export function PredefinedItemsSheet({
  open,
  onOpenChange,
  onSelectItem,
}: PredefinedItemsSheetProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("weapons");

  const weapons = useMemo(() => {
    return armasData.items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      cost: item.cost,
      weight: item.weight,
      damage: item.damage,
      properties: item.properties,
      description: item.description_markdown,
    }));
  }, []);

  const armors = useMemo(() => {
    return armadurasData.items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      cost: item.cost,
      weight: item.weight,
      armor_class: item.armor_class,
      description: item.description_markdown,
    }));
  }, []);

  const filteredWeapons = useMemo(() => {
    if (!search) return weapons;
    const lowerSearch = search.toLowerCase();
    return weapons.filter(
      (w) =>
        w.name.toLowerCase().includes(lowerSearch) ||
        w.category.toLowerCase().includes(lowerSearch)
    );
  }, [weapons, search]);

  const filteredArmors = useMemo(() => {
    if (!search) return armors;
    const lowerSearch = search.toLowerCase();
    return armors.filter(
      (a) =>
        a.name.toLowerCase().includes(lowerSearch) ||
        a.category.toLowerCase().includes(lowerSearch)
    );
  }, [armors, search]);

  const convertCostToGold = (cost: { value: number; currency: string }) => {
    const multiplier = CURRENCY_TO_GOLD[cost.currency] || 1;
    const totalGold = cost.value * multiplier;
    return {
      gold: Math.floor(totalGold),
      silver: Math.floor((totalGold * 10) % 10),
      copper: Math.floor((totalGold * 100) % 10),
    };
  };

  const handleSelectWeapon = (weapon: typeof weapons[0]) => {
    const price = convertCostToGold(weapon.cost);
    const description = weapon.damage 
      ? `${weapon.damage.dice} (${weapon.damage.type})${weapon.properties?.length ? ` - ${weapon.properties.join(", ")}` : ""}`
      : "";
    
    onSelectItem({
      name: weapon.name,
      description,
      price_gold: price.gold,
      price_silver: price.silver,
      price_copper: price.copper,
      category: "Armas",
      rarity: "comum",
      is_available: true,
    });
    onOpenChange(false);
    setSearch("");
  };

  const handleSelectArmor = (armor: typeof armors[0]) => {
    const price = convertCostToGold(armor.cost);
    const description = armor.armor_class 
      ? `CA ${armor.armor_class.base}${armor.armor_class.add_dex_modifier ? " + Destreza" : ""}${armor.armor_class.max_dex_bonus ? ` (máx +${armor.armor_class.max_dex_bonus})` : ""}`
      : "";
    
    onSelectItem({
      name: armor.name,
      description,
      price_gold: price.gold,
      price_silver: price.silver,
      price_copper: price.copper,
      category: "Armaduras",
      rarity: "comum",
      is_available: true,
    });
    onOpenChange(false);
    setSearch("");
  };

  const formatCost = (cost: { value: number; currency: string }) => {
    const currencyNames: Record<string, string> = {
      cp: "PC",
      sp: "PP",
      gp: "PO",
      pp: "PL",
    };
    return `${cost.value} ${currencyNames[cost.currency] || cost.currency}`;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      simple_melee: "Simples Corpo a Corpo",
      simple_ranged: "Simples à Distância",
      martial_melee: "Marcial Corpo a Corpo",
      martial_ranged: "Marcial à Distância",
      light: "Leve",
      medium: "Média",
      heavy: "Pesada",
      shield: "Escudo",
    };
    return labels[category] || category;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle>Adicionar Item do SRD</SheetTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar armas ou armaduras..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-2 mx-6 mt-4" style={{ width: 'calc(100% - 48px)' }}>
              <TabsTrigger value="weapons" className="flex items-center gap-2">
                <Sword className="w-4 h-4" />
                Armas ({filteredWeapons.length})
              </TabsTrigger>
              <TabsTrigger value="armors" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Armaduras ({filteredArmors.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weapons" className="flex-1 m-0">
              <ScrollArea className="h-[calc(85vh-200px)] px-6">
                <div className="space-y-2 py-4">
                  {filteredWeapons.map((weapon) => (
                    <div
                      key={weapon.id}
                      className="p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleSelectWeapon(weapon)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{weapon.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(weapon.category)}
                            </Badge>
                          </div>
                          {weapon.damage && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {weapon.damage.dice} ({weapon.damage.type})
                            </p>
                          )}
                          {weapon.properties && weapon.properties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {weapon.properties.map((prop) => (
                                <Badge key={prop} variant="secondary" className="text-xs">
                                  {prop}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gold flex items-center gap-1">
                            <Coins className="w-3 h-3" />
                            {formatCost(weapon.cost)}
                          </span>
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="armors" className="flex-1 m-0">
              <ScrollArea className="h-[calc(85vh-200px)] px-6">
                <div className="space-y-2 py-4">
                  {filteredArmors.map((armor) => (
                    <div
                      key={armor.id}
                      className="p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleSelectArmor(armor)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{armor.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(armor.category)}
                            </Badge>
                          </div>
                          {armor.armor_class && (
                            <p className="text-sm text-muted-foreground mt-1">
                              CA {armor.armor_class.base}
                              {armor.armor_class.add_dex_modifier && " + Des"}
                              {armor.armor_class.max_dex_bonus && ` (máx +${armor.armor_class.max_dex_bonus})`}
                              {armor.armor_class.bonus && ` (+${armor.armor_class.bonus})`}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gold flex items-center gap-1">
                            <Coins className="w-3 h-3" />
                            {formatCost(armor.cost)}
                          </span>
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
