import { useState, useEffect, useMemo } from "react";
import { Sparkles, Check, BookOpen, Save, Search, Plus, Gem, Zap, Clock, Target, Component, Timer, FlaskConical, Scroll, X, Trash2 } from "lucide-react";
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

// New unified spell interface based on magias.json
interface FullSpellData {
  name: string;
  originalName?: string;
  level: number;
  school?: string;
  castingTime?: string;
  range?: string;
  components?: {
    verbal?: boolean;
    somatic?: boolean;
    material?: boolean;
    materialDescription?: string;
  };
  duration?: string;
  concentration?: boolean;
  ritual?: boolean;
  description?: string;
  higherLevels?: string | null;
  classes?: string[];
}

// Helper functions to format spell data
const formatComponents = (components: FullSpellData['components']): string => {
  if (!components) return "—";
  if (typeof components === 'string') return components;
  
  const parts: string[] = [];
  if (components.verbal) parts.push('V');
  if (components.somatic) parts.push('S');
  if (components.material) parts.push('M');
  return parts.join(', ') || "—";
};

const formatRange = (range: FullSpellData['range']): string => {
  if (!range) return "—";
  if (typeof range === 'string') return range;
  if (typeof range === 'number') return `${range}m`;
  return "—";
};

const getMaterialDescription = (components: FullSpellData['components']): string | null => {
  if (!components) return null;
  return components.materialDescription || null;
};

const SPELL_SCHOOLS: Record<string, { name: string; color: string; icon: string }> = {
  "abjuration": { name: "Abjuração", color: "bg-primary/20 text-primary border-primary/30", icon: "🛡️" },
  "conjuration": { name: "Conjuração", color: "bg-gold/20 text-gold border-gold/30", icon: "✨" },
  "divination": { name: "Adivinhação", color: "bg-accent-foreground/20 text-accent-foreground border-accent-foreground/30", icon: "👁️" },
  "enchantment": { name: "Encantamento", color: "bg-primary/20 text-primary border-primary/30", icon: "💫" },
  "evocation": { name: "Evocação", color: "bg-destructive/20 text-destructive border-destructive/30", icon: "🔥" },
  "illusion": { name: "Ilusão", color: "bg-accent-foreground/20 text-accent-foreground border-accent-foreground/30", icon: "🌀" },
  "necromancy": { name: "Necromancia", color: "bg-muted text-muted-foreground border-border", icon: "💀" },
  "transmutation": { name: "Transmutação", color: "bg-secondary/20 text-secondary border-secondary/30", icon: "🔄" },
};

// Spellcaster classes for filtering
const SPELLCASTER_CLASSES = [
  { id: 'mago', name: 'Mago' },
  { id: 'clerigo', name: 'Clérigo' },
  { id: 'druida', name: 'Druida' },
  { id: 'bardo', name: 'Bardo' },
  { id: 'paladino', name: 'Paladino' },
  { id: 'patrulheiro', name: 'Patrulheiro' },
  { id: 'feiticeiro', name: 'Feiticeiro' },
  { id: 'bruxo', name: 'Bruxo' },
];

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
  const [compendiumSearch, setCompendiumSearch] = useState("");
  const [compendiumLevelFilter, setCompendiumLevelFilter] = useState<number | null>(null);
  const [compendiumClassFilter, setCompendiumClassFilter] = useState<string | null>(null);
  const [spells, setSpells] = useState<SpellData[]>([]);
  const [usedSlots, setUsedSlots] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [activeTab, setActiveTab] = useState("prepared");
  const [allSpellsData, setAllSpellsData] = useState<FullSpellData[]>([]);
  const [selectedSpell, setSelectedSpell] = useState<FullSpellData | null>(null);

  const { homebrewContent: homebrewSpells } = useHomebrew('spell');

  // Load all spells data from unified magias.json
  useEffect(() => {
    const loadSpells = async () => {
      try {
        const mod = await import('@/data/spells/magias.json');
        const spells = mod.default as FullSpellData[];
        setAllSpellsData(spells);
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
    const raw = (character.spells as any[]) ?? [];
    const charSpells = Array.isArray(raw) ? raw : [];

    setSpells(
      charSpells
        .filter((s) => {
          if (typeof s === "string") return s.trim().length > 0;
          return !!s && typeof s === "object" && typeof (s as any).name === "string";
        })
        .map((s) => ({
          name: typeof s === "string" ? s : s.name,
          level: typeof s === "string" ? 0 : (s.level || 0),
          prepared: typeof s === "string" ? false : (s.prepared || false),
        }))
    );

    const spellcasting = character.spellcasting as any;
    if (spellcasting?.usedSlots) {
      setUsedSlots(spellcasting.usedSlots);
    }
  }, [character]);

  const spellSlots = SPELL_SLOTS_BY_LEVEL[character.level.toString()] || [0, 0, 0, 0, 0, 0, 0, 0, 0];

  // Calculate max spell level based on character level (for full casters)
  const maxSpellLevel = useMemo(() => {
    // Find highest spell slot available
    for (let i = 8; i >= 0; i--) {
      if (spellSlots[i] > 0) return i + 1;
    }
    return 0; // Cantrips only if no slots
  }, [spellSlots]);

  // Get full spell data for character spells
  const characterSpellsWithData = useMemo(() => {
    return spells.map(spell => {
      const spellNameNormalized = spell.name.toLowerCase().replace(/_/g, ' ').trim();
      const fullData = allSpellsData.find(s => {
        const dbName = s.name?.toLowerCase().trim() || '';
        const dbOriginalName = s.originalName?.toLowerCase().trim() || '';
        return dbName === spellNameNormalized || 
               dbOriginalName === spellNameNormalized;
      });
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

  // Get existing spell names for deduplication
  const existingSpellNames = useMemo(() => {
    return new Set(spells.map(s => s.name.toLowerCase().replace(/_/g, ' ').trim()));
  }, [spells]);

  // Available compendium spells (not already known, filtered by level, class, and search)
  const availableCompendiumSpells = useMemo(() => {
    return allSpellsData.filter(spell => {
      // Check if already known
      const spellNameLower = spell.name?.toLowerCase().trim() || '';
      const spellOriginalNameLower = spell.originalName?.toLowerCase().trim() || '';
      
      const isKnown = existingSpellNames.has(spellNameLower) || 
                      existingSpellNames.has(spellOriginalNameLower);
      if (isKnown) return false;

      // Check level filter
      if (compendiumLevelFilter !== null && spell.level !== compendiumLevelFilter) return false;

      // Check if spell level is accessible (0 = cantrips always allowed, or spell level <= maxSpellLevel)
      if (spell.level > 0 && spell.level > maxSpellLevel) return false;

      // Check class filter
      if (compendiumClassFilter !== null) {
        const spellClasses = spell.classes || [];
        const matchesClass = spellClasses.some(c => c.toLowerCase() === compendiumClassFilter.toLowerCase());
        if (!matchesClass) return false;
      }

      // Check search
      if (compendiumSearch) {
        const searchLower = compendiumSearch.toLowerCase();
        return spellNameLower.includes(searchLower) || 
               spellOriginalNameLower.includes(searchLower) ||
               (spell.school?.toLowerCase().includes(searchLower));
      }

      return true;
    });
  }, [allSpellsData, existingSpellNames, compendiumSearch, compendiumLevelFilter, compendiumClassFilter, maxSpellLevel]);

  const addSpellFromCompendium = (spell: FullSpellData) => {
    const newSpell: SpellData = {
      name: spell.name,
      level: spell.level,
      prepared: false,
    };
    setSpells(prev => [...prev, newSpell]);
  };

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

  const removeSpell = (spellName: string) => {
    setSpells(prev => prev.filter(s => s.name !== spellName));
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
          "p-3 cursor-pointer transition-colors",
          isPrepared
            ? "bg-primary/10 border-primary/40"
            : "bg-card/50 border-border/50 hover:bg-card/80"
        )}
        onClick={() => {
          if (spell.fullData) {
            setSelectedSpell(spell.fullData);
          }
        }}
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
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gold/20 text-gold border-gold/30">
                  <Zap className="w-2.5 h-2.5 mr-0.5" />
                  Conc.
                </Badge>
              )}
              {spell.fullData?.ritual && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                  <Scroll className="w-2.5 h-2.5 mr-0.5" />
                  Ritual
                </Badge>
              )}
            </div>

            {spell.fullData && (
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                {spell.fullData.castingTime && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {spell.fullData.castingTime}
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeSpell(spell.name);
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-colors bg-destructive/20 hover:bg-destructive/40 text-destructive"
              title="Remover magia"
            >
              <Trash2 className="w-3 h-3" />
            </button>
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
                title={isPrepared ? "Despreparar" : "Preparar"}
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
            <TabsList className="grid grid-cols-4 mt-4">
              <TabsTrigger value="prepared" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Magias
              </TabsTrigger>
              <TabsTrigger value="compendium" className="text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Adicionar
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

            <TabsContent value="compendium" className="mt-4 space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar no compêndio..."
                    value={compendiumSearch}
                    onChange={(e) => setCompendiumSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex gap-1 flex-wrap">
                  <Button
                    variant={compendiumLevelFilter === null ? "secondary" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setCompendiumLevelFilter(null)}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={compendiumLevelFilter === 0 ? "secondary" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setCompendiumLevelFilter(0)}
                  >
                    Truques
                  </Button>
                  {Array.from({ length: Math.min(maxSpellLevel, 9) }, (_, i) => i + 1).map(level => (
                    <Button
                      key={level}
                      variant={compendiumLevelFilter === level ? "secondary" : "outline"}
                      size="sm"
                      className="text-xs h-7 w-7 p-0"
                      onClick={() => setCompendiumLevelFilter(level)}
                    >
                      {level}º
                    </Button>
                  ))}
                </div>

                {/* Class Filter */}
                <div className="flex gap-1 flex-wrap">
                  <Button
                    variant={compendiumClassFilter === null ? "secondary" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setCompendiumClassFilter(null)}
                  >
                    Todas Classes
                  </Button>
                  {SPELLCASTER_CLASSES.map(cls => (
                    <Button
                      key={cls.id}
                      variant={compendiumClassFilter === cls.id ? "secondary" : "outline"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setCompendiumClassFilter(compendiumClassFilter === cls.id ? null : cls.id)}
                    >
                      {cls.name}
                    </Button>
                  ))}
                </div>

                {maxSpellLevel === 0 && (
                  <Card className="p-3 bg-gold/10 border-gold/30">
                    <p className="text-xs text-gold">
                      Seu personagem ainda não possui espaços de magia. Apenas truques estão disponíveis.
                    </p>
                  </Card>
                )}
              </div>

              <ScrollArea className="h-[calc(90vh-320px)]">
                <div className="space-y-2 pb-20">
                  {availableCompendiumSpells.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 mx-auto text-muted-foreground opacity-30 mb-4" />
                      <p className="text-muted-foreground font-medium">
                        {compendiumSearch ? "Nenhuma magia encontrada" : "Todas as magias disponíveis já foram adicionadas"}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {compendiumSearch ? "Tente uma busca diferente" : "Aumente seu nível para mais opções"}
                      </p>
                    </div>
                  ) : (
                    availableCompendiumSpells.slice(0, 50).map(spell => {
                      const schoolInfo = getSchoolInfo(spell.school);
                      return (
                        <Card
                          key={`${spell.name}-${spell.level}`}
                          className="p-3 bg-card/50 hover:bg-card/80 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div 
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => setSelectedSpell(spell)}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {schoolInfo && (
                                  <span className="text-base" title={schoolInfo.name}>
                                    {schoolInfo.icon}
                                  </span>
                                )}
                                <span className="font-medium text-sm truncate">{spell.name}</span>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mt-1">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {spell.level === 0 ? "Truque" : `${spell.level}º Círculo`}
                                </Badge>
                                {schoolInfo && (
                                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", schoolInfo.color)}>
                                    {schoolInfo.name}
                                  </Badge>
                                )}
                                {spell.concentration && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gold/20 text-gold border-gold/30">
                                    Conc.
                                  </Badge>
                                )}
                                {spell.ritual && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                    Ritual
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0 text-primary hover:text-primary hover:bg-primary/20"
                              onClick={() => addSpellFromCompendium(spell)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      );
                    })
                  )}
                  {availableCompendiumSpells.length > 50 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Mostrando 50 de {availableCompendiumSpells.length} magias. Use a busca para encontrar mais.
                    </p>
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
                    {selectedSpell.originalName && (
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedSpell.originalName}</p>
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
                          <p className="text-xs font-medium">{selectedSpell.castingTime || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Alcance</p>
                          <p className="text-xs font-medium">{formatRange(selectedSpell.range)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Component className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Componentes</p>
                          <p className="text-xs font-medium">{formatComponents(selectedSpell.components)}</p>
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
                  {getMaterialDescription(selectedSpell.components) && (
                    <Card className="p-3 bg-amber-500/10 border-amber-500/30">
                      <div className="flex items-start gap-2">
                        <FlaskConical className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-200">
                          {getMaterialDescription(selectedSpell.components)}
                        </p>
                      </div>
                    </Card>
                  )}

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Descrição</h4>
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {(selectedSpell.description || "Sem descrição.")}
                    </div>
                  </div>

                  {/* Higher Levels */}
                  {selectedSpell.higherLevels && (
                    <Card className="p-3 bg-primary/10 border-primary/30">
                      <h4 className="text-xs font-semibold mb-1 text-primary">Em Níveis Superiores</h4>
                      <p className="text-xs text-muted-foreground">
                        {selectedSpell.higherLevels}
                      </p>
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
