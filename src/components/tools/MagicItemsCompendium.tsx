import { useState, useMemo } from "react";
import { ArrowLeft, Search, Sparkles, ChevronRight, X, Shield, Sword, Wand2, Gem, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Import all magic items
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

interface MagicItemsCompendiumProps {
  onBack: () => void;
}

interface MagicItem {
  id: string;
  name: string;
  name_en: string;
  type: string;
  rarity: string;
  requires_attunement: boolean;
  description_markdown: string;
  cursed?: boolean;
}

const RARITY_CONFIG: Record<string, { label: string; color: string }> = {
  common: { label: "Comum", color: "bg-muted text-muted-foreground" },
  uncommon: { label: "Incomum", color: "bg-emerald-500/20 text-emerald-400" },
  rare: { label: "Raro", color: "bg-blue-500/20 text-blue-400" },
  very_rare: { label: "Muito Raro", color: "bg-purple-500/20 text-purple-400" },
  legendary: { label: "Lendário", color: "bg-gold/20 text-gold" },
  artifact: { label: "Artefato", color: "bg-primary/20 text-primary" },
};

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  armor: { label: "Armadura", icon: Shield },
  weapon: { label: "Arma", icon: Sword },
  wondrous_item: { label: "Item Maravilhoso", icon: Gem },
  potion: { label: "Poção", icon: Wand2 },
  ring: { label: "Anel", icon: Gem },
  rod: { label: "Cajado", icon: Wand2 },
  scroll: { label: "Pergaminho", icon: Wand2 },
  staff: { label: "Bordão", icon: Wand2 },
  wand: { label: "Varinha", icon: Wand2 },
};

export function MagicItemsCompendium({ onBack }: MagicItemsCompendiumProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MagicItem | null>(null);

  const allItems: MagicItem[] = useMemo(() => {
    const items: MagicItem[] = [
      ...(magicItemsA as any).itens_magicos,
      ...(magicItemsB as any).itens_magicos,
      ...(magicItemsC as any).itens_magicos,
      ...(magicItemsD as any).itens_magicos,
      ...(magicItemsE as any).itens_magicos,
      ...(magicItemsFH as any).itens_magicos,
      ...(magicItemsIL as any).itens_magicos,
      ...(magicItemsMP as any).itens_magicos,
      ...(magicItemsQZ as any).itens_magicos,
      ...(magicItemsQZ2 as any).itens_magicos,
    ];
    return items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, []);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name_en.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = !selectedRarity || item.rarity === selectedRarity;
      const matchesType = !selectedType || item.type === selectedType;
      return matchesSearch && matchesRarity && matchesType;
    });
  }, [allItems, searchQuery, selectedRarity, selectedType]);

  const rarities = Object.keys(RARITY_CONFIG);
  const types = Object.keys(TYPE_CONFIG);

  const getTypeConfig = (type: string) =>
    TYPE_CONFIG[type] || { label: type, icon: Gem };

  const getRarityConfig = (rarity: string) =>
    RARITY_CONFIG[rarity] || { label: rarity, color: "bg-muted text-muted-foreground" };

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Itens Mágicos</h1>
            <p className="text-xs text-muted-foreground">
              {filteredItems.length} itens encontrados
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar itens mágicos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 space-y-2">
          {/* Rarity Filter */}
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2">
              <Button
                variant={selectedRarity === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRarity(null)}
              >
                Todos
              </Button>
              {rarities.map((rarity) => (
                <Button
                  key={rarity}
                  variant={selectedRarity === rarity ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRarity(rarity === selectedRarity ? null : rarity)}
                >
                  {RARITY_CONFIG[rarity].label}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Type Filter */}
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2">
              {types.map((type) => {
                const config = TYPE_CONFIG[type];
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type === selectedType ? null : type)}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </header>

      {/* Items List */}
      <main className="px-4 py-4 max-w-lg mx-auto">
        <div className="space-y-2">
          {filteredItems.map((item, index) => {
            const typeConfig = getTypeConfig(item.type);
            const rarityConfig = getRarityConfig(item.rarity);
            const TypeIcon = typeConfig.icon;

            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={cn(
                  "w-full glass rounded-xl p-3 flex items-center gap-3",
                  "hover:border-primary/50 transition-all text-left animate-fade-in"
                )}
                style={{ animationDelay: `${index * 0.02}s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                  <TypeIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {item.name}
                    </h3>
                    {item.cursed && (
                      <Badge variant="destructive" className="text-[10px]">
                        Amaldiçoado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className={cn("text-[10px]", rarityConfig.color)}>
                      {rarityConfig.label}
                    </Badge>
                    {item.requires_attunement && (
                      <span className="text-[10px] text-muted-foreground">
                        Requer Sintonização
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </button>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum item encontrado</p>
          </div>
        )}
      </main>

      {/* Item Detail Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent side="bottom" className="h-[85vh] bg-darker">
          {selectedItem && (
            <>
              <SheetHeader className="pb-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-xl text-left">{selectedItem.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{selectedItem.name_en}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={cn(getRarityConfig(selectedItem.rarity).color)}>
                        {getRarityConfig(selectedItem.rarity).label}
                      </Badge>
                      <Badge variant="outline">
                        {getTypeConfig(selectedItem.type).label}
                      </Badge>
                      {selectedItem.requires_attunement && (
                        <Badge variant="secondary">Requer Sintonização</Badge>
                      )}
                      {selectedItem.cursed && (
                        <Badge variant="destructive">Amaldiçoado</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="h-full py-4">
                <div className="prose prose-invert prose-sm max-w-none">
                  {selectedItem.description_markdown.split("\n").map((paragraph, i) => (
                    <p key={i} className="text-foreground/90 mb-3 whitespace-pre-wrap">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
