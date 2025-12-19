import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateCharacter, CharacterInsert } from '@/hooks/useCharacters';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { RACES, CLASSES, BACKGROUNDS, ALIGNMENTS, getModifier, calculateHP, Attribute } from '@/data/srd';
import { RaceStep } from './steps/RaceStep';
import { ClassStep } from './steps/ClassStep';
import { AttributesStep } from './steps/AttributesStep';
import { BackgroundStep } from './steps/BackgroundStep';
import { ReviewStep } from './steps/ReviewStep';

export type WizardData = {
  race: string;
  subrace: string | null;
  class: string;
  attributes: Record<Attribute, number>;
  background: string;
  alignment: string;
  name: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
};

const initialData: WizardData = {
  race: '',
  subrace: null,
  class: '',
  attributes: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  background: '',
  alignment: '',
  name: '',
  personalityTraits: '',
  ideals: '',
  bonds: '',
  flaws: '',
};

const STEPS = [
  { id: 'race', title: 'Raça', description: 'Escolha sua raça' },
  { id: 'class', title: 'Classe', description: 'Escolha sua classe' },
  { id: 'attributes', title: 'Atributos', description: 'Distribua seus pontos' },
  { id: 'background', title: 'História', description: 'Defina seu background' },
  { id: 'review', title: 'Revisão', description: 'Confirme seu personagem' },
];

interface CharacterWizardProps {
  onClose: () => void;
}

export function CharacterWizard({ onClose }: CharacterWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const createCharacter = useCreateCharacter();

  const canProceed = () => {
    switch (step) {
      case 0: return !!data.race;
      case 1: return !!data.class;
      case 2: return true; // Attributes always valid with defaults
      case 3: return !!data.name && !!data.background && !!data.alignment;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1 && canProceed()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleCreate = async () => {
    if (!user) return;

    const selectedRace = RACES.find(r => r.id === data.race);
    const selectedClass = CLASSES.find(c => c.id === data.class);
    
    if (!selectedRace || !selectedClass) return;

    // Apply racial bonuses to attributes
    const finalAttributes = { ...data.attributes };
    Object.entries(selectedRace.ability_bonuses).forEach(([attr, bonus]) => {
      finalAttributes[attr as Attribute] += (bonus as number) || 0;
    });

    // Apply subrace bonuses if applicable
    if (data.subrace && selectedRace.subraces) {
      const subrace = selectedRace.subraces.find(s => s.id === data.subrace);
      if (subrace) {
        Object.entries(subrace.ability_bonuses).forEach(([attr, bonus]) => {
          finalAttributes[attr as Attribute] += (bonus as number) || 0;
        });
      }
    }

    const conModifier = getModifier(finalAttributes.constitution);
    const dexModifier = getModifier(finalAttributes.dexterity);
    const maxHp = calculateHP(selectedClass.hit_die, conModifier, 1);

    const character: CharacterInsert = {
      name: data.name,
      race: selectedRace.name,
      subrace: data.subrace ? selectedRace.subraces?.find(s => s.id === data.subrace)?.name || null : null,
      class: selectedClass.name,
      level: 1,
      experience: 0,
      max_hp: maxHp,
      current_hp: maxHp,
      temporary_hp: 0,
      armor_class: 10 + dexModifier,
      initiative: dexModifier,
      speed: selectedRace.speed,
      proficiency_bonus: 2,
      attributes: finalAttributes,
      saving_throws: {},
      skills: {},
      hit_dice: { total: 1, current: 1, diceType: `d${selectedClass.hit_die}` },
      death_saves: { successes: 0, failures: 0 },
      equipment: [],
      inventory: [],
      currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
      spellcasting: null,
      spells: [],
      background: BACKGROUNDS.find(b => b.id === data.background)?.name || data.background,
      alignment: ALIGNMENTS.find(a => a.id === data.alignment)?.name || data.alignment,
      personality_traits: data.personalityTraits,
      ideals: data.ideals,
      bonds: data.bonds,
      flaws: data.flaws,
      backstory: null,
      features: [],
      proficiencies: [],
      languages: selectedRace.languages,
      image_url: null,
    };

    await createCharacter.mutateAsync(character);
    onClose();
  };

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <RaceStep data={data} updateData={updateData} />;
      case 1:
        return <ClassStep data={data} updateData={updateData} />;
      case 2:
        return <AttributesStep data={data} updateData={updateData} />;
      case 3:
        return <BackgroundStep data={data} updateData={updateData} />;
      case 4:
        return <ReviewStep data={data} />;
      default:
        return null;
    }
  };

  if (!subscription?.canCreateCharacter) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <div className="bg-card rounded-2xl p-6 max-w-md w-full border border-border">
          <h2 className="text-xl font-bold mb-4">Limite atingido</h2>
          <p className="text-muted-foreground mb-6">
            Você atingiu o limite de {subscription?.limits.maxCharacters} personagens do plano gratuito.
            Faça upgrade para Premium para criar personagens ilimitados!
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fechar
            </Button>
            <Button className="flex-1 bg-gradient-primary">
              Fazer Upgrade
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <button onClick={onClose} className="p-2 -ml-2">
              <X className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-semibold">Novo Personagem</h1>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              size="sm"
              className="bg-gradient-primary px-4"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={createCharacter.isPending}
              size="sm"
              className="bg-gradient-primary px-4"
            >
              <Check className="w-4 h-4 mr-1" />
              {createCharacter.isPending ? 'Criando...' : 'Criar'}
            </Button>
          )}
        </div>
        
        {/* Progress */}
        <div className="flex gap-1 mt-3">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            Passo {step + 1} de {STEPS.length}
          </span>
          <span className="text-xs font-medium text-primary">
            {STEPS[step].title}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-8">
        {renderStep()}
      </main>
    </div>
  );
}
