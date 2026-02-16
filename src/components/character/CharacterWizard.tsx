import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, X, AlertTriangle, BookOpen, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCreateCharacter, CharacterInsert } from '@/hooks/useCharacters';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { RACES, CLASSES, BACKGROUNDS, ALIGNMENTS, getModifier, calculateHP, Attribute } from '@/data/srd';
import { RaceStep } from './steps/RaceStep';
import { ClassStep } from './steps/ClassStep';
import { AttributesStep } from './steps/AttributesStep';
import { SkillsStep } from './steps/SkillsStep';
import { LanguagesStep } from './steps/LanguagesStep';
import { EquipmentStep } from './steps/EquipmentStep';
import { BackgroundStep } from './steps/BackgroundStep';
import { BackstoryStep } from './steps/BackstoryStep';
import { SpellsStep } from './steps/SpellsStep';
import { ReviewStep } from './steps/ReviewStep';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export type WizardData = {
  race: string;
  subrace: string | null;
  class: string;
  subclass: string | null;
  attributes: Record<Attribute, number>;
  abilityBonusChoices: string[]; // For races like Half-Elf that let you choose attribute bonuses
  background: string;
  alignment: string;
  name: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  equipmentPack: string;
  primaryWeapon: string;
  secondaryWeapon: string;
  armor: string;
  selectedSkills: string[];
  extraLanguages: string[];
  // Custom background fields
  customBackgroundSkills: string[];
  customBackgroundProficiencies: string[]; // Can be languages or tools
  customBackgroundName: string;
  customBackgroundFeature: string;
  // Backstory fields
  age: string;
  height: string;
  weight: string;
  eyes: string;
  hair: string;
  skin: string;
  distinctiveFeatures: string;
  backstory: string;
  goals: string;
  alliesOrganizations: string;
  // Spells
  selectedCantrips: string[];
  selectedSpells: string[];
};

const initialData: WizardData = {
  race: '',
  subrace: null,
  class: '',
  subclass: null,
  attributes: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  abilityBonusChoices: [],
  background: '',
  alignment: '',
  name: '',
  personalityTraits: '',
  ideals: '',
  bonds: '',
  flaws: '',
  equipmentPack: '',
  primaryWeapon: '',
  secondaryWeapon: '',
  armor: '',
  selectedSkills: [],
  extraLanguages: [],
  customBackgroundSkills: [],
  customBackgroundProficiencies: [],
  customBackgroundName: '',
  customBackgroundFeature: '',
  age: '',
  height: '',
  weight: '',
  eyes: '',
  hair: '',
  skin: '',
  distinctiveFeatures: '',
  backstory: '',
  goals: '',
  alliesOrganizations: '',
  selectedCantrips: [],
  selectedSpells: [],
};

const STEPS = [
  { id: 'race', title: 'Raça', description: 'Escolha sua raça' },
  { id: 'class', title: 'Classe', description: 'Escolha sua classe' },
  { id: 'attributes', title: 'Atributos', description: 'Distribua seus pontos' },
  { id: 'skills', title: 'Perícias', description: 'Escolha suas perícias' },
  { id: 'languages', title: 'Idiomas', description: 'Escolha idiomas extras' },
  { id: 'equipment', title: 'Equipamento', description: 'Escolha seu equipamento' },
  { id: 'spells', title: 'Magias', description: 'Escolha suas magias' },
  { id: 'background', title: 'História', description: 'Defina seu background' },
  { id: 'backstory', title: 'Backstory', description: 'História do personagem' },
  { id: 'review', title: 'Revisão', description: 'Confirme seu personagem' },
];

interface CharacterWizardProps {
  onClose: () => void;
}

