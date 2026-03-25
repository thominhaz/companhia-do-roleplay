import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, X, AlertTriangle, BookOpen, Info, Users, Sword, BarChart3, Brain, Globe, Package, Wand2, ScrollText, Feather, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCreateCharacter, CharacterInsert } from '@/hooks/useCharacters';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { RACES, CLASSES, BACKGROUNDS, ALIGNMENTS, ALL_SKILLS, getModifier, calculateHP, Attribute } from '@/data/srd';
import armaduras from '@/data/equipment/armaduras.json';
import armasJson from '@/data/equipment/armas.json';
import pacotesData from '@/data/equipment/pacotes-iniciais.json';
import { useHomebrew } from '@/hooks/useHomebrew';
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
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
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
  equipmentChoices: Record<number, number>;
  equipmentCategorySelections: Record<string, string>;
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
  equipmentChoices: {},
  equipmentCategorySelections: {},
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
  { id: 'race', title: 'Raça', icon: Users },
  { id: 'class', title: 'Classe', icon: Sword },
  { id: 'attributes', title: 'Atributos', icon: BarChart3 },
  { id: 'skills', title: 'Perícias', icon: Brain },
  { id: 'languages', title: 'Idiomas', icon: Globe },
  { id: 'equipment', title: 'Equip.', icon: Package },
  { id: 'spells', title: 'Magias', icon: Wand2 },
  { id: 'background', title: 'História', icon: ScrollText },
  { id: 'backstory', title: 'Backstory', icon: Feather },
  { id: 'review', title: 'Revisão', icon: ClipboardCheck },
];

interface CharacterWizardProps {
  onClose: () => void;
}

