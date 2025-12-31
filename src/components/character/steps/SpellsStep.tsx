import { useState, useEffect, useMemo } from 'react';
import { WizardData } from '../CharacterWizard';
import { CLASSES } from '@/data/srd';
import { cn } from '@/lib/utils';
import { Check, Sparkles, Search, Info, Wand2, Sword, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useHomebrew } from '@/hooks/useHomebrew';
import { HomebrewSpellData } from '@/types';

interface SpellsStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

// New unified spell interface based on magias.json
interface Spell {
  name: string;
  originalName: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialDescription?: string;
  };
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevels: string | null;
  classes: string[];
  isHomebrew?: boolean;
}

const SCHOOLS: Record<string, string> = {
  "Abjuração": "Abjuração",
  "Conjuração": "Conjuração",
  "Adivinhação": "Adivinhação",
  "Encantamento": "Encantamento",
  "Evocação": "Evocação",
  "Ilusão": "Ilusão",
  "Necromancia": "Necromancia",
  "Transmutação": "Transmutação",
};

// Map class IDs to Portuguese class names used in spell data
// Note: spell data uses "Clerigo" without accent
const CLASS_NAME_MAP: Record<string, string> = {
  wizard: 'Mago',
  sorcerer: 'Feiticeiro',
  bard: 'Bardo',
  cleric: 'Clerigo',
  druid: 'Druida',
  warlock: 'Bruxo',
  paladin: 'Paladino',
  ranger: 'Patrulheiro',
};

// Spellcasting classes and their cantrips/spells known at level 1
const SPELLCASTING_CLASSES: Record<string, { cantrips: number; spells: number }> = {
  wizard: { cantrips: 3, spells: 6 },
  sorcerer: { cantrips: 4, spells: 2 },
  bard: { cantrips: 2, spells: 4 },
  cleric: { cantrips: 3, spells: 0 }, // Cleric prepares spells
  druid: { cantrips: 2, spells: 0 }, // Druid prepares spells
  warlock: { cantrips: 2, spells: 2 },
};

