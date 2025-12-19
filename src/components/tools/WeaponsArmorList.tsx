import { useState } from "react";
import { ArrowLeft, Search, Shield, Swords, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import weaponsData from "@/data/equipment/armas.json";
import armorData from "@/data/equipment/armaduras.json";

interface WeaponsArmorListProps {
  onBack: () => void;
}

interface Weapon {
  id: string;
  name: string;
  name_en: string;
  category: string;
  cost: { value: number; currency: string };
  weight: number;
  damage: { dice: string; type: string };
  properties: string[];
  description_markdown: string;
  range?: { normal: number; max: number };
  thrown?: { range_normal: number; range_max: number };
  versatile?: { dice: string };
}

interface Armor {
  id: string;
  name: string;
  name_en: string;
  category: string;
  cost: { value: number; currency: string };
  weight: number;
  armor_class: { base: number; add_dex_modifier: boolean; max_dex_bonus: number | null; bonus?: number };
  strength_requirement: number | null;
  stealth_disadvantage: boolean;
  description_markdown: string;
}

const WEAPON_CATEGORIES: Record<string, string> = {
  simple_melee: "Simples (Corpo a Corpo)",
  simple_ranged: "Simples (À Distância)",
  martial_melee: "Marcial (Corpo a Corpo)",
  martial_ranged: "Marcial (À Distância)",
};

const ARMOR_CATEGORIES: Record<string, string> = {
  light: "Leve",
  medium: "Média",
  heavy: "Pesada",
  shield: "Escudo",
};

const DAMAGE_TYPES: Record<string, string> = {
  bludgeoning: "Concussão",
  piercing: "Perfurante",
  slashing: "Cortante",
};

const PROPERTIES: Record<string, string> = {
  ammunition: "Munição",
  finesse: "Acuidade",
  heavy: "Pesada",
  light: "Leve",
  loading: "Recarga",
  reach: "Alcance",
  special: "Especial",
  thrown: "Arremesso",
  two_handed: "Duas Mãos",
  versatile: "Versátil",
};

export function WeaponsArmorList({ onBack }: WeaponsArmorListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("weapons");
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [selectedArmor, setSelectedArmor] = useState<Armor | null>(null);

  const weapons = weaponsData.items as Weapon[];
  const armors = armorData.items as Armor[];

  const filteredWeapons = weapons.filter(
    (weapon) =>
      weapon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      weapon.name_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArmors = armors.filter(
    (armor) =>
      armor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      armor.name_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedWeapons = filteredWeapons.reduce((acc, weapon) => {
    const category = weapon.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(weapon);
    return acc;
  }, {} as Record<string, Weapon[]>);

  const groupedArmors = filteredArmors.reduce((acc, armor) => {
    const category = armor.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(armor);
    return acc;
  }, {} as Record<string, Armor[]>);

  const formatCost = (cost: { value: number; currency: string }) => {
    const currencies: Record<string, string> = {
      cp: "PC",
      sp: "PP",
      gp: "PO",
      pp: "PPl",
    };
    return `${cost.value} ${currencies[cost.currency] || cost.currency}`;
  };

  const getArmorClassDisplay = (ac: Armor["armor_class"]) => {
    if (ac.bonus) return `+${ac.bonus}`;
    let display = ac.base.toString();
    if (ac.add_dex_modifier) {
      display += ac.max_dex_bonus ? ` + Des (máx ${ac.max_dex_bonus})` : " + Des";
    }
    return display;
  };

  return (
    <div className="min-h-screen bg-darker pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Armas & Armaduras</h1>
            <p className="text-xs text-muted-foreground">Catálogo de equipamentos</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar equipamentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="weapons" className="flex-1 gap-2">
                <Swords className="w-4 h-4" />
                Armas
              </TabsTrigger>
              <TabsTrigger value="armor" className="flex-1 gap-2">
                <Shield className="w-4 h-4" />
                Armaduras
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4 max-w-lg mx-auto">
        {activeTab === "weapons" && (
          <div className="space-y-6">
            {Object.entries(groupedWeapons).map(([category, items]) => (
              <section key={category}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {WEAPON_CATEGORIES[category] || category}
                </h2>
                <div className="space-y-2">
                  {items.map((weapon, index) => (
                    <button
                      key={weapon.id}
                      onClick={() => setSelectedWeapon(weapon)}
                      className={cn(
                        "w-full glass rounded-xl p-3 flex items-center gap-3",
                        "hover:border-primary/50 transition-all text-left animate-fade-in"
                      )}
                      style={{ animationDelay: `${index * 0.02}s` }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center flex-shrink-0">
                        <Swords className="w-5 h-5 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">{weapon.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {weapon.damage ? (
                            <>
                              <span className="text-primary font-medium">{weapon.damage.dice}</span>
                              <span>•</span>
                              <span>{DAMAGE_TYPES[weapon.damage.type] || weapon.damage.type}</span>
                              <span>•</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Especial •</span>
                          )}
                          <span>{formatCost(weapon.cost)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {activeTab === "armor" && (
          <div className="space-y-6">
            {Object.entries(groupedArmors).map(([category, items]) => (
              <section key={category}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {ARMOR_CATEGORIES[category] || category}
                </h2>
                <div className="space-y-2">
                  {items.map((armor, index) => (
                    <button
                      key={armor.id}
                      onClick={() => setSelectedArmor(armor)}
                      className={cn(
                        "w-full glass rounded-xl p-3 flex items-center gap-3",
                        "hover:border-primary/50 transition-all text-left animate-fade-in"
                      )}
                      style={{ animationDelay: `${index * 0.02}s` }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">{armor.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="text-emerald-400 font-medium">
                            CA {getArmorClassDisplay(armor.armor_class)}
                          </span>
                          <span>•</span>
                          <span>{formatCost(armor.cost)}</span>
                          {armor.stealth_disadvantage && (
                            <>
                              <span>•</span>
                              <span className="text-destructive">Furtividade Des.</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Weapon Detail Sheet */}
      <Sheet open={!!selectedWeapon} onOpenChange={() => setSelectedWeapon(null)}>
        <SheetContent side="bottom" className="h-[70vh] bg-darker">
          {selectedWeapon && (
            <>
              <SheetHeader className="pb-4 border-b border-border">
                <SheetTitle className="text-xl text-left">{selectedWeapon.name}</SheetTitle>
                <p className="text-sm text-muted-foreground text-left">{selectedWeapon.name_en}</p>
              </SheetHeader>

              <ScrollArea className="h-full py-4">
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="glass rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground">Dano</p>
                      <p className="text-lg font-bold text-primary">
                        {selectedWeapon.damage?.dice || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedWeapon.damage ? (DAMAGE_TYPES[selectedWeapon.damage.type] || selectedWeapon.damage.type) : "Especial"}
                      </p>
                    </div>
                    <div className="glass rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground">Custo</p>
                      <p className="text-lg font-bold text-gold">{formatCost(selectedWeapon.cost)}</p>
                    </div>
                    <div className="glass rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground">Peso</p>
                      <p className="text-lg font-bold">{selectedWeapon.weight} kg</p>
                    </div>
                  </div>

                  {/* Properties */}
                  {selectedWeapon.properties.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Propriedades</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedWeapon.properties.map((prop) => (
                          <Badge key={prop} variant="secondary">
                            {PROPERTIES[prop] || prop}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Range */}
                  {(selectedWeapon.range || selectedWeapon.thrown) && (
                    <div className="glass rounded-xl p-3">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">Alcance</h3>
                      <p className="text-foreground">
                        {selectedWeapon.range
                          ? `${selectedWeapon.range.normal}m / ${selectedWeapon.range.max}m`
                          : selectedWeapon.thrown
                          ? `${selectedWeapon.thrown.range_normal}m / ${selectedWeapon.thrown.range_max}m`
                          : "—"}
                      </p>
                    </div>
                  )}

                  {/* Versatile */}
                  {selectedWeapon.versatile && (
                    <div className="glass rounded-xl p-3">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">Versátil</h3>
                      <p className="text-foreground">
                        Dano com duas mãos: <span className="text-primary font-bold">{selectedWeapon.versatile.dice}</span>
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Descrição</h3>
                    <p className="text-sm text-foreground/80">{selectedWeapon.description_markdown}</p>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Armor Detail Sheet */}
      <Sheet open={!!selectedArmor} onOpenChange={() => setSelectedArmor(null)}>
        <SheetContent side="bottom" className="h-[70vh] bg-darker">
          {selectedArmor && (
            <>
              <SheetHeader className="pb-4 border-b border-border">
                <SheetTitle className="text-xl text-left">{selectedArmor.name}</SheetTitle>
                <p className="text-sm text-muted-foreground text-left">{selectedArmor.name_en}</p>
              </SheetHeader>

              <ScrollArea className="h-full py-4">
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="glass rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground">Classe de Armadura</p>
                      <p className="text-lg font-bold text-emerald-400">
                        {getArmorClassDisplay(selectedArmor.armor_class)}
                      </p>
                    </div>
                    <div className="glass rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground">Custo</p>
                      <p className="text-lg font-bold text-gold">{formatCost(selectedArmor.cost)}</p>
                    </div>
                    <div className="glass rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground">Peso</p>
                      <p className="text-lg font-bold">{selectedArmor.weight} kg</p>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedArmor.strength_requirement && (
                      <div className="glass rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">Força Mínima</p>
                        <p className="text-lg font-bold">{selectedArmor.strength_requirement}</p>
                      </div>
                    )}
                    <div className="glass rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">Furtividade</p>
                      <p className={cn("text-lg font-bold", selectedArmor.stealth_disadvantage ? "text-destructive" : "text-emerald-400")}>
                        {selectedArmor.stealth_disadvantage ? "Desvantagem" : "Normal"}
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">Categoria</p>
                    <p className="text-foreground font-medium">
                      {ARMOR_CATEGORIES[selectedArmor.category] || selectedArmor.category}
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Descrição</h3>
                    <p className="text-sm text-foreground/80">{selectedArmor.description_markdown}</p>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
