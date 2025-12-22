import { useState, useEffect, useMemo } from "react";
import { Sparkles, Check, BookOpen, Save, Search, Plus, Gem, Info } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateCharacter, CharacterDB } from "@/hooks/useCharacters";
import { useHomebrew } from "@/hooks/useHomebrew";
import { cn } from "@/lib/utils";
import { HomebrewSpellData } from "@/types";

interface SpellsManagementSheetProps {
  character: CharacterDB;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SpellData {
  name: string;
  level: number;
  prepared?: boolean;
}

const SPELL_SLOTS_BY_LEVEL: Record<string, number[]> = {
  // level: [1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th]
  "1": [2, 0, 0, 0, 0, 0, 0, 0, 0],
  "2": [3, 0, 0, 0, 0, 0, 0, 0, 0],
  "3": [4, 2, 0, 0, 0, 0, 0, 0, 0],
  "4": [4, 3, 0, 0, 0, 0, 0, 0, 0],
  "5": [4, 3, 2, 0, 0, 0, 0, 0, 0],
  "6": [4, 3, 3, 0, 0, 0, 0, 0, 0],
  "7": [4, 3, 3, 1, 0, 0, 0, 0, 0],
  "8": [4, 3, 3, 2, 0, 0, 0, 0, 0],
  "9": [4, 3, 3, 3, 1, 0, 0, 0, 0],
  "10": [4, 3, 3, 3, 2, 0, 0, 0, 0],
  "11": [4, 3, 3, 3, 2, 1, 0, 0, 0],
  "12": [4, 3, 3, 3, 2, 1, 0, 0, 0],
  "13": [4, 3, 3, 3, 2, 1, 1, 0, 0],
  "14": [4, 3, 3, 3, 2, 1, 1, 0, 0],
  "15": [4, 3, 3, 3, 2, 1, 1, 1, 0],
  "16": [4, 3, 3, 3, 2, 1, 1, 1, 0],
  "17": [4, 3, 3, 3, 2, 1, 1, 1, 1],
  "18": [4, 3, 3, 3, 3, 1, 1, 1, 1],
  "19": [4, 3, 3, 3, 3, 2, 1, 1, 1],
  "20": [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

export function SpellsManagementSheet({ character, open, onOpenChange }: SpellsManagementSheetProps) {
  const updateCharacter = useUpdateCharacter();
  const [search, setSearch] = useState("");
  const [spells, setSpells] = useState<SpellData[]>([]);
  const [usedSlots, setUsedSlots] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [activeTab, setActiveTab] = useState("prepared");

  // Fetch homebrew spells
  const { homebrewContent: homebrewSpells, isLoading: loadingHomebrew } = useHomebrew('spell');

  // Convert homebrew spells to internal format
  const convertedHomebrewSpells = useMemo(() => {
    return homebrewSpells.map(hb => {
      const spellData = hb.data as HomebrewSpellData;
      return {
        name: `${hb.icon || '✨'} ${hb.name}`,
        level: spellData.level || 0,
        prepared: false,
        isHomebrew: true,
        id: hb.id,
        description: hb.description,
        school: spellData.school,
      };
    });
  }, [homebrewSpells]);

  useEffect(() => {
    const charSpells = (character.spells as any[]) || [];
    setSpells(charSpells.map(s => ({
      name: typeof s === 'string' ? s : s.name,
      level: typeof s === 'string' ? 0 : (s.level || 0),
      prepared: typeof s === 'string' ? false : (s.prepared || false),
    })));

    const spellcasting = character.spellcasting as any;
    if (spellcasting?.usedSlots) {
      setUsedSlots(spellcasting.usedSlots);
    }
  }, [character]);

  const spellSlots = SPELL_SLOTS_BY_LEVEL[character.level.toString()] || [0, 0, 0, 0, 0, 0, 0, 0, 0];

  const groupedSpells = useMemo(() => {
    const groups: Record<number, SpellData[]> = { 0: [] };
    for (let i = 1; i <= 9; i++) groups[i] = [];

    spells
      .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
      .forEach(spell => {
        const level = spell.level || 0;
        if (groups[level]) {
          groups[level].push(spell);
        }
      });

    return groups;
  }, [spells, search]);

  // Available homebrew spells that haven't been added yet
  const availableHomebrewSpells = useMemo(() => {
    const existingNames = spells.map(s => s.name.toLowerCase());
    return convertedHomebrewSpells.filter(
      hs => !existingNames.some(name => name.includes(hs.name.toLowerCase().split(' ').slice(1).join(' ')))
    );
  }, [convertedHomebrewSpells, spells]);

  const addHomebrewSpell = (homebrewSpell: typeof convertedHomebrewSpells[0]) => {
    const newSpell: SpellData = {
      name: homebrewSpell.name,
      level: homebrewSpell.level,
      prepared: false,
    };
    setSpells(prev => [...prev, newSpell]);
  };

  const togglePrepared = (spellName: string) => {
    setSpells(prev =>
      prev.map(s =>
        s.name === spellName ? { ...s, prepared: !s.prepared } : s
      )
    );
  };

  const toggleSlot = (slotLevel: number, slotIndex: number) => {
    setUsedSlots(prev => {
      const newSlots = [...prev];
      const maxSlots = spellSlots[slotLevel];
      const currentUsed = newSlots[slotLevel];
      
      if (slotIndex < currentUsed) {
        // Recover slot
        newSlots[slotLevel] = slotIndex;
      } else {
        // Use slot
        newSlots[slotLevel] = slotIndex + 1;
      }
      
      return newSlots;
    });
  };

  const handleSave = async () => {
    await updateCharacter.mutateAsync({
      id: character.id,
      spells: spells,
      spellcasting: {
        ...(character.spellcasting as any),
        usedSlots: usedSlots,
      },
    });
    onOpenChange(false);
  };

  const preparedCount = spells.filter(s => s.prepared && s.level > 0).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] bg-darker">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Gerenciar Magias
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid grid-cols-3 mt-4">
            <TabsTrigger value="prepared">Preparadas</TabsTrigger>
            <TabsTrigger value="slots">Espaços</TabsTrigger>
            <TabsTrigger value="homebrew">
              <Gem className="w-3 h-3 mr-1" />
              Homebrew
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prepared" className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar magia..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="secondary">{preparedCount} preparadas</Badge>
            </div>

            <ScrollArea className="h-[50vh]">
              <div className="space-y-4">
                {Object.entries(groupedSpells).map(([level, levelSpells]) => {
                  if (levelSpells.length === 0) return null;
                  return (
                    <div key={level}>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        {level === "0" ? "Truques" : `${level}º Círculo`}
                      </h3>
                      <div className="space-y-1">
                        {levelSpells.map((spell) => (
                          <button
                            key={spell.name}
                            onClick={() => parseInt(level) > 0 && togglePrepared(spell.name)}
                            className={cn(
                              "w-full p-3 rounded-lg flex items-center justify-between transition-colors",
                              spell.prepared || parseInt(level) === 0
                                ? "bg-primary/20 border border-primary/50"
                                : "bg-muted/50 hover:bg-muted"
                            )}
                          >
                            <span className="text-sm font-medium">{spell.name}</span>
                            {parseInt(level) === 0 ? (
                              <Badge variant="outline" className="text-xs">Truque</Badge>
                            ) : spell.prepared ? (
                              <Check className="w-4 h-4 text-primary" />
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {spells.length === 0 && (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                    <p className="text-muted-foreground">Nenhuma magia conhecida</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="slots" className="mt-4 space-y-4">
            <ScrollArea className="h-[50vh]">
              <div className="space-y-4">
                {spellSlots.map((maxSlots, index) => {
                  if (maxSlots === 0) return null;
                  const slotLevel = index;
                  const used = usedSlots[slotLevel] || 0;

                  return (
                    <div key={slotLevel} className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold">{slotLevel + 1}º Círculo</h3>
                        <span className="text-xs text-muted-foreground">
                          {maxSlots - used}/{maxSlots} disponíveis
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {Array.from({ length: maxSlots }).map((_, slotIndex) => (
                          <button
                            key={slotIndex}
                            onClick={() => toggleSlot(slotLevel, slotIndex)}
                            className={cn(
                              "w-10 h-10 rounded-lg border-2 transition-all",
                              slotIndex < used
                                ? "bg-muted border-muted-foreground/50"
                                : "bg-primary/20 border-primary"
                            )}
                          >
                            {slotIndex >= used && (
                              <Sparkles className="w-4 h-4 mx-auto text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Homebrew Spells Tab */}
          <TabsContent value="homebrew" className="mt-4 space-y-4">
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Gem className="w-4 h-4 text-amber-500" />
                Adicionar Magias Homebrew
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Adicione magias homebrew ao grimório do seu personagem.
              </p>

              {availableHomebrewSpells.length === 0 ? (
                <div className="text-center py-6">
                  <Sparkles className="w-10 h-10 mx-auto text-muted-foreground opacity-50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {homebrewSpells.length === 0 
                      ? "Nenhuma magia homebrew criada"
                      : "Todas as magias homebrew já foram adicionadas"}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {availableHomebrewSpells.map((spell) => (
                      <div
                        key={spell.id}
                        className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{spell.name}</span>
                            <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500">
                              {spell.level === 0 ? "Truque" : `${spell.level}º Nível`}
                            </Badge>
                          </div>
                          {spell.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {spell.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-amber-500 hover:text-amber-400 hover:bg-amber-500/20"
                          onClick={() => addHomebrewSpell(spell)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Current homebrew spells in grimoire */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Magias Homebrew no Grimório</h3>
              {spells.filter(s => s.name.includes('✨') || s.name.includes('🔥') || s.name.includes('💀')).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma magia homebrew adicionada ainda
                </p>
              ) : (
                <div className="space-y-1">
                  {spells.filter(s => 
                    convertedHomebrewSpells.some(hs => 
                      s.name.toLowerCase().includes(hs.name.split(' ').slice(1).join(' ').toLowerCase())
                    )
                  ).map((spell) => (
                    <div
                      key={spell.name}
                      className="p-2 rounded-lg bg-muted/50 flex items-center justify-between"
                    >
                      <span className="text-sm">{spell.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {spell.level === 0 ? "Truque" : `${spell.level}º`}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSave}
            disabled={updateCharacter.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateCharacter.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}