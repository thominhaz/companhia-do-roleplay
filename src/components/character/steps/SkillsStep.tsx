import { WizardData } from '../CharacterWizard';
import { CLASSES, RACES } from '@/data/srd';
import { cn } from '@/lib/utils';
import { Check, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import skillsData from '@/data/rules/pericias.json';
import { useHomebrew } from '@/hooks/useHomebrew';

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

// Reverse map: Portuguese to English ID
const SKILL_NAME_TO_ID: Record<string, string> = Object.entries(SKILL_MAP).reduce(
  (acc, [id, name]) => ({ ...acc, [name]: id }),
  {}
);

const ABILITY_COLORS: Record<string, string> = {
  'Força': 'text-red-400',
  'Destreza': 'text-green-400',
  'Inteligência': 'text-blue-400',
  'Sabedoria': 'text-yellow-400',
  'Carisma': 'text-pink-400',
};

export function SkillsStep({ data, updateData }: SkillsStepProps) {
  const { homebrewContent: homebrewClasses } = useHomebrew('class');
  
  // Check for official class first
  const selectedClass = CLASSES.find(c => c.id === data.class);
  const selectedHomebrewClass = homebrewClasses.find(c => c.id === data.class);
  const selectedRace = RACES.find(r => r.id === data.race);
  const selectedHomebrewRace = homebrewRaces.find(r => r.id === data.race) as any;
  
  let availableSkillIds: string[] = [];
  let classMaxChoices = 2;
  
  if (selectedClass) {
    // Official class
    const skillOptions = selectedClass.proficiencies?.skills;
    if (skillOptions) {
      if (skillOptions.from === 'any') {
        // Classes like Bard can choose from any skill
        availableSkillIds = Object.keys(SKILL_MAP);
      } else if (Array.isArray(skillOptions.from)) {
        availableSkillIds = skillOptions.from;
      }
      classMaxChoices = skillOptions.choose || 2;
    }
  } else if (selectedHomebrewClass) {
    // Homebrew class
    const classData = selectedHomebrewClass.data as any;
    if (classData?.available_skills && Array.isArray(classData.available_skills)) {
      // Homebrew skills are stored in Portuguese, convert to IDs
      availableSkillIds = classData.available_skills.map((skillName: string) => {
        return SKILL_NAME_TO_ID[skillName] || skillName.toLowerCase().replace(/ /g, '_');
      });
      classMaxChoices = classData.skill_choices || 2;
    }
  }

  // Check for racial skill proficiency choices (e.g., Half-Elf "Skill Versatility")
  let racialSkillChoices = 0;
  if (selectedRace?.traits) {
    selectedRace.traits.forEach(trait => {
      const mechanical = trait.mechanical as any;
      if (mechanical?.skill_proficiencies_choice?.count) {
        racialSkillChoices += mechanical.skill_proficiencies_choice.count;
      }
    });
  }

  // If race grants extra skill choices, expand available skills to all
  if (racialSkillChoices > 0) {
    // Racial skill choices can be from any skill
    const allSkillIds = Object.keys(SKILL_MAP);
    availableSkillIds = [...new Set([...availableSkillIds, ...allSkillIds])];
  }

  const maxChoices = classMaxChoices + racialSkillChoices;
  
  if (availableSkillIds.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Nenhuma perícia disponível para esta classe.
      </div>
    );
  }

  const selectedSkills = data.selectedSkills || [];

  const availableSkills = availableSkillIds.map((skillId: string) => {
    const skillName = SKILL_MAP[skillId] || skillId;
    const skillInfo = skillsData.skills.find(s => s.name === skillName);
    return {
      id: skillId,
      name: skillName,
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
          {racialSkillChoices > 0 && (
            <span className="block text-xs text-secondary mt-0.5">
              ({classMaxChoices} da classe + {racialSkillChoices} racial)
            </span>
          )}
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
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs z-[9999]">
                              <p className="text-xs">{skill.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