export function CharacterWizard({ onClose }: CharacterWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [showSrdModal, setShowSrdModal] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const createCharacter = useCreateCharacter();

  // Check localStorage for SRD modal preference
  useEffect(() => {
    const hideModal = localStorage.getItem('hideSrdModal');
    if (hideModal === 'true') {
      setShowSrdModal(false);
    }
  }, []);

  const handleCloseSrdModal = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideSrdModal', 'true');
    }
    setShowSrdModal(false);
  };

  // Calculate missing items for checklist
  const missingItems = useMemo(() => {
    const selectedClass = CLASSES.find(c => c.id === data.class);
    const requiredSkills = selectedClass?.proficiencies?.skills?.choose || 2;
    const items: { step: number; label: string }[] = [];
    
    if (!data.race) items.push({ step: 0, label: 'Raça' });
    if (!data.class) items.push({ step: 1, label: 'Classe' });
    if (data.selectedSkills.length < requiredSkills) {
      items.push({ step: 3, label: `Perícias (${data.selectedSkills.length}/${requiredSkills})` });
    }
    if (!data.equipmentPack) items.push({ step: 5, label: 'Equipamento inicial' });
    if (!data.name) items.push({ step: 7, label: 'Nome do personagem' });
    if (!data.background) items.push({ step: 7, label: 'Antecedente' });
    if (!data.alignment) items.push({ step: 7, label: 'Alinhamento' });
    
    return items;
  }, [data]);

  const canCreate = missingItems.length === 0;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
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

    // Apply ability bonus choices (for races like Half-Elf)
    if (data.abilityBonusChoices && data.abilityBonusChoices.length > 0) {
      data.abilityBonusChoices.forEach(attr => {
        finalAttributes[attr as Attribute] += 1;
      });
    }

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
    
    // Calculate racial HP bonus (e.g., Hill Dwarf gets +1 HP per level)
    let raceHpBonus = 0;
    if (data.subrace && selectedRace.subraces) {
      const subrace = selectedRace.subraces.find(s => s.id === data.subrace);
      if (subrace?.traits) {
        const hpTrait = subrace.traits.find(t => (t.mechanical as any)?.hp_bonus_per_level);
        if (hpTrait) {
          raceHpBonus = (hpTrait.mechanical as any).hp_bonus_per_level || 0;
        }
      }
    }
    
    const baseMaxHp = calculateHP(selectedClass.hit_die, conModifier, 1);
    const maxHp = baseMaxHp + raceHpBonus; // Apply racial HP bonus for level 1

    // Collect racial weapon proficiencies and skill proficiencies
    const racialWeaponProficiencies: string[] = [];
    const racialSkillProficiencies: string[] = [];
    
    // Check race traits for proficiencies
    selectedRace.traits.forEach(trait => {
      const mechanical = trait.mechanical as any;
      if (mechanical?.weapon_proficiencies) {
        racialWeaponProficiencies.push(...mechanical.weapon_proficiencies);
      }
      if (mechanical?.skill_proficiencies) {
        racialSkillProficiencies.push(...mechanical.skill_proficiencies);
      }
    });
    
    // Check subrace traits for proficiencies
    if (data.subrace && selectedRace.subraces) {
      const subrace = selectedRace.subraces.find(s => s.id === data.subrace);
      if (subrace?.traits) {
        subrace.traits.forEach(trait => {
          const mechanical = trait.mechanical as any;
          if (mechanical?.weapon_proficiencies) {
            racialWeaponProficiencies.push(...mechanical.weapon_proficiencies);
          }
          if (mechanical?.skill_proficiencies) {
            racialSkillProficiencies.push(...mechanical.skill_proficiencies);
          }
        });
      }
    }

    // Combine selected skills with racial skill proficiencies
    const allSkillProficiencies = [...new Set([...data.selectedSkills, ...racialSkillProficiencies])];

    // Build structured proficiencies object combining class and racial proficiencies
    const classProficiencies = selectedClass.proficiencies as { armor?: string[]; weapons?: string[]; tools?: string[] } || {};
    const allWeaponProficiencies = [
      ...(classProficiencies.weapons || []),
      ...racialWeaponProficiencies
    ];
    const allArmorProficiencies = classProficiencies.armor || [];
    const allToolProficiencies = classProficiencies.tools || [];

    const proficienciesObject = {
      armor: allArmorProficiencies,
      weapons: [...new Set(allWeaponProficiencies)],
      tools: allToolProficiencies
    } as unknown as any[];

    // Collect level 1 class features from JSON data
    const level1Features = (selectedClass.features || [])
      .filter(f => f.level === 1)
      .map(f => ({
        id: f.id,
        name: f.name,
        level: f.level,
        description: f.description_markdown || '',
        mechanical: f.mechanical || {},
      }));

    // Calculate AC - Monk gets Unarmored Defense (10 + DEX + WIS)
    let armorClass = 10 + dexModifier;
    if (selectedClass.id === 'monk') {
      const wisModifier = getModifier(finalAttributes.wisdom);
      armorClass = 10 + dexModifier + wisModifier;
    }

    // Build spellcasting object with sorcery points if applicable
    const level1Data = selectedClass.levels?.[0];
    let spellcastingObj: any = null;
    if (data.selectedCantrips.length > 0 || data.selectedSpells.length > 0) {
      spellcastingObj = {
        cantrips: data.selectedCantrips,
        knownSpells: data.selectedSpells,
      };
      // Add sorcery points for sorcerer
      if (selectedClass.id === 'sorcerer' && level1Data) {
        spellcastingObj.sorceryPoints = {
          max: (level1Data as any).sorcery_points || 0,
          current: (level1Data as any).sorcery_points || 0,
        };
      }
    }

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
      armor_class: armorClass,
      initiative: dexModifier,
      speed: Math.floor(selectedRace.speed),
      proficiency_bonus: 2,
      attributes: finalAttributes,
      saving_throws: selectedClass.saving_throw_proficiencies.reduce(
        (acc, save) => ({ ...acc, [save]: { proficient: true } }), 
        {}
      ),
      skills: allSkillProficiencies.reduce((acc, skillId) => ({ ...acc, [skillId]: { proficient: true } }), {}),
      hit_dice: { total: 1, current: 1, diceType: `d${selectedClass.hit_die}` },
      death_saves: { successes: 0, failures: 0 },
      equipment: [
        ...(data.primaryWeapon ? [{ id: 'primary', name: data.primaryWeapon, type: 'weapon' as const, equipped: true }] : []),
        ...(data.secondaryWeapon ? [{ id: 'secondary', name: data.secondaryWeapon, type: 'weapon' as const, equipped: true }] : []),
        ...(data.armor ? [{ id: 'armor', name: data.armor, type: 'armor' as const, equipped: true }] : []),
      ],
      inventory: [],
      currency: { copper: 0, silver: 0, electrum: 0, gold: 10, platinum: 0 },
      spellcasting: spellcastingObj,
      spells: [...data.selectedCantrips, ...data.selectedSpells],
      background: BACKGROUNDS.find(b => b.id === data.background)?.name || data.background,
      alignment: ALIGNMENTS.find(a => a.id === data.alignment)?.name || data.alignment,
      personality_traits: data.personalityTraits,
      ideals: data.ideals,
      bonds: data.bonds,
      flaws: data.flaws,
      backstory: data.backstory || null,
      features: level1Features,
      proficiencies: proficienciesObject,
      languages: [...selectedRace.languages, ...data.extraLanguages],
      image_url: null,
      conditions: [],
      // Physical appearance fields
      age: data.age || null,
      height: data.height || null,
      weight: data.weight || null,
      eyes: data.eyes || null,
      hair: data.hair || null,
      skin: data.skin || null,
      distinctive_features: data.distinctiveFeatures || null,
      goals: data.goals || null,
      allies_organizations: data.alliesOrganizations || null,
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
        return <SkillsStep data={data} updateData={updateData} />;
      case 4:
        return <LanguagesStep data={data} updateData={updateData} />;
      case 5:
        return <EquipmentStep data={data} updateData={updateData} />;
      case 6:
        return <SpellsStep data={data} updateData={updateData} />;
      case 7:
        return <BackgroundStep data={data} updateData={updateData} />;
      case 8:
        return <BackstoryStep data={data} updateData={updateData} />;
      case 9:
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
    <>
      {/* SRD/OGL Information Modal */}
      <Dialog open={showSrdModal} onOpenChange={setShowSrdModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <DialogTitle className="text-left">Aviso sobre Conteúdo</DialogTitle>
                <Badge variant="outline" className="mt-1 text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  SRD 5.1 / OGL
                </Badge>
              </div>
            </div>
          </DialogHeader>
          <DialogDescription className="space-y-3 text-left">
            <p>
              Este aplicativo utiliza o <strong>System Reference Document (SRD) 5.1</strong> da Wizards of the Coast, 
              disponibilizado sob a <strong>Open Game License (OGL)</strong>.
            </p>
            <p>
              Por questões de <strong>direitos autorais</strong>, algumas opções oficiais do D&D 5e 
              <strong> não estão disponíveis</strong>, incluindo:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Sub-raças além das incluídas no SRD</li>
              <li>Subclasses além das básicas</li>
              <li>Antecedentes além do Acólito</li>
              <li>Magias exclusivas de suplementos</li>
            </ul>
            <p className="text-sm">
              Opções marcadas com <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">SRD 5.1</Badge> são 
              conteúdo oficial. Você também pode criar <strong>conteúdo homebrew</strong> personalizado!
            </p>
          </DialogDescription>
          <DialogFooter className="flex-col gap-3 sm:flex-col">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="dontShowAgain" 
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <label htmlFor="dontShowAgain" className="text-xs text-muted-foreground cursor-pointer">
                Não mostrar novamente
              </label>
            </div>
            <Button onClick={handleCloseSrdModal} className="w-full bg-gradient-primary">
              Entendi, continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <div className="flex items-center gap-2">
            {/* Missing Items Indicator */}
            {missingItems.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-yellow-500 border-yellow-500/30">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-xs">{missingItems.length}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="end">
                  <p className="text-sm font-semibold mb-2 text-yellow-500">Itens Faltando</p>
                  <ul className="space-y-1">
                    {missingItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <button
                          onClick={() => setStep(item.step)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                        >
                          <X className="w-3 h-3 text-red-400" />
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            )}
            
            {step < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                size="sm"
                className="bg-gradient-primary px-4"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={createCharacter.isPending || !canCreate}
                size="sm"
                className="bg-gradient-primary px-4"
              >
                <Check className="w-4 h-4 mr-1" />
                {createCharacter.isPending ? 'Criando...' : 'Criar'}
              </Button>
            )}
          </div>
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
      <main className="flex-1 overflow-y-auto pb-24 sm:pb-8">
        {renderStep()}
      </main>
    </div>
    </>
  );
}
