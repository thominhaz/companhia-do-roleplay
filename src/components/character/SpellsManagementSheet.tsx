import { useState, useEffect, useMemo } from "react";
import { Sparkles, Check, BookOpen, Save, Search, Plus, Gem, Eye, Zap, Clock, Target, Component, Timer, FlaskConical, Scroll, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
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

interface FullSpellData {
  name: string;
  name_en?: string;
  level: number;
  school?: string;
  casting_time?: string;
  range?: string;
  components?: string;
  materials?: string;
  duration?: string;
  concentration?: boolean;
  ritual?: boolean;
  description?: string;
  description_markdown?: string;
  higher_levels?: string;
  classes?: string[];
}

const SPELL_SCHOOLS: Record<string, { name: string; color: string; icon: string }> = {
  "abjuration": { name: "Abjuração", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: "🛡️" },
  "conjuration": { name: "Conjuração", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: "✨" },
  "divination": { name: "Adivinhação", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: "👁️" },
  "enchantment": { name: "Encantamento", color: "bg-pink-500/20 text-pink-400 border-pink-500/30", icon: "💫" },
  "evocation": { name: "Evocação", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: "🔥" },
  "illusion": { name: "Ilusão", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", icon: "🌀" },
  "necromancy": { name: "Necromancia", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: "💀" },
  "transmutation": { name: "Transmutação", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: "🔄" },
};

const SPELL_SLOTS_BY_LEVEL: Record<string, number[]> = {
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

const formatSpellName = (name: string): string => {
  if (!name) return "";
  return name
    .replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export function SpellsManagementSheet({ character, open, onOpenChange }: SpellsManagementSheetProps) {
  const updateCharacter = useUpdateCharacter();
  const [search, setSearch] = useState("");
  const [spells, setSpells] = useState<SpellData[]>([]);
  const [usedSlots, setUsedSlots] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [activeTab, setActiveTab] = useState("prepared");
  const [allSpellsData, setAllSpellsData] = useState<FullSpellData[]>([]);
  const [selectedSpell, setSelectedSpell] = useState<FullSpellData | null>(null);

  const { homebrewContent: homebrewSpells } = useHomebrew('spell');

  // Load all spells data
  useEffect(() => {
    const loadSpells = async () => {
      try {
        const spellFiles: Promise<any>[] = [
          import('@/data/spells/a-c.json'),
          import('@/data/spells/d-f.json'),
          import('@/data/spells/g-i.json'),
          import('@/data/spells/j-l.json'),
          import('@/data/spells/n-p.json'),
          import('@/data/spells/q-s.json'),
          import('@/data/spells/t-z.json'),
        ];
        const results = await Promise.all(spellFiles);
        const allSpells = results.flatMap(result => {
          const data = result.default || result;
          return data.magias || data;
        });
        setAllSpellsData(allSpells as FullSpellData[]);
      } catch (error) {
        console.error('Error loading spells:', error);
      }
    };
    loadSpells();
  }, []);

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

  // Get full spell data for character spells
  const characterSpellsWithData = useMemo(() => {
    return spells.map(spell => {
      const spellNameNormalized = spell.name.toLowerCase().replace(/_/g, ' ');
      const fullData = allSpellsData.find(s => 
        s.name?.toLowerCase() === spellNameNormalized ||
        s.name_en?.toLowerCase() === spellNameNormalized
      );
      return {
        ...spell,
        fullData,
        displayName: formatSpellName(spell.name),
      };
    });
  }, [spells, allSpellsData]);

  const groupedSpells = useMemo(() => {
    const groups: Record<number, typeof characterSpellsWithData> = { 0: [] };
    for (let i = 1; i <= 9; i++) groups[i] = [];

    characterSpellsWithData
      .filter(s => s.displayName.toLowerCase().includes(search.toLowerCase()))
      .forEach(spell => {
        const level = spell.fullData?.level ?? spell.level ?? 0;
        if (groups[level]) {
          groups[level].push(spell);
        }
      });

    return groups;
  }, [characterSpellsWithData, search]);

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
      const currentUsed = newSlots[slotLevel];
      
      if (slotIndex < currentUsed) {
        newSlots[slotLevel] = slotIndex;
      } else {
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

  const getSchoolInfo = (school?: string) => {
    if (!school) return null;
    const schoolLower = school.toLowerCase();
    return SPELL_SCHOOLS[schoolLower] || null;
  };

  const renderSpellCard = (spell: typeof characterSpellsWithData[0], level: number) => {
    const schoolInfo = getSchoolInfo(spell.fullData?.school);
    const isPrepared = spell.prepared || level === 0;
    
    return (
      <Card
        key={spell.name}
        className={cn(
          "p-3 cursor-pointer transition-all hover:scale-[1.02]",
          isPrepared
            ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/10"
            : "bg-card/50 border-border/50 hover:border-border"
        )}
        onClick={() => spell.fullData && setSelectedSpell(spell.fullData)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {schoolInfo && (
                <span className="text-base" title={schoolInfo.name}>
                  {schoolInfo.icon}
                </span>
              )}
              <span className="font-medium text-sm truncate">{spell.displayName}</span>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-2">
              {schoolInfo && (
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", schoolInfo.color)}>
                  {schoolInfo.name}
                </Badge>
              )}
              {spell.fullData?.concentration && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-500/20 text-orange-400 border-orange-500/30">
                  <Zap className="w-2.5 h-2.5 mr-0.5" />
                  Conc.
                </Badge>
              )}
              {spell.fullData?.ritual && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  <Scroll className="w-2.5 h-2.5 mr-0.5" />
                  Ritual
                </Badge>
              )}
            </div>

            {spell.fullData && (
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                {spell.fullData.casting_time && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {spell.fullData.casting_time}
                  </span>
                )}
                {spell.fullData.range && (
                  <span className="flex items-center gap-0.5">
                    <Target className="w-2.5 h-2.5" />
                    {spell.fullData.range}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            {level > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePrepared(spell.name);
                }}
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                  isPrepared
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted-foreground/20"
                )}
              >
                {isPrepared && <Check className="w-3.5 h-3.5" />}
              </button>
            )}
            {level === 0 && (
              <Badge className="text-[10px] bg-primary/20 text-primary border-0">
                Truque
              </Badge>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderLevelSection = (level: number, levelSpells: typeof characterSpellsWithData) => {
    if (levelSpells.length === 0) return null;

    const slotInfo = level > 0 ? {
      max: spellSlots[level - 1] || 0,
      used: usedSlots[level - 1] || 0,
    } : null;

    return (
      <div key={level} className="space-y-3">
        <div className="flex items-center justify-between sticky top-0 bg-darker/95 backdrop-blur-sm py-2 z-10">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
              level === 0 ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"
            )}>
              {level === 0 ? "∞" : level}
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                {level === 0 ? "Truques" : `${level}º Círculo`}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {levelSpells.length} {levelSpells.length === 1 ? 'magia' : 'magias'}
              </p>
            </div>
          </div>

          {slotInfo && slotInfo.max > 0 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: slotInfo.max }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => toggleSlot(level - 1, i)}
                  className={cn(
                    "w-5 h-5 rounded transition-all",
                    i < slotInfo.used
                      ? "bg-muted-foreground/30"
                      : "bg-primary shadow-sm shadow-primary/30"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {levelSpells.map(spell => renderSpellCard(spell, level))}
        </div>
      </div>
    );
  };

  return (
    <>
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
              <TabsTrigger value="prepared" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Magias
              </TabsTrigger>
              <TabsTrigger value="slots" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Espaços
              </TabsTrigger>
              <TabsTrigger value="homebrew" className="text-xs">
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
                <Badge variant="secondary" className="shrink-0">
                  <Check className="w-3 h-3 mr-1" />
                  {preparedCount}
                </Badge>
              </div>

              <ScrollArea className="h-[calc(90vh-250px)]">
                <div className="space-y-6 pb-20">
                  {Object.entries(groupedSpells).map(([level, levelSpells]) => 
                    renderLevelSection(parseInt(level), levelSpells)
                  )}

                  {spells.length === 0 && (
                    <div className="text-center py-12">
                      <Sparkles className="w-16 h-16 mx-auto text-muted-foreground opacity-30 mb-4" />
                      <p className="text-muted-foreground font-medium">Nenhuma magia conhecida</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Adicione magias durante a criação do personagem
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="slots" className="mt-4 space-y-4">
              <ScrollArea className="h-[calc(90vh-200px)]">
                <div className="space-y-3 pb-20">
                  {spellSlots.map((maxSlots, index) => {
                    if (maxSlots === 0) return null;
                    const slotLevel = index;
                    const used = usedSlots[slotLevel] || 0;
                    const available = maxSlots - used;

                    return (
                      <Card key={slotLevel} className="p-4 bg-card/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-primary">
                              {slotLevel + 1}
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold">{slotLevel + 1}º Círculo</h3>
                              <p className="text-[10px] text-muted-foreground">
                                {available} de {maxSlots} disponíveis
                              </p>
                            </div>
                          </div>
                          <div className={cn(
                            "text-lg font-bold",
                            available > 0 ? "text-primary" : "text-muted-foreground"
                          )}>
                            {available}/{maxSlots}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          {Array.from({ length: maxSlots }).map((_, slotIndex) => (
                            <button
                              key={slotIndex}
                              onClick={() => toggleSlot(slotLevel, slotIndex)}
                              className={cn(
                                "w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center",
                                slotIndex < used
                                  ? "bg-muted border-muted-foreground/30"
                                  : "bg-primary/20 border-primary shadow-md shadow-primary/20"
                              )}
                            >
                              {slotIndex >= used && (
                                <Sparkles className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          ))}
                        </div>
                      </Card>
                    );
                  })}

                  {spellSlots.every(s => s === 0) && (
                    <div className="text-center py-12">
                      <Zap className="w-16 h-16 mx-auto text-muted-foreground opacity-30 mb-4" />
                      <p className="text-muted-foreground font-medium">Sem espaços de magia</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Aumente seu nível para desbloquear
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="homebrew" className="mt-4 space-y-4">
              <Card className="p-4 bg-amber-500/5 border-amber-500/20">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Gem className="w-4 h-4 text-amber-500" />
                  Adicionar Magias Homebrew
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Adicione suas magias personalizadas ao grimório.
                </p>

                {availableHomebrewSpells.length === 0 ? (
                  <div className="text-center py-6">
                    <Sparkles className="w-10 h-10 mx-auto text-amber-500/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {homebrewSpells.length === 0 
                        ? "Nenhuma magia homebrew criada"
                        : "Todas já foram adicionadas"}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-2">
                      {availableHomebrewSpells.map((spell) => (
                        <Card
                          key={spell.id}
                          className="p-3 bg-amber-500/10 border-amber-500/30 flex items-center justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{spell.name}</span>
                              <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500 shrink-0">
                                {spell.level === 0 ? "Truque" : `${spell.level}º`}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 text-amber-500 hover:text-amber-400 hover:bg-amber-500/20"
                            onClick={() => addHomebrewSpell(spell)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3">No Grimório</h3>
                {spells.filter(s => s.name.includes('✨') || s.name.includes('🔥') || s.name.includes('💀')).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhuma magia homebrew no grimório
                  </p>
                ) : (
                  <div className="space-y-2">
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
              </Card>
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
              {updateCharacter.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Spell Detail Sheet */}
      <Sheet open={!!selectedSpell} onOpenChange={() => setSelectedSpell(null)}>
        <SheetContent side="bottom" className="h-[85vh] bg-darker">
          {selectedSpell && (
            <>
              <SheetHeader className="pb-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-lg">{selectedSpell.name}</SheetTitle>
                    {selectedSpell.name_en && (
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedSpell.name_en}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedSpell(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </SheetHeader>

              <ScrollArea className="h-[calc(85vh-100px)] mt-4">
                <div className="space-y-4 pb-8">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {selectedSpell.level === 0 ? "Truque" : `${selectedSpell.level}º Círculo`}
                    </Badge>
                    {selectedSpell.school && (() => {
                      const schoolInfo = getSchoolInfo(selectedSpell.school);
                      return schoolInfo ? (
                        <Badge variant="outline" className={schoolInfo.color}>
                          {schoolInfo.icon} {schoolInfo.name}
                        </Badge>
                      ) : null;
                    })()}
                    {selectedSpell.concentration && (
                      <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        <Zap className="w-3 h-3 mr-1" /> Concentração
                      </Badge>
                    )}
                    {selectedSpell.ritual && (
                      <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        <Scroll className="w-3 h-3 mr-1" /> Ritual
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <Card className="p-4 bg-card/50">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Tempo</p>
                          <p className="text-xs font-medium">{selectedSpell.casting_time || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Alcance</p>
                          <p className="text-xs font-medium">{selectedSpell.range || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Component className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Componentes</p>
                          <p className="text-xs font-medium">{selectedSpell.components || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Duração</p>
                          <p className="text-xs font-medium">{selectedSpell.duration || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Materials */}
                  {selectedSpell.materials && (
                    <Card className="p-3 bg-amber-500/10 border-amber-500/30">
                      <div className="flex items-start gap-2">
                        <FlaskConical className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-200">{selectedSpell.materials}</p>
                      </div>
                    </Card>
                  )}

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Descrição</h4>
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {(selectedSpell.description_markdown || selectedSpell.description || "Sem descrição.")
                        .replace(/\*\*([^*]+)\*\*/g, '$1')
                        .replace(/### /g, '')
                        .replace(/- /g, '• ')}
                    </div>
                  </div>

                  {/* Higher Levels */}
                  {selectedSpell.higher_levels && (
                    <Card className="p-3 bg-primary/10 border-primary/30">
                      <h4 className="text-xs font-semibold mb-1 text-primary">Em Níveis Superiores</h4>
                      <p className="text-xs text-muted-foreground">{selectedSpell.higher_levels}</p>
                    </Card>
                  )}

                  {/* Classes */}
                  {selectedSpell.classes && selectedSpell.classes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Classes</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedSpell.classes.map(cls => (
                          <Badge key={cls} variant="outline" className="text-[10px]">
                            {cls}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
