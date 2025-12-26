import { useState, useMemo } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gift, Loader2, User, Package, Search, Sword, Shield, Sparkles, Scroll } from "lucide-react";
import { useCampaignTrades, ItemData } from "@/hooks/usePlayerTrades";

// Import SRD data
import magicItemsA from "@/data/magic-items/a.json";
import magicItemsB from "@/data/magic-items/b.json";
import magicItemsC from "@/data/magic-items/c.json";
import magicItemsD from "@/data/magic-items/d.json";
import magicItemsE from "@/data/magic-items/e.json";
import magicItemsFH from "@/data/magic-items/f-h.json";
import magicItemsIL from "@/data/magic-items/i-l.json";
import magicItemsMP from "@/data/magic-items/m-p.json";
import magicItemsQZ from "@/data/magic-items/q-z.json";
import magicItemsQZ2 from "@/data/magic-items/q-z-parte2.json";
import armasData from "@/data/equipment/armas.json";
import armadurasData from "@/data/equipment/armaduras.json";
import equipamentoData from "@/data/equipment/equipamento-aventura.json";

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

interface MasterGiftSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  players: CampaignPlayer[];
}

interface SRDItem {
  id: string;
  name: string;
  description_markdown?: string;
  rarity?: string;
  type?: string;
  category?: string;
}

const RARITIES = [
  { value: "comum", label: "Comum" },
  { value: "incomum", label: "Incomum" },
  { value: "raro", label: "Raro" },
  { value: "muito-raro", label: "Muito Raro" },
  { value: "lendario", label: "Lendário" },
  { value: "artefato", label: "Artefato" },
];

const CATEGORIES = [
  "Armas",
  "Armaduras",
  "Poções",
  "Pergaminhos",
  "Itens Mágicos",
  "Equipamentos",
  "Suprimentos",
  "Tesouros",
  "Outros",
];

const RARITY_MAP: Record<string, string> = {
  common: "comum",
  uncommon: "incomum",
  rare: "raro",
  "very rare": "muito-raro",
  "very_rare": "muito-raro",
  legendary: "lendario",
  artifact: "artefato",
};

const RARITY_COLORS: Record<string, string> = {
  comum: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  incomum: "bg-green-500/20 text-green-400 border-green-500/30",
  raro: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "muito-raro": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  lendario: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  artefato: "bg-red-500/20 text-red-400 border-red-500/30",
};

// Helper to extract items from magic items JSON files (some are arrays, some have itens_magicos property)
const extractMagicItems = (data: any): SRDItem[] => {
  if (Array.isArray(data)) {
    return data;
  }
  if (data.itens_magicos) {
    return data.itens_magicos;
  }
  return [];
};

// Combine all magic items
const allMagicItems: SRDItem[] = [
  ...extractMagicItems(magicItemsA),
  ...extractMagicItems(magicItemsB),
  ...extractMagicItems(magicItemsC),
  ...extractMagicItems(magicItemsD),
  ...extractMagicItems(magicItemsE),
  ...extractMagicItems(magicItemsFH),
  ...extractMagicItems(magicItemsIL),
  ...extractMagicItems(magicItemsMP),
  ...extractMagicItems(magicItemsQZ),
  ...extractMagicItems(magicItemsQZ2),
].map(item => ({
  ...item,
  category: "Itens Mágicos",
}));

// Get weapons
const allWeapons: SRDItem[] = (armasData.items || []).map((item: any) => ({
  id: item.id,
  name: item.name,
  description_markdown: item.description_markdown || `${item.damage?.dice || ''} ${item.damage?.type || ''}`,
  rarity: "common",
  category: "Armas",
}));

// Get armor
const allArmor: SRDItem[] = (armadurasData.items || []).map((item: any) => ({
  id: item.id,
  name: item.name,
  description_markdown: item.description_markdown || `CA: ${item.armor_class?.base || item.armor_class}`,
  rarity: "common",
  category: "Armaduras",
}));

// Get equipment
const allEquipment: SRDItem[] = (equipamentoData.adventuring_gear?.items || []).map((item: any) => ({
  id: item.id,
  name: item.name,
  description_markdown: item.description_markdown || "",
  rarity: "common",
  category: "Equipamentos",
}));

