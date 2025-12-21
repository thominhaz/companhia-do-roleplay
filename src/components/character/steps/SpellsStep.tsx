import { useState, useEffect, useMemo } from 'react';
import { WizardData } from '../CharacterWizard';
import { CLASSES } from '@/data/srd';
import { cn } from '@/lib/utils';
import { Check, Sparkles, Search, Info, Wand2, Sword } from 'lucide-react';
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

interface Spell {
  id: string;
  name: string;
  name_en: string;
  level: number;
  school: string;
  casting_time: string;
  range: number;
  range_type: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    material_description?: string;
  };
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description_markdown: string;
}

const SCHOOLS: Record<string, string> = {
  abjuration: "Abjuração",
  conjuration: "Conjuração",
  divination: "Adivinhação",
  enchantment: "Encantamento",
  evocation: "Evocação",
  illusion: "Ilusão",
  necromancy: "Necromancia",
  transmutation: "Transmutação",
};

// Spellcasting classes and their cantrips/spells known at level 1
const SPELLCASTING_CLASSES: Record<string, { cantrips: number; spells: number; spellList: string[] }> = {
  wizard: { cantrips: 3, spells: 6, spellList: ['wizard'] },
  sorcerer: { cantrips: 4, spells: 2, spellList: ['sorcerer'] },
  bard: { cantrips: 2, spells: 4, spellList: ['bard'] },
  cleric: { cantrips: 3, spells: 0, spellList: ['cleric'] }, // Cleric prepares spells
  druid: { cantrips: 2, spells: 0, spellList: ['druid'] }, // Druid prepares spells
  warlock: { cantrips: 2, spells: 2, spellList: ['warlock'] },
};

// Spell files will be loaded dynamically
const spellFiles = [
  () => import("@/data/spells/a-c.json"),
  () => import("@/data/spells/g-i.json"),
  () => import("@/data/spells/j-l.json"),
  () => import("@/data/spells/n-p.json"),
  () => import("@/data/spells/q-s.json"),
  () => import("@/data/spells/t-z.json"),
];