export function SpellsStep({ data, updateData }: SpellsStepProps) {
  const [allSpells, setAllSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  // Fetch homebrew spells
  const { homebrewContent: homebrewSpells, isLoading: loadingHomebrew } = useHomebrew('spell');

  const selectedClass = CLASSES.find(c => c.id === data.class);
  const spellcastingInfo = SPELLCASTING_CLASSES[data.class];
  const className = CLASS_NAME_MAP[data.class] || '';
  
  const selectedCantrips = data.selectedCantrips || [];
  const selectedSpells = data.selectedSpells || [];

  useEffect(() => {
    const loadSpells = async () => {
      try {
        const mod = await import("@/data/spells/magias.json");
        const spells = mod.default as Spell[];
        setAllSpells(spells);
      } catch (error) {
        console.error("Error loading spells:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSpells();
  }, []);

  // Convert homebrew spells to the same format
  const convertedHomebrewSpells: Spell[] = useMemo(() => {
    return homebrewSpells.map(hb => {
      const spellData = hb.data as HomebrewSpellData;
      return {
        name: `${hb.icon} ${hb.name}`,
        originalName: hb.name,
        level: spellData.level || 0,
        school: spellData.school || 'Evocação',
        castingTime: spellData.casting_time || '1 ação',
        range: spellData.range || 'Pessoal',
        components: {
          verbal: spellData.components?.includes('V') || false,
          somatic: spellData.components?.includes('S') || false,
          material: spellData.components?.includes('M') || false,
        },
        duration: spellData.duration || 'Instantânea',
        concentration: spellData.duration?.toLowerCase().includes('concentração') || false,
        ritual: false,
        description: hb.description || '',
        higherLevels: null,
        classes: [], // Homebrew spells available to all
        isHomebrew: true,
      };
    });
  }, [homebrewSpells]);

  // Filter spells by level and class
  const cantrips = useMemo(() => {
    const srdCantrips = allSpells.filter(s => 
      s.level === 0 && 
      (s.classes.includes(className) || className === '')
    );
    const homebrewCantrips = convertedHomebrewSpells.filter(s => s.level === 0);
    const combined = [...homebrewCantrips, ...srdCantrips];
    return combined.filter(s => 
      search === '' || s.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
      if (a.isHomebrew && !b.isHomebrew) return -1;
      if (!a.isHomebrew && b.isHomebrew) return 1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [allSpells, convertedHomebrewSpells, search, className]);

  const firstLevelSpells = useMemo(() => {
    const srdSpells = allSpells.filter(s => 
      s.level === 1 && 
      (s.classes.includes(className) || className === '')
    );
    const homebrewFirst = convertedHomebrewSpells.filter(s => s.level === 1);
    const combined = [...homebrewFirst, ...srdSpells];
    return combined.filter(s => 
      search === '' || s.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
      if (a.isHomebrew && !b.isHomebrew) return -1;
      if (!a.isHomebrew && b.isHomebrew) return 1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [allSpells, convertedHomebrewSpells, search, className]);

  if (!spellcastingInfo) {
    return (
      <div className="p-4 text-center">
        <Wand2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <h2 className="text-xl font-bold text-foreground">Sem Magias</h2>
        <p className="text-sm text-muted-foreground mt-2">
          A classe {selectedClass?.name} não possui habilidades de conjuração no 1º nível.
        </p>
      </div>
    );
  }

  const handleToggleCantrip = (spellName: string) => {
    const current = [...selectedCantrips];
    const index = current.indexOf(spellName);
    
    if (index > -1) {
      current.splice(index, 1);
    } else if (current.length < spellcastingInfo.cantrips) {
      current.push(spellName);
    }
    
    updateData({ selectedCantrips: current });
  };

  const handleToggleSpell = (spellName: string) => {
    const current = [...selectedSpells];
    const index = current.indexOf(spellName);
    
    if (index > -1) {
      current.splice(index, 1);
    } else if (current.length < spellcastingInfo.spells) {
      current.push(spellName);
    }
    
    updateData({ selectedSpells: current });
  };

  if (loading || loadingHomebrew) {
    return (
      <div className="p-4 text-center">
        <Sparkles className="w-12 h-12 mx-auto text-primary animate-pulse mb-3" />
        <p className="text-muted-foreground">Carregando magias...</p>
      </div>
    );
  }

  // Get selected spell objects for display
  const selectedCantripObjects = useMemo(() => {
    return [...allSpells, ...convertedHomebrewSpells].filter(s => selectedCantrips.includes(s.name));
  }, [allSpells, convertedHomebrewSpells, selectedCantrips]);

  const selectedSpellObjects = useMemo(() => {
    return [...allSpells, ...convertedHomebrewSpells].filter(s => selectedSpells.includes(s.name));
  }, [allSpells, convertedHomebrewSpells, selectedSpells]);

  // Filter out selected spells from the main lists
  const availableCantrips = useMemo(() => {
    return cantrips.filter(s => !selectedCantrips.includes(s.name));
  }, [cantrips, selectedCantrips]);

  const availableFirstLevelSpells = useMemo(() => {
    return firstLevelSpells.filter(s => !selectedSpells.includes(s.name));
  }, [firstLevelSpells, selectedSpells]);

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Magias Iniciais</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha as magias do seu {selectedClass?.name}
        </p>
      </div>

      {/* Selected Spells Section */}
      {(selectedCantrips.length > 0 || selectedSpells.length > 0) && (
        <div className="glass rounded-xl p-3 border-primary/30 bg-primary/5">
          <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Magias Selecionadas
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedCantripObjects.map((spell) => (
              <button
                key={spell.name}
                onClick={() => handleToggleCantrip(spell.name)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-lg text-sm transition-colors group"
              >
                <span className="text-foreground truncate max-w-[120px] sm:max-w-none">{spell.name}</span>
                <Badge variant="outline" className="text-[8px] px-1 py-0 bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Truque
                </Badge>
                <X className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
              </button>
            ))}
            {selectedSpellObjects.map((spell) => (
              <button
                key={spell.name}
                onClick={() => handleToggleSpell(spell.name)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-lg text-sm transition-colors group"
              >
                <span className="text-foreground truncate max-w-[120px] sm:max-w-none">{spell.name}</span>
                <Badge variant="outline" className="text-[8px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">
                  1º
                </Badge>
                <X className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar magia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Cantrips */}
      {spellcastingInfo.cantrips > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Truques</h3>
            <Badge variant="outline" className={cn(
              selectedCantrips.length >= spellcastingInfo.cantrips && "bg-green-500/20 text-green-400 border-green-500/30"
            )}>
              {selectedCantrips.length} / {spellcastingInfo.cantrips}
            </Badge>
          </div>
          <div className="space-y-2">
            {availableCantrips.length === 0 && selectedCantrips.length >= spellcastingInfo.cantrips ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                ✓ Todos os truques selecionados
              </p>
            ) : availableCantrips.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum truque encontrado
              </p>
            ) : (
              availableCantrips.map((spell) => {
                const isDisabled = selectedCantrips.length >= spellcastingInfo.cantrips;

                return (
                  <button
                    key={spell.name}
                    onClick={() => handleToggleCantrip(spell.name)}
                    disabled={isDisabled}
                    className={cn(
                      "w-full glass rounded-xl p-3 text-left transition-all flex items-center gap-3",
                      isDisabled && "opacity-50 cursor-not-allowed",
                      !isDisabled && "hover:border-primary/50"
                    )}
                  >
                    <div className="w-6 h-6 rounded-lg border-2 border-muted-foreground flex items-center justify-center shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {spell.name}
                        </h4>
                        {spell.isHomebrew ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                            <Sword className="w-2.5 h-2.5 mr-0.5" />
                            Homebrew
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                            SRD
                          </Badge>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help shrink-0" onClick={(e) => { e.stopPropagation(); setSelectedSpell(spell); }} />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Clique para detalhes</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {spell.school} • {spell.castingTime}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 1st Level Spells */}
      {spellcastingInfo.spells > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Magias de 1º Nível</h3>
            <Badge variant="outline" className={cn(
              selectedSpells.length >= spellcastingInfo.spells && "bg-green-500/20 text-green-400 border-green-500/30"
            )}>
              {selectedSpells.length} / {spellcastingInfo.spells}
            </Badge>
          </div>
          <div className="space-y-2">
            {availableFirstLevelSpells.length === 0 && selectedSpells.length >= spellcastingInfo.spells ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                ✓ Todas as magias de 1º nível selecionadas
              </p>
            ) : availableFirstLevelSpells.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma magia encontrada
              </p>
            ) : (
              availableFirstLevelSpells.map((spell) => {
                const isDisabled = selectedSpells.length >= spellcastingInfo.spells;

                return (
                  <button
                    key={spell.name}
                    onClick={() => handleToggleSpell(spell.name)}
                    disabled={isDisabled}
                    className={cn(
                      "w-full glass rounded-xl p-3 text-left transition-all flex items-center gap-3",
                      isDisabled && "opacity-50 cursor-not-allowed",
                      !isDisabled && "hover:border-primary/50"
                    )}
                  >
                    <div className="w-6 h-6 rounded-lg border-2 border-muted-foreground flex items-center justify-center shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {spell.name}
                        </h4>
                        {spell.isHomebrew ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                            <Sword className="w-2.5 h-2.5 mr-0.5" />
                            Homebrew
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                            SRD
                          </Badge>
                        )}
                        {spell.concentration && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">C</span>
                        )}
                        {spell.ritual && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">R</span>
                        )}
                        <Info 
                          className="w-3.5 h-3.5 text-muted-foreground cursor-help shrink-0" 
                          onClick={(e) => { e.stopPropagation(); setSelectedSpell(spell); }} 
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {spell.school} • {spell.castingTime}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Spell Detail Sheet */}
      <Sheet open={!!selectedSpell} onOpenChange={() => setSelectedSpell(null)}>
        <SheetContent side="bottom" className="bg-dark border-border h-[70vh]">
          {selectedSpell && (
            <ScrollArea className="h-full pr-4">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-left">{selectedSpell.name}</SheetTitle>
                <p className="text-xs text-muted-foreground">{selectedSpell.originalName}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedSpell.level === 0 ? "Truque" : `${selectedSpell.level}º Nível`}
                  </Badge>
                  <Badge className="text-xs bg-primary/20 text-primary">
                    {selectedSpell.school}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="glass rounded-lg p-2">
                    <span className="text-xs text-muted-foreground">Tempo</span>
                    <p className="font-medium">{selectedSpell.castingTime}</p>
                  </div>
                  <div className="glass rounded-lg p-2">
                    <span className="text-xs text-muted-foreground">Alcance</span>
                    <p className="font-medium">{selectedSpell.range}</p>
                  </div>
                  <div className="glass rounded-lg p-2">
                    <span className="text-xs text-muted-foreground">Duração</span>
                    <p className="font-medium">{selectedSpell.duration}</p>
                  </div>
                  <div className="glass rounded-lg p-2">
                    <span className="text-xs text-muted-foreground">Componentes</span>
                    <p className="font-medium">
                      {[
                        selectedSpell.components.verbal && 'V',
                        selectedSpell.components.somatic && 'S',
                        selectedSpell.components.material && 'M'
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>

                {selectedSpell.components.material && selectedSpell.components.materialDescription && (
                  <div className="glass rounded-lg p-2">
                    <span className="text-xs text-muted-foreground">Materiais</span>
                    <p className="text-sm">{selectedSpell.components.materialDescription}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold mb-2">Descrição</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {selectedSpell.description}
                  </p>
                </div>

                {selectedSpell.higherLevels && (
                  <div className="glass rounded-lg p-3">
                    <p className="text-xs text-primary font-medium mb-1">Em Níveis Superiores</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSpell.higherLevels}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