export function MasterGiftSheet({
  open,
  onOpenChange,
  campaignId,
  players,
}: MasterGiftSheetProps) {
  const { createMasterGift } = useCampaignTrades(campaignId);
  const [selectedPlayer, setSelectedPlayer] = useState<CampaignPlayer | null>(null);
  const [activeTab, setActiveTab] = useState("srd");
  const [srdCategory, setSrdCategory] = useState("magic");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSRDItem, setSelectedSRDItem] = useState<SRDItem | null>(null);
  const [itemData, setItemData] = useState<ItemData>({
    name: "",
    description: "",
    category: "",
    rarity: "comum",
    quantity: 1,
  });

  const playersWithCharacters = players.filter(p => p.character_id && p.character);

  // Get items based on category
  const srdItems = useMemo(() => {
    let items: SRDItem[] = [];
    switch (srdCategory) {
      case "magic":
        items = allMagicItems;
        break;
      case "weapons":
        items = allWeapons;
        break;
      case "armor":
        items = allArmor;
        break;
      case "equipment":
        items = allEquipment;
        break;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(term)
      );
    }

    return items.slice(0, 50); // Limit to 50 items for performance
  }, [srdCategory, searchTerm]);

  const handleSelectSRDItem = (item: SRDItem) => {
    setSelectedSRDItem(item);
    const rarity = RARITY_MAP[item.rarity || "common"] || "comum";
    setItemData({
      name: item.name,
      description: item.description_markdown?.replace(/\*\*/g, '').slice(0, 500) || "",
      category: item.category || "Outros",
      rarity,
      quantity: 1,
    });
  };

  const handleSubmit = async () => {
    if (!selectedPlayer?.character_id || !itemData.name.trim()) return;

    await createMasterGift.mutateAsync({
      receiver_user_id: selectedPlayer.user_id,
      receiver_character_id: selectedPlayer.character_id,
      item_data: itemData,
    });

    // Reset form
    setSelectedPlayer(null);
    setSelectedSRDItem(null);
    setItemData({
      name: "",
      description: "",
      category: "",
      rarity: "comum",
      quantity: 1,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Entregar Item (Modo Admin)
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Entregue itens diretamente aos jogadores sem passar pela loja
          </p>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-6rem)] mt-4">
          {/* Player Selection */}
          <div className="space-y-2 mb-4">
            <Label>Jogador *</Label>
            {playersWithCharacters.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-xl text-center">
                Nenhum jogador com personagem na campanha
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {playersWithCharacters.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className={`flex-shrink-0 p-2 rounded-xl border text-left transition-all ${
                      selectedPlayer?.id === player.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{player.character?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.character?.class} Nv.{player.character?.level}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Source Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="srd" className="gap-2">
                <Scroll className="w-4 h-4" />
                SRD (Pré-definido)
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-2">
                <Package className="w-4 h-4" />
                Personalizado
              </TabsTrigger>
            </TabsList>

            <TabsContent value="srd" className="flex-1 flex flex-col min-h-0 mt-4">
              {/* SRD Category Selection */}
              <div className="flex gap-2 mb-3">
                <Button
                  variant={srdCategory === "magic" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSrdCategory("magic")}
                  className="gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Mágicos
                </Button>
                <Button
                  variant={srdCategory === "weapons" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSrdCategory("weapons")}
                  className="gap-1.5"
                >
                  <Sword className="w-3.5 h-3.5" />
                  Armas
                </Button>
                <Button
                  variant={srdCategory === "armor" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSrdCategory("armor")}
                  className="gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Armaduras
                </Button>
                <Button
                  variant={srdCategory === "equipment" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSrdCategory("equipment")}
                  className="gap-1.5"
                >
                  <Package className="w-3.5 h-3.5" />
                  Equipamentos
                </Button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar item..."
                  className="pl-9"
                />
              </div>

              {/* Items List */}
              <ScrollArea className="flex-1">
                <div className="grid gap-2 pr-4">
                  {srdItems.map((item) => {
                    const rarity = RARITY_MAP[item.rarity || "common"] || "comum";
                    const rarityLabel = RARITIES.find(r => r.value === rarity)?.label || "Comum";
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSRDItem(item)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedSRDItem?.id === item.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {item.description_markdown?.replace(/\*\*/g, '').slice(0, 80)}...
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] flex-shrink-0 ${RARITY_COLORS[rarity] || ""}`}
                          >
                            {rarityLabel}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                  {srdItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum item encontrado
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Selected Item Summary */}
              {selectedSRDItem && (
                <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{selectedSRDItem.name}</p>
                      <p className="text-xs text-muted-foreground">Selecionado para entrega</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Qtd:</Label>
                      <Input
                        type="number"
                        min={1}
                        value={itemData.quantity || 1}
                        onChange={(e) => setItemData(prev => ({ 
                          ...prev, 
                          quantity: parseInt(e.target.value) || 1 
                        }))}
                        className="w-16 h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="custom" className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Package className="w-4 h-4" />
                    Dados do Item Personalizado
                  </div>

                  <div className="space-y-2">
                    <Label>Nome do Item *</Label>
                    <Input
                      value={itemData.name}
                      onChange={(e) => {
                        setSelectedSRDItem(null);
                        setItemData(prev => ({ ...prev, name: e.target.value }));
                      }}
                      placeholder="Espada Longa +1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={itemData.description}
                      onChange={(e) => setItemData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Uma espada finamente trabalhada..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={itemData.category || ""}
                        onValueChange={(value) => setItemData(prev => ({ ...prev, category: value }))}
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
                        value={itemData.rarity || "comum"}
                        onValueChange={(value) => setItemData(prev => ({ ...prev, rarity: value }))}
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
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min={1}
                      value={itemData.quantity || 1}
                      onChange={(e) => setItemData(prev => ({ 
                        ...prev, 
                        quantity: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!selectedPlayer?.character_id || !itemData.name.trim() || createMasterGift.isPending}
            >
              {createMasterGift.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Gift className="w-4 h-4 mr-2" />
              )}
              Entregar Item
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
