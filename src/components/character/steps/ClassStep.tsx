import { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { CLASSES, getAttributeName } from '@/data/srd';
import { WizardData } from '../CharacterWizard';
import { Check, Heart, Sword, Shield, Wand2, Music, Cross, Leaf, Flame, Skull, Moon, BookOpen, Sparkles, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHomebrew } from '@/hooks/useHomebrew';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ClassStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const classIcons: Record<string, typeof Sword> = {
  barbarian: Sword,
  bard: Music,
  cleric: Cross,
  druid: Leaf,
  fighter: Shield,
  monk: Moon,
  paladin: Shield,
  ranger: Sword,
  rogue: Skull,
  sorcerer: Flame,
  warlock: Wand2,
  wizard: BookOpen,
};

export function ClassStep({ data, updateData }: ClassStepProps) {
  const { homebrewContent: homebrewClasses, isLoading: isLoadingHomebrew } = useHomebrew('class');
  const { homebrewContent: homebrewSubclasses, isLoading: isLoadingSubclasses } = useHomebrew('subclass');
  const [showSubclasses, setShowSubclasses] = useState(false);
  
  const selectedClass = CLASSES.find(c => c.id === data.class);
  const selectedHomebrewClass = homebrewClasses.find(c => c.id === data.class);
  
  // Get available subclasses for the selected class
  const availableSubclasses = useMemo(() => {
    if (!data.class) return [];
    
    // Filter homebrew subclasses that match the selected class
    return homebrewSubclasses.filter(sub => {
      const subData = sub.data as any;
      return subData?.parent_class?.toLowerCase() === data.class.toLowerCase() ||
             subData?.parentClass?.toLowerCase() === data.class.toLowerCase();
    });
  }, [data.class, homebrewSubclasses]);

  const getSkillsDisplay = (skills: { choose: number; from: string | string[] }) => {
    if (skills.from === 'any') return 'Qualquer';
    if (Array.isArray(skills.from)) {
      return skills.from.map(s => s.replace(/_/g, ' ')).join(', ');
    }
    return skills.from;
  };

  const getArmorDisplay = (armor: string[]) => {
    if (armor.length === 0) return 'Nenhuma';
    return armor.map(a => {
      const names: Record<string, string> = {
        light: 'Leve',
        medium: 'Média',
        heavy: 'Pesada',
        shields: 'Escudos',
      };
      return names[a] || a;
    }).join(', ');
  };

  const getWeaponsDisplay = (weapons: string[]) => {
    return weapons.map(w => {
      const names: Record<string, string> = {
        simple: 'Simples',
        martial: 'Marciais',
      };
      return names[w] || w.replace(/_/g, ' ');
    }).join(', ');
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Escolha sua Classe</h2>
        <p className="text-muted-foreground text-sm">
          Sua classe define suas habilidades, poderes e estilo de jogo.
        </p>
      </div>

      <div className="grid gap-3">
        {/* Homebrew Classes */}
        {homebrewClasses.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Classes Homebrew</span>
            </div>
            {homebrewClasses.map((homebrewClass) => {
              const classData = homebrewClass.data as any;
              return (
                <button
                  key={homebrewClass.id}
                  onClick={() => updateData({ class: homebrewClass.id })}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    data.class === homebrewClass.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl",
                      data.class === homebrewClass.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                      {homebrewClass.icon || '⚔️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{homebrewClass.name}</h3>
                        <Badge variant="outline" className="text-[10px] bg-primary/20 text-primary border-primary/30">
                          Homebrew
                        </Badge>
                        {data.class === homebrewClass.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {classData?.hit_die && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-destructive/20 text-destructive">
                            d{classData.hit_die}
                          </span>
                        )}
                        {classData?.primary_ability && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                            {classData.primary_ability}
                          </span>
                        )}
                      </div>
                      {homebrewClass.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {homebrewClass.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
            
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm font-medium text-muted-foreground">Classes Oficiais</span>
            </div>
          </>
        )}

        {/* Official Classes */}
        {CLASSES.map((charClass) => {
          const Icon = classIcons[charClass.id] || Sword;
          return (
            <button
              key={charClass.id}
              onClick={() => updateData({ class: charClass.id })}
              className={cn(
                "w-full p-4 rounded-xl border text-left transition-all",
                data.class === charClass.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  data.class === charClass.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{charClass.name}</h3>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                      SRD 5.1
                    </Badge>
                    {data.class === charClass.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-destructive/20 text-destructive">
                      d{charClass.hit_die}
                    </span>
                    {charClass.primary_abilities.map((ability) => (
                      <span 
                        key={ability}
                        className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                      >
                        {getAttributeName(ability)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Official Class Details */}
      {selectedClass && (
        <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border space-y-4">
          <h3 className="font-semibold">Detalhes de {selectedClass.name}</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-card">
              <p className="text-xs text-muted-foreground">Dado de Vida</p>
              <p className="font-bold text-lg text-destructive">d{selectedClass.hit_die}</p>
            </div>
            <div className="p-3 rounded-lg bg-card">
              <p className="text-xs text-muted-foreground">Atributo Principal</p>
              <p className="font-bold text-lg capitalize">
                {selectedClass.primary_abilities.map(a => getAttributeName(a)).join(' / ')}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Salvaguardas</p>
            <div className="flex flex-wrap gap-2">
              {selectedClass.saving_throw_proficiencies.map((save) => (
                <span key={save} className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary capitalize">
                  {getAttributeName(save)}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Proficiências com Armaduras</p>
            <p className="text-sm text-muted-foreground">
              {getArmorDisplay(selectedClass.proficiencies.armor)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Proficiências com Armas</p>
            <p className="text-sm text-muted-foreground">
              {getWeaponsDisplay(selectedClass.proficiencies.weapons)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">
              Perícias ({selectedClass.proficiencies.skills.choose} escolhas)
            </p>
            <p className="text-sm text-muted-foreground">
              {getSkillsDisplay(selectedClass.proficiencies.skills)}
            </p>
          </div>

          <div className="pt-3 border-t border-border">
            <p className="text-sm font-medium mb-2">Equipamento Inicial</p>
            <div 
              className="text-sm text-muted-foreground prose prose-sm prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(
                  selectedClass.equipment_markdown
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>'),
                  { ALLOWED_TAGS: ['strong', 'br'], ALLOWED_ATTR: [] }
                )
              }}
            />
          </div>

          {/* Subclass Selection */}
          {availableSubclasses.length > 0 && (
            <Collapsible open={showSubclasses} onOpenChange={setShowSubclasses}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30 mt-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      Subclasses Homebrew Disponíveis ({availableSubclasses.length})
                    </span>
                  </div>
                  {showSubclasses ? (
                    <ChevronUp className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-primary" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Subclasses são desbloqueadas no nível 3. Você pode pré-selecionar uma agora.
                </p>
                {availableSubclasses.map((subclass) => {
                  const subData = subclass.data as any;
                  return (
                    <button
                      key={subclass.id}
                      onClick={() => updateData({ subclass: subclass.id })}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all",
                        data.subclass === subclass.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-lg",
                          data.subclass === subclass.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}>
                          {subclass.icon || '⚔️'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{subclass.name}</span>
                            <Badge variant="outline" className="text-[10px] bg-primary/20 text-primary border-primary/30">
                              Homebrew
                            </Badge>
                            {data.subclass === subclass.id && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          {subclass.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {subclass.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}

      {/* Selected Homebrew Class Details */}
      {selectedHomebrewClass && (
        <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{selectedHomebrewClass.name}</h3>
            <Badge variant="outline" className="text-[10px] bg-primary/20 text-primary border-primary/30">
              Homebrew
            </Badge>
          </div>
          
          {(() => {
            const classData = selectedHomebrewClass.data as any;
            return (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {classData?.hit_die && (
                    <div className="p-3 rounded-lg bg-card">
                      <p className="text-xs text-muted-foreground">Dado de Vida</p>
                      <p className="font-bold text-lg text-destructive">d{classData.hit_die}</p>
                    </div>
                  )}
                  {classData?.primary_ability && (
                    <div className="p-3 rounded-lg bg-card">
                      <p className="text-xs text-muted-foreground">Atributo Principal</p>
                      <p className="font-bold text-lg capitalize">{classData.primary_ability}</p>
                    </div>
                  )}
                </div>

                {classData?.saving_throws && (
                  <div>
                    <p className="text-sm font-medium mb-2">Salvaguardas</p>
                    <div className="flex flex-wrap gap-2">
                      {classData.saving_throws.map((save: string) => (
                        <span key={save} className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary capitalize">
                          {save}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {classData?.features && classData.features.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Características</p>
                    <div className="space-y-2">
                      {classData.features.slice(0, 3).map((feature: any, idx: number) => (
                        <div key={idx} className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{feature.name}</span>
                          {feature.level && <span className="text-xs ml-1">(Nível {feature.level})</span>}
                        </div>
                      ))}
                      {classData.features.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{classData.features.length - 3} características...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedHomebrewClass.description && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm font-medium mb-2">Descrição</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedHomebrewClass.description}
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