export function CharacterWizard({ onClose }: CharacterWizardProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for back, 1 for forward
  const [data, setData] = useState<WizardData>(initialData);
  const [showSrdModal, setShowSrdModal] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const stepperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const createCharacter = useCreateCharacter();
  const { homebrewContent: homebrewRaces } = useHomebrew('race');
  const { homebrewContent: homebrewBackgrounds } = useHomebrew('background');
  const { homebrewContent: homebrewSubclasses } = useHomebrew('subclass');

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
    const classData = CLASSES.find(c => c.id === data.class || c.name.toLowerCase() === data.class);
    const totalChoices = classData?.starting_equipment?.choices?.length || 0;
    const madeChoices = Object.keys(data.equipmentChoices).length;
    if (totalChoices > 0 && madeChoices < totalChoices) {
      items.push({ step: 5, label: `Equipamento (${madeChoices}/${totalChoices} escolhas)` });
    }
    if (!data.name) items.push({ step: 7, label: 'Nome do personagem' });
    if (!data.background) items.push({ step: 7, label: 'Antecedente' });
    if (!data.alignment) items.push({ step: 7, label: 'Alinhamento' });
    
    return items;
  }, [data]);

  const canCreate = missingItems.length === 0;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep !== step) {
      setDirection(targetStep > step ? 1 : -1);
      setStep(targetStep);
    }
  };

  // Scroll active step into view in stepper
  useEffect(() => {
    if (stepperRef.current) {
      const activeEl = stepperRef.current.querySelector(`[data-step="${step}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [step]);

  const handleCreate = async () => {
    if (!user) return;

    const selectedRace = RACES.find(r => r.id === data.race);
    const selectedHomebrewRace = homebrewRaces.find(r => r.id === data.race);
    const selectedClass = CLASSES.find(c => c.id === data.class);
    
    if ((!selectedRace && !selectedHomebrewRace) || !selectedClass) return;

    // Normalize homebrew race data
    const homebrewRaceData = selectedHomebrewRace?.data as any;
    const raceAbilityBonuses: Partial<Record<Attribute, number>> = selectedRace?.ability_bonuses || homebrewRaceData?.ability_bonuses || {};
    const raceName = selectedRace?.name || selectedHomebrewRace?.name || data.race;
    const raceSpeed = selectedRace?.speed || homebrewRaceData?.speed || 9;
    const raceLanguages: string[] = selectedRace?.languages || (
      homebrewRaceData?.languages
        ? (typeof homebrewRaceData.languages === 'string' 
            ? homebrewRaceData.languages.split(',').map((l: string) => l.trim())
            : homebrewRaceData.languages)
        : ['Comum']
    );

    // Apply racial bonuses to attributes
    const finalAttributes = { ...data.attributes };
    Object.entries(raceAbilityBonuses).forEach(([attr, bonus]) => {
      finalAttributes[attr as Attribute] += (bonus as number) || 0;
    });

    // Apply ability bonus choices (for races like Half-Elf)
    if (data.abilityBonusChoices && data.abilityBonusChoices.length > 0) {
      data.abilityBonusChoices.forEach(attr => {
        finalAttributes[attr as Attribute] += 1;
      });
    }

    // Apply subrace bonuses if applicable (SRD or homebrew)
    const srdSubrace = data.subrace && selectedRace?.subraces 
      ? selectedRace.subraces.find(s => s.id === data.subrace) 
      : null;
    const homebrewSubrace = data.subrace && homebrewRaceData?.subraces
      ? (homebrewRaceData.subraces as any[]).find((s: any) => s.id === data.subrace)
      : null;
    const activeSubrace = srdSubrace || homebrewSubrace;
    
    if (activeSubrace?.ability_bonuses) {
      Object.entries(activeSubrace.ability_bonuses).forEach(([attr, bonus]) => {
        finalAttributes[attr as Attribute] += (bonus as number) || 0;
      });
    }

    const conModifier = getModifier(finalAttributes.constitution);
    const dexModifier = getModifier(finalAttributes.dexterity);
    
    // Calculate racial HP bonus from traits (race + subrace, SRD + homebrew)
    let raceHpBonus = 0;
    const collectHpBonus = (traits: any[]) => {
      if (!traits) return;
      traits.forEach((t: any) => {
        const mech = t.mechanical || {};
        if (mech.hp_bonus_per_level) raceHpBonus += mech.hp_bonus_per_level;
      });
    };
    // Check SRD subrace traits
    if (srdSubrace?.traits) collectHpBonus(srdSubrace.traits);
    // Check homebrew race traits
    if (homebrewRaceData?.traits && Array.isArray(homebrewRaceData.traits)) {
      collectHpBonus(homebrewRaceData.traits.filter((t: any) => typeof t === 'object'));
    }
    // Check homebrew subrace traits
    if (homebrewSubrace?.traits) collectHpBonus(homebrewSubrace.traits);
    
    const baseMaxHp = calculateHP(selectedClass.hit_die, conModifier, 1);
    const maxHp = baseMaxHp + raceHpBonus;

    // Collect racial weapon proficiencies and skill proficiencies (SRD + homebrew)
    const racialWeaponProficiencies: string[] = [];
    const racialSkillProficiencies: string[] = [];
    
    const collectProficiencies = (traits: any[]) => {
      if (!traits) return;
      traits.forEach((t: any) => {
        const mech = t.mechanical || {};
        if (mech.weapon_proficiencies) racialWeaponProficiencies.push(...mech.weapon_proficiencies);
        if (mech.skill_proficiencies) racialSkillProficiencies.push(...mech.skill_proficiencies);
      });
    };

    if (selectedRace) {
      collectProficiencies(selectedRace.traits);
      if (srdSubrace?.traits) collectProficiencies(srdSubrace.traits);
    }
    
    // Homebrew race-level proficiencies
    if (homebrewRaceData) {
      if (homebrewRaceData.weapon_proficiencies) racialWeaponProficiencies.push(...homebrewRaceData.weapon_proficiencies);
      if (homebrewRaceData.skill_proficiencies) racialSkillProficiencies.push(...homebrewRaceData.skill_proficiencies);
      // Homebrew structured traits
      if (Array.isArray(homebrewRaceData.traits)) {
        collectProficiencies(homebrewRaceData.traits.filter((t: any) => typeof t === 'object'));
      }
      // Homebrew subrace traits
      if (homebrewSubrace?.traits) collectProficiencies(homebrewSubrace.traits);
    }

    // Collect background skill proficiencies
    const backgroundSkillProficiencies: string[] = [];
    
    // Custom background skills
    if (data.background === 'custom' && data.customBackgroundSkills.length > 0) {
      backgroundSkillProficiencies.push(...data.customBackgroundSkills);
    } else {
      // SRD background skills
      const srdBackground = BACKGROUNDS.find(b => b.id === data.background);
      if (srdBackground && srdBackground.skills.length > 0) {
        backgroundSkillProficiencies.push(...srdBackground.skills);
      } else {
        // Homebrew background skills
        const homebrewBg = homebrewBackgrounds.find(b => b.id === data.background);
        if (homebrewBg) {
          const bgData = homebrewBg.data as any;
          const bgSkills: string[] = bgData?.skill_proficiencies || [];
          // Convert Portuguese skill names to IDs
          bgSkills.forEach(skillName => {
            const skillEntry = ALL_SKILLS.find(s => 
              s.name.toLowerCase() === skillName.toLowerCase() || s.id === skillName
            );
            if (skillEntry) {
              backgroundSkillProficiencies.push(skillEntry.id);
            }
          });
        }
      }
    }

    // Combine selected skills with racial and background skill proficiencies
    const allSkillProficiencies = [...new Set([...data.selectedSkills, ...racialSkillProficiencies, ...backgroundSkillProficiencies])];

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

    // Merge homebrew subclass features
    if (data.subclass) {
      const selectedSubclass = homebrewSubclasses.find(s => s.id === data.subclass);
      if (selectedSubclass) {
        const subData = selectedSubclass.data as any;
        const subFeatures = subData?.features || [];
        subFeatures.forEach((f: any) => {
          level1Features.push({
            id: f.id || `subclass-${f.name?.toLowerCase().replace(/\s+/g, '-')}`,
            name: `${f.name} (${selectedSubclass.name})`,
            level: f.level || 1,
            description: f.description || f.description_markdown || '',
            mechanical: f.mechanical || {},
          });
        });
      }
    }

    // ========== Build equipment and inventory from dynamic choices ==========
    
    // Collect all selected items from equipment choices + granted
    const allSelectedItems: { id: string; quantity: number }[] = [];
    
    const startEquip = selectedClass?.starting_equipment;
    if (startEquip?.choices) {
      startEquip.choices.forEach((choice: any, choiceIdx: number) => {
        const optionIdx = data.equipmentChoices[choiceIdx];
        if (optionIdx === undefined) return;
        const optionItems = choice.from[optionIdx];
        if (!optionItems) return;
        
        optionItems.forEach((rawItem: string) => {
          const parts = rawItem.split(':');
          const itemId = parts[0];
          const qty = parts.length > 1 ? parseInt(parts[1], 10) : 1;
          
          const catKey = `${choiceIdx}-${optionIdx}-${itemId}`;
          const specificSelection = data.equipmentCategorySelections[catKey];
          
          if (specificSelection) {
            allSelectedItems.push({ id: specificSelection, quantity: qty });
          } else {
            allSelectedItems.push({ id: itemId, quantity: qty });
          }
        });
      });
    }
    
    if (startEquip?.granted) {
      startEquip.granted.forEach((rawItem: string) => {
        const parts = rawItem.split(':');
        allSelectedItems.push({ 
          id: parts[0], 
          quantity: parts.length > 1 ? parseInt(parts[1], 10) : 1 
        });
      });
    }

    // Helper to resolve item name
    const miscNames: Record<string, string> = {
      shield: 'Escudo', wooden_shield: 'Escudo de Madeira', holy_symbol: 'Símbolo Sagrado',
      druidic_focus: 'Foco Druídico', component_pouch: 'Bolsa de Componentes',
      arcane_focus: 'Foco Arcano', thieves_tools: 'Ferramentas de Ladrão',
      spellbook: 'Grimório', crossbow_bolts: 'Virotes', arrows: 'Flechas',
      lute: 'Alaúde', musical_instrument: 'Instrumento Musical',
    };
    const resolveItemName = (itemId: string): string => {
      if (itemId.startsWith('homebrew:')) return itemId.replace('homebrew:', '');
      const weapon = armasJson.items.find(w => w.id === itemId);
      if (weapon) return weapon.name;
      const armorItem = armaduras.items.find(a => a.id === itemId);
      if (armorItem) return armorItem.name;
      return miscNames[itemId] || itemId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const equipmentItems: any[] = [];
    const inventoryItems: { id: string; name: string; quantity: number; description?: string }[] = [];
    let armorForAC: string | null = null;
    let hasShield = false;
    
    allSelectedItems.forEach((item, idx) => {
      const { id: itemId, quantity } = item;
      const name = resolveItemName(itemId);
      
      // Pack → expand into inventory
      const packData = pacotesData.equipment_packs.packs.find(p => p.id === itemId);
      if (packData) {
        packData.items.forEach((packItem: any, packIdx: number) => {
          inventoryItems.push({
            id: `pack-${idx}-${packIdx}`,
            name: packItem.item_pt,
            quantity: packItem.quantity,
            description: packItem.unit || undefined,
          });
        });
        return;
      }
      
      const isWeapon = !!armasJson.items.find(w => w.id === itemId) || itemId.startsWith('homebrew:');
      const armorInfo = armaduras.items.find(a => a.id === itemId);
      const isShieldItem = itemId === 'shield' || itemId === 'wooden_shield' || armorInfo?.category === 'shield';
      
      if (isWeapon) {
        for (let q = 0; q < quantity; q++) {
          equipmentItems.push({ id: `equip-${idx}-${q}`, name, type: 'weapon' as const, equipped: true });
        }
      } else if (armorInfo || isShieldItem) {
        equipmentItems.push({
          id: `equip-${idx}`,
          name,
          type: (isShieldItem ? 'shield' : 'armor') as 'armor' | 'shield',
          equipped: true,
          ...(armorInfo ? {
            armorClass: isShieldItem ? (armorInfo.armor_class as any).bonus : armorInfo.armor_class.base,
            armorCategory: armorInfo.category,
            maxDexBonus: armorInfo.armor_class.max_dex_bonus,
          } : {}),
        });
        if (isShieldItem) hasShield = true;
        else if (armorInfo) armorForAC = itemId;
      } else {
        inventoryItems.push({ id: `item-${idx}`, name, quantity });
      }
    });

    // Calculate AC
    let armorClass = 10 + dexModifier;
    
    if (armorForAC) {
      const selectedArmor = armaduras.items.find(a => a.id === armorForAC);
      if (selectedArmor) {
        if (selectedArmor.category === 'heavy') {
          armorClass = selectedArmor.armor_class.base;
        } else if (selectedArmor.category === 'medium') {
          const maxDex = selectedArmor.armor_class.max_dex_bonus ?? 2;
          armorClass = selectedArmor.armor_class.base + Math.min(dexModifier, maxDex);
        } else {
          armorClass = selectedArmor.armor_class.base + dexModifier;
        }
      }
    } else if (selectedClass.id === 'monk') {
      const wisModifier = getModifier(finalAttributes.wisdom);
      armorClass = 10 + dexModifier + wisModifier;
    } else if (selectedClass.id === 'barbarian' || selectedClass.id === 'barbaro') {
      armorClass = 10 + dexModifier + conModifier;
    }
    
    if (hasShield) armorClass += 2;

    // Build spellcasting object with sorcery points if applicable
    const level1Data = selectedClass.levels?.[0];
    let spellcastingObj: any = null;
    if (data.selectedCantrips.length > 0 || data.selectedSpells.length > 0) {
      spellcastingObj = {
        cantrips: data.selectedCantrips,
        knownSpells: data.selectedSpells,
      };
      if (selectedClass.id === 'sorcerer' && level1Data) {
        spellcastingObj.sorceryPoints = {
          max: (level1Data as any).sorcery_points || 0,
          current: (level1Data as any).sorcery_points || 0,
        };
      }
    }

    // Resolve background name
    let backgroundName: string;
    if (data.background === 'custom') {
      backgroundName = data.customBackgroundName || 'Customizado';
    } else {
      const srdBg = BACKGROUNDS.find(b => b.id === data.background);
      const homebrewBg = homebrewBackgrounds.find(b => b.id === data.background);
      backgroundName = srdBg?.name || homebrewBg?.name || data.background;
    }

    const character: CharacterInsert = {
      name: data.name,
      race: raceName,
      subrace: activeSubrace?.name || null,
      class: selectedClass.name,
      level: 1,
      experience: 0,
      max_hp: maxHp,
      current_hp: maxHp,
      temporary_hp: 0,
      armor_class: armorClass,
      initiative: dexModifier,
      speed: Math.floor(raceSpeed),
      proficiency_bonus: 2,
      attributes: finalAttributes,
      saving_throws: selectedClass.saving_throw_proficiencies.reduce(
        (acc, save) => ({ ...acc, [save]: { proficient: true } }), 
        {}
      ),
      skills: allSkillProficiencies.reduce((acc, skillId) => ({ ...acc, [skillId]: { proficient: true } }), {}),
      hit_dice: { total: 1, current: 1, diceType: `d${selectedClass.hit_die}` },
      death_saves: { successes: 0, failures: 0 },
      equipment: equipmentItems,
      inventory: inventoryItems,
      currency: { copper: 0, silver: 0, electrum: 0, gold: 10, platinum: 0 },
      spellcasting: spellcastingObj,
      spells: [...data.selectedCantrips, ...data.selectedSpells],
      background: backgroundName,
      alignment: ALIGNMENTS.find(a => a.id === data.alignment)?.name || data.alignment,
      personality_traits: data.personalityTraits,
      ideals: data.ideals,
      bonds: data.bonds,
      flaws: data.flaws,
      backstory: data.backstory || null,
      features: level1Features,
      proficiencies: proficienciesObject,
      languages: [...raceLanguages, ...data.extraLanguages],
      image_url: null,
      conditions: [],
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
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5">
          {step > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-xl">
              <X className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            {/* Missing Items Indicator */}
            {missingItems.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 text-destructive border-destructive/30 bg-destructive/10 hover:bg-destructive/20">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{missingItems.length}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="end">
                  <p className="text-sm font-semibold mb-2 text-destructive">Itens Faltando</p>
                  <ul className="space-y-1.5">
                    {missingItems.map((item, i) => (
                      <li key={i}>
                        <button
                          onClick={() => handleStepClick(item.step)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 w-full text-left"
                        >
                          <X className="w-3 h-3 text-destructive shrink-0" />
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-4 rounded-xl gap-1 shadow-depth-md"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={createCharacter.isPending || !canCreate}
                size="sm"
                className="bg-gradient-primary h-8 px-4 rounded-xl gap-1"
              >
                <Check className="w-4 h-4" />
                {createCharacter.isPending ? 'Criando...' : 'Criar'}
              </Button>
            )}
          </div>
        </div>
        
        {/* Stepper with icons - horizontal scroll */}
        <div 
          ref={stepperRef}
          className="flex gap-1 px-3 pb-3 overflow-x-auto scrollbar-hide"
        >
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            const isActive = i === step;
            const isCompleted = i < step;
            const isClickable = true;

            return (
              <button
                key={s.id}
                data-step={i}
                onClick={() => isClickable && handleStepClick(i)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0",
                  isActive && "bg-primary/15 text-primary border border-primary/30",
                  isCompleted && !isActive && "bg-muted/50 text-foreground/70 border border-transparent",
                  !isActive && !isCompleted && "text-muted-foreground border border-transparent hover:bg-muted/30"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center shrink-0",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && !isActive && "bg-primary/20 text-primary",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}>
                  {isCompleted && !isActive ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <StepIcon className="w-3 h-3" />
                  )}
                </div>
                <span className={cn(isActive && "font-semibold")}>
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Content with slide transitions */}
      <main className="flex-1 overflow-y-auto pb-24 sm:pb-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
    </>
  );
}