export function SpellsStep({ data, updateData }: SpellsStepProps) {
  const [allSpells, setAllSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  // Fetch homebrew spells
  const { homebrewContent: homebrewSpells, isLoading: loadingHomebrew } = useHomebrew('spell');

  const selectedClass = CLASSES.find(c => c.id === data.class);
  const spellcastingInfo = SPELLCASTING_CLASSES[data.class];
  
  const selectedCantrips = data.selectedCantrips || [];
  const selectedSpells = data.selectedSpells || [];

  useEffect(() => {
    const loadSpells = async () => {
      try {
        const results = await Promise.all(spellFiles.map(fn => fn()));
        const spells: Spell[] = [];
        results.forEach((mod: any) => {
          if (mod.default?.magias) {
            spells.push(...mod.default.magias);
          } else if (mod.magias) {
            spells.push(...mod.magias);
          }
        });
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
        id: `homebrew-${hb.id}`,
        name: `${hb.icon} ${hb.name}`,
        name_en: hb.name,
        level: spellData.level || 0,
        school: spellData.school || 'evocation',
        casting_time: spellData.casting_time || '1 ação',
        range: parseInt(spellData.range?.replace(/\D/g, '') || '0') || 0,
        range_type: spellData.range?.includes('Pessoal') ? 'self' : 
                    spellData.range?.includes('Toque') ? 'touch' : 'ranged',
        components: {
          verbal: spellData.components?.includes('V') || false,
          somatic: spellData.components?.includes('S') || false,
          material: spellData.components?.includes('M') || false,
        },
        duration: spellData.duration || 'Instantânea',
        concentration: spellData.duration?.toLowerCase().includes('concentração') || false,
        ritual: false,
        description_markdown: hb.description || '',
        isHomebrew: true,
      } as Spell & { isHomebrew?: boolean };
    });
  }, [homebrewSpells]);

  // Filter spells by level (cantrips = 0, 1st level spells = 1) - include homebrew
  const cantrips = useMemo(() => {
    const srdCantrips = allSpells.filter(s => s.level === 0);
    const homebrewCantrips = convertedHomebrewSpells.filter(s => s.level === 0);
    const combined = [...homebrewCantrips, ...srdCantrips]; // Homebrew first
    return combined.filter(s => 
      search === '' || s.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
      // Homebrew first, then alphabetical
      const aIsHomebrew = a.id.startsWith('homebrew-');
      const bIsHomebrew = b.id.startsWith('homebrew-');
      if (aIsHomebrew && !bIsHomebrew) return -1;
      if (!aIsHomebrew && bIsHomebrew) return 1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [allSpells, convertedHomebrewSpells, search]);

  const firstLevelSpells = useMemo(() => {
    const srdSpells = allSpells.filter(s => s.level === 1);
    const homebrewFirst = convertedHomebrewSpells.filter(s => s.level === 1);
    const combined = [...homebrewFirst, ...srdSpells];
    return combined.filter(s => 
      search === '' || s.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
      const aIsHomebrew = a.id.startsWith('homebrew-');
      const bIsHomebrew = b.id.startsWith('homebrew-');
      if (aIsHomebrew && !bIsHomebrew) return -1;
      if (!aIsHomebrew && bIsHomebrew) return 1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [allSpells, convertedHomebrewSpells, search]);

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

  const handleToggleCantrip = (spellId: string) => {
    const current = [...selectedCantrips];
    const index = current.indexOf(spellId);
    
    if (index > -1) {
      current.splice(index, 1);
    } else if (current.length < spellcastingInfo.cantrips) {
      current.push(spellId);
    }
    
    updateData({ selectedCantrips: current });
  };

  const handleToggleSpell = (spellId: string) => {
    const current = [...selectedSpells];
    const index = current.indexOf(spellId);
    
    if (index > -1) {
      current.splice(index, 1);
    } else if (current.length < spellcastingInfo.spells) {
      current.push(spellId);
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

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Magias Iniciais</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha as magias do seu {selectedClass?.name}
        </p>
      </div>

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
            <Badge variant="outline">
              {selectedCantrips.length} / {spellcastingInfo.cantrips}
            </Badge>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {cantrips.map((spell) => {
              const isSelected = selectedCantrips.includes(spell.id);
              const isDisabled = !isSelected && selectedCantrips.length >= spellcastingInfo.cantrips;

              return (
                <button
                  key={spell.id}
                  onClick={() => handleToggleCantrip(spell.id)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full glass rounded-xl p-3 text-left transition-all flex items-center gap-3",
                    isSelected && "border-primary bg-primary/10",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    !isSelected && !isDisabled && "hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                  )}>
                    {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {spell.name}
                      </h4>
                      {spell.id.startsWith('homebrew-') && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                          <Sword className="w-2.5 h-2.5 mr-0.5" />
                          Homebrew
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
                      {SCHOOLS[spell.school]} • {spell.casting_time}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 1st Level Spells */}
      {spellcastingInfo.spells > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Magias de 1º Nível</h3>
            <Badge variant="outline">
              {selectedSpells.length} / {spellcastingInfo.spells}
            </Badge>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {firstLevelSpells.map((spell) => {
              const isSelected = selectedSpells.includes(spell.id);
              const isDisabled = !isSelected && selectedSpells.length >= spellcastingInfo.spells;

              return (
                <button
                  key={spell.id}
                  onClick={() => handleToggleSpell(spell.id)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full glass rounded-xl p-3 text-left transition-all flex items-center gap-3",
                    isSelected && "border-primary bg-primary/10",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    !isSelected && !isDisabled && "hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                  )}>
                    {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {spell.name}
                      </h4>
                      {spell.id.startsWith('homebrew-') && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                          <Sword className="w-2.5 h-2.5 mr-0.5" />
                          Homebrew
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
                      {SCHOOLS[spell.school]} • {spell.casting_time}
                    </p>
                  </div>
                </button>
              );
            })}
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
                <p className="text-xs text-muted-foreground">{selectedSpell.name_en}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedSpell.level === 0 ? "Truque" : `${selectedSpell.level}º Nível`}
                  </Badge>
                  <Badge className="text-xs bg-primary/20 text-primary">
                    {SCHOOLS[selectedSpell.school]}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="glass rounded-lg p-2">
                    <span className="text-xs text-muted-foreground">Tempo</span>
                    <p className="font-medium">{selectedSpell.casting_time}</p>
                  </div>
                  <div className="glass rounded-lg p-2">
                    <span className="text-xs text-muted-foreground">Alcance</span>
                    <p className="font-medium">
                      {selectedSpell.range_type === 'self' ? 'Pessoal' : 
                       selectedSpell.range_type === 'touch' ? 'Toque' : 
                       `${selectedSpell.range}m`}
                    </p>
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

                <div>
                  <h4 className="text-sm font-semibold mb-2">Descrição</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {selectedSpell.description_markdown
                      .replace(/\*\*/g, "")
                      .replace(/###\s*/g, "\n")}
                  </p>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
