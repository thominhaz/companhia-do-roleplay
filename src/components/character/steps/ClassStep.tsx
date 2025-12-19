import { CLASSES, getAttributeName } from '@/data/srd';
import { WizardData } from '../CharacterWizard';
import { Check, Heart, Sword, Shield, Wand2, Music, Cross, Leaf, Flame, Skull, Moon, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const selectedClass = CLASSES.find(c => c.id === data.class);

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
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{charClass.name}</h3>
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

      {/* Selected Class Details */}
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
                __html: selectedClass.equipment_markdown
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>') 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
