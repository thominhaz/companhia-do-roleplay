import { WizardData } from '../CharacterWizard';
import { CLASSES } from '@/data/srd';
import { cn } from '@/lib/utils';
import { Check, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import skillsData from '@/data/rules/pericias.json';

interface SkillsStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

// Map English skill IDs to Portuguese names
const SKILL_MAP: Record<string, string> = {
  acrobatics: 'Acrobacia',
  animal_handling: 'Adestrar Animais',
  arcana: 'Arcanismo',
  athletics: 'Atletismo',
  deception: 'Enganação',
  history: 'História',
  insight: 'Intuição',
  intimidation: 'Intimidação',
  investigation: 'Investigação',
  medicine: 'Medicina',
  nature: 'Natureza',
  perception: 'Percepção',
  performance: 'Atuação',
  persuasion: 'Persuasão',
  religion: 'Religião',
  sleight_of_hand: 'Prestidigitação',
  stealth: 'Furtividade',
  survival: 'Sobrevivência',
};

const ABILITY_COLORS: Record<string, string> = {
  'Força': 'text-red-400',
  'Destreza': 'text-green-400',
  'Inteligência': 'text-blue-400',
  'Sabedoria': 'text-yellow-400',
  'Carisma': 'text-pink-400',
};

export function SkillsStep({ data, updateData }: SkillsStepProps) {
  const selectedClass = CLASSES.find(c => c.id === data.class);
  const skillOptions = selectedClass?.proficiencies?.skills;
  
  if (!skillOptions) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Nenhuma perícia disponível para esta classe.
      </div>
    );
  }

  const availableSkillIds = Array.isArray(skillOptions.from) ? skillOptions.from : [];
  const maxChoices = skillOptions.choose || 2;
  const selectedSkills = data.selectedSkills || [];

  const availableSkills = availableSkillIds.map((skillId: string) => {
    const skillName = SKILL_MAP[skillId];
    const skillInfo = skillsData.skills.find(s => s.name === skillName);
    return {
      id: skillId,
      name: skillName || skillId,
      ability: skillInfo?.ability || 'Desconhecido',
      description: skillInfo?.description || '',
    };
  }).sort((a, b) => a.ability.localeCompare(b.ability) || a.name.localeCompare(b.name));

  const handleToggleSkill = (skillId: string) => {
    const current = [...selectedSkills];
    const index = current.indexOf(skillId);
    
    if (index > -1) {
      current.splice(index, 1);
    } else if (current.length < maxChoices) {
      current.push(skillId);
    }
    
    updateData({ selectedSkills: current });
  };

  const groupedSkills = availableSkills.reduce((acc, skill) => {
    if (!acc[skill.ability]) {
      acc[skill.ability] = [];
    }
    acc[skill.ability].push(skill);
    return acc;
  }, {} as Record<string, typeof availableSkills>);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">
          Proficiências em Perícias
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha <span className="text-primary font-semibold">{maxChoices}</span> perícias
        </p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
          <span className="text-sm">
            {selectedSkills.length} / {maxChoices} selecionadas
          </span>
        </div>
      </div>

      {/* Skills by Ability */}
      <div className="space-y-4">
        {Object.entries(groupedSkills).map(([ability, skills]) => (
          <div key={ability} className="space-y-2">
            <h3 className={cn("text-sm font-semibold uppercase tracking-wider", ABILITY_COLORS[ability] || 'text-muted-foreground')}>
              {ability}
            </h3>
            <div className="space-y-2">
              {(skills as typeof availableSkills).map((skill) => {
                const isSelected = selectedSkills.includes(skill.id);
                const isDisabled = !isSelected && selectedSkills.length >= maxChoices;

                return (
                  <button
                    key={skill.id}
                    onClick={() => handleToggleSkill(skill.id)}
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
                        <h4 className="text-sm font-semibold text-foreground">
                          {skill.name}
                        </h4>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{skill.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {skill.description.slice(0, 60)}...
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
