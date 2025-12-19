import { CLASSES } from '@/data/srd';
import { WizardData } from '../CharacterWizard';
import { Check, Heart, Sword, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

const classIcons: Record<string, typeof Sword> = {
  barbarian: Sword,
  bard: Heart,
  cleric: Shield,
  druid: Shield,
  fighter: Sword,
  monk: Sword,
  paladin: Shield,
  ranger: Sword,
  rogue: Sword,
  sorcerer: Heart,
  warlock: Heart,
  wizard: Heart,
};

export function ClassStep({ data, updateData }: ClassStepProps) {
  const selectedClass = CLASSES.find(c => c.id === data.class);

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
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {charClass.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-destructive/20 text-destructive">
                      {charClass.hitDice}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                      {charClass.primaryAbility.slice(0, 3).toUpperCase()} principal
                    </span>
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
              <p className="font-bold text-lg text-destructive">{selectedClass.hitDice}</p>
            </div>
            <div className="p-3 rounded-lg bg-card">
              <p className="text-xs text-muted-foreground">Atributo Principal</p>
              <p className="font-bold text-lg capitalize">{selectedClass.primaryAbility}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Salvaguardas</p>
            <div className="flex flex-wrap gap-2">
              {selectedClass.savingThrows.map((save) => (
                <span key={save} className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary capitalize">
                  {save}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Proficiências com Armaduras</p>
            <p className="text-sm text-muted-foreground">
              {selectedClass.armorProficiencies.length > 0 
                ? selectedClass.armorProficiencies.join(', ')
                : 'Nenhuma'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Proficiências com Armas</p>
            <p className="text-sm text-muted-foreground">
              {selectedClass.weaponProficiencies.join(', ')}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Perícias ({selectedClass.numSkillChoices} escolhas)</p>
            <div className="flex flex-wrap gap-1">
              {selectedClass.skillChoices.map((skill) => (
                <span key={skill} className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
