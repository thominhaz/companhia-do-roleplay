import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { RACES, CLASSES, getModifier, calculateHP, type Attribute } from '@/data/srd';
import type { BuilderData, LevelChoice, CharacterDB } from '@/hooks/useCharacters';

// ===========================
// Types
// ===========================

export type BuilderMode = 'create' | 'edit';

export interface BuilderState {
  mode: BuilderMode;
  characterId?: string;
  currentStep: number;
  builderData: BuilderData;
  levelChoices: LevelChoice[];
  currentLevel: number;
  // Personality / backstory (non-mechanical)
  name: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
  age: string;
  height: string;
  weight: string;
  eyes: string;
  hair: string;
  skin: string;
  distinctiveFeatures: string;
  goals: string;
  alliesOrganizations: string;
  imageUrl?: string;
}

export interface BuilderContextValue extends BuilderState {
  // Navigation
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  // Data
  updateBuilderData: (partial: Partial<BuilderData>) => void;
  updateLevelChoice: (level: number, partial: Partial<LevelChoice>) => void;
  updatePersonal: (partial: Partial<Omit<BuilderState, 'mode' | 'characterId' | 'currentStep' | 'builderData' | 'levelChoices' | 'currentLevel'>>) => void;
  // Derived
  getComputedAttributes: () => Record<string, number>;
  getComputedHP: () => number;
  getClassLevel: (classId: string, upToLevel?: number) => number;
  // State
  setState: (state: Partial<BuilderState>) => void;
  // Persistence helpers
  loadFromCharacter: (character: CharacterDB) => void;
  addLevel: () => void;
  totalSteps: number;
}

// ===========================
// Constants
// ===========================

export const BUILDER_STEPS = [
  { id: 'race', title: 'Raça' },
  { id: 'class', title: 'Classe' },
  { id: 'attributes', title: 'Atributos' },
  { id: 'skills', title: 'Perícias' },
  { id: 'languages', title: 'Idiomas' },
  { id: 'equipment', title: 'Equipamento' },
  { id: 'spells', title: 'Magias' },
  { id: 'background', title: 'História' },
  { id: 'backstory', title: 'Backstory' },
  { id: 'review', title: 'Revisão' },
] as const;

const CLASS_HIT_DICE: Record<string, { die: number; avg: number }> = {
  barbaro: { die: 12, avg: 7 },
  bardo: { die: 8, avg: 5 },
  bruxo: { die: 8, avg: 5 },
  clerigo: { die: 8, avg: 5 },
  druida: { die: 8, avg: 5 },
  feiticeiro: { die: 6, avg: 4 },
  guerreiro: { die: 10, avg: 6 },
  ladino: { die: 8, avg: 5 },
  mago: { die: 6, avg: 4 },
  monge: { die: 8, avg: 5 },
  paladino: { die: 10, avg: 6 },
  patrulheiro: { die: 10, avg: 6 },
};

// ===========================
// Defaults
// ===========================

const defaultBuilderData: BuilderData = {};

const defaultState: BuilderState = {
  mode: 'create',
  currentStep: 0,
  builderData: defaultBuilderData,
  levelChoices: [],
  currentLevel: 1,
  name: '',
  personalityTraits: '',
  ideals: '',
  bonds: '',
  flaws: '',
  backstory: '',
  age: '',
  height: '',
  weight: '',
  eyes: '',
  hair: '',
  skin: '',
  distinctiveFeatures: '',
  goals: '',
  alliesOrganizations: '',
};

// ===========================
// Context
// ===========================

const BuilderCtx = createContext<BuilderContextValue | null>(null);

export function useBuilderContext() {
  const ctx = useContext(BuilderCtx);
  if (!ctx) throw new Error('useBuilderContext must be used within BuilderProvider');
  return ctx;
}

// ===========================
// Provider
// ===========================

interface BuilderProviderProps {
  children: ReactNode;
  mode: BuilderMode;
  characterId?: string;
  initialCharacter?: CharacterDB | null;
}

export function BuilderProvider({ children, mode, characterId, initialCharacter }: BuilderProviderProps) {
  const [state, setStateRaw] = useState<BuilderState>(() => {
    const base: BuilderState = { ...defaultState, mode, characterId };
    if (initialCharacter && mode === 'edit') {
      return populateFromCharacter(base, initialCharacter);
    }
    return base;
  });

  const setState = useCallback((partial: Partial<BuilderState>) => {
    setStateRaw(prev => ({ ...prev, ...partial }));
  }, []);

  const goToStep = useCallback((step: number) => setState({ currentStep: step }), [setState]);
  const totalStepsRef = BUILDER_STEPS.length; // base steps only for nav bounds
  const nextStep = useCallback(() => setStateRaw(prev => {
    const maxStep = BUILDER_STEPS.length + prev.levelChoices.filter(lc => lc.level > 1).length - 1;
    return { ...prev, currentStep: Math.min(prev.currentStep + 1, maxStep) };
  }), []);
  const prevStep = useCallback(() => setStateRaw(prev => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 0) })), []);

  const updateBuilderData = useCallback((partial: Partial<BuilderData>) => {
    setStateRaw(prev => ({ ...prev, builderData: { ...prev.builderData, ...partial } }));
  }, []);

  const updateLevelChoice = useCallback((level: number, partial: Partial<LevelChoice>) => {
    setStateRaw(prev => {
      const newChoices = [...prev.levelChoices];
      const idx = newChoices.findIndex(lc => lc.level === level);
      if (idx >= 0) {
        newChoices[idx] = { ...newChoices[idx], ...partial };
      } else {
        newChoices.push({ level, class_id: prev.builderData.class_id || '', hp_roll: 0, used_average: true, ...partial });
      }
      return { ...prev, levelChoices: newChoices };
    });
  }, []);

  const updatePersonal = useCallback((partial: Partial<any>) => {
    setStateRaw(prev => ({ ...prev, ...partial }));
  }, []);

  const getClassLevel = useCallback((classId: string, upToLevel?: number): number => {
    const choices = upToLevel
      ? state.levelChoices.filter(lc => lc.level <= upToLevel)
      : state.levelChoices;
    return choices.filter(lc => lc.class_id === classId).length;
  }, [state.levelChoices]);

  const getComputedAttributes = useCallback((): Record<string, number> => {
    const base = state.builderData.base_attributes || {
      strength: 10, dexterity: 10, constitution: 10,
      intelligence: 10, wisdom: 10, charisma: 10,
    };
    const result = { ...base };

    // Racial bonuses
    const race = RACES.find(r => r.id === state.builderData.race_id);
    if (race?.ability_bonuses) {
      Object.entries(race.ability_bonuses).forEach(([attr, bonus]) => {
        result[attr] = (result[attr] || 0) + (bonus as number);
      });
    }

    // Ability bonus choices (Half-Elf etc.)
    if (state.builderData.ability_bonus_choices) {
      state.builderData.ability_bonus_choices.forEach(attr => {
        result[attr] = (result[attr] || 0) + 1;
      });
    }

    // ASI / feat bonuses from level choices
    state.levelChoices.forEach(lc => {
      if (lc.attribute_improvements) {
        Object.entries(lc.attribute_improvements).forEach(([attr, bonus]) => {
          result[attr] = (result[attr] || 0) + bonus;
        });
      }
    });

    return result;
  }, [state.builderData, state.levelChoices]);

  const getComputedHP = useCallback((): number => {
    const attrs = getComputedAttributes();
    const conMod = getModifier(attrs.constitution || 10);
    const classId = state.builderData.class_id || '';
    const hitDiceInfo = CLASS_HIT_DICE[classId] || { die: 8, avg: 5 };

    let totalHP = 0;
    if (state.levelChoices.length === 0) {
      // Level 1 default
      totalHP = hitDiceInfo.die + conMod;
    } else {
      state.levelChoices.forEach((lc, idx) => {
        const lcHitDice = CLASS_HIT_DICE[lc.class_id] || hitDiceInfo;
        if (idx === 0) {
          // Level 1: max hit die
          totalHP += lcHitDice.die + conMod;
        } else {
          const hpGain = lc.used_average ? lcHitDice.avg : lc.hp_roll;
          totalHP += Math.max(1, hpGain + conMod);
        }
      });
    }

    return totalHP;
  }, [state.builderData.class_id, state.levelChoices, getComputedAttributes]);

  const loadFromCharacter = useCallback((character: CharacterDB) => {
    setStateRaw(prev => populateFromCharacter(prev, character));
  }, []);

  const addLevel = useCallback(() => {
    setStateRaw(prev => {
      if (prev.currentLevel >= 20) return prev;
      const newLevel = prev.currentLevel + 1;
      const classId = prev.builderData.class_id || '';
      const hitDiceInfo = CLASS_HIT_DICE[classId] || { die: 8, avg: 5 };
      const newChoice: LevelChoice = {
        level: newLevel,
        class_id: classId,
        hp_roll: hitDiceInfo.avg,
        used_average: true,
      };
      return {
        ...prev,
        currentLevel: newLevel,
        levelChoices: [...prev.levelChoices, newChoice],
      };
    });
  }, []);

  const totalSteps = BUILDER_STEPS.length + state.levelChoices.filter(lc => lc.level > 1).length;

  const value = useMemo<BuilderContextValue>(() => ({
    ...state,
    goToStep,
    nextStep,
    prevStep,
    updateBuilderData,
    updateLevelChoice,
    updatePersonal,
    getComputedAttributes,
    getComputedHP,
    getClassLevel,
    setState,
    loadFromCharacter,
    addLevel,
    totalSteps,
  }), [state, goToStep, nextStep, prevStep, updateBuilderData, updateLevelChoice, updatePersonal, getComputedAttributes, getComputedHP, getClassLevel, setState, loadFromCharacter, addLevel, totalSteps]);

  return <BuilderCtx.Provider value={value}>{children}</BuilderCtx.Provider>;
}

// ===========================
// Helper: populate state from existing character
// ===========================

function populateFromCharacter(base: BuilderState, char: CharacterDB): BuilderState {
  // If character already has builder_data, use it directly
  const hasBuilderData = char.builder_data && Object.keys(char.builder_data).length > 0;

  const builderData: BuilderData = hasBuilderData
    ? (char.builder_data as BuilderData)
    : {
        // Infer from derived fields (legacy characters)
        race_id: inferRaceId(char.race),
        subrace_id: char.subrace ? inferSubraceId(char.race, char.subrace) : undefined,
        class_id: inferClassId(char.class),
        attribute_method: 'standard_array' as const,
        base_attributes: char.attributes as any, // Approximation — includes racial bonuses
        background_id: char.background || undefined,
        alignment: char.alignment || undefined,
      };

  const levelChoices: LevelChoice[] = (char.level_choices && (char.level_choices as LevelChoice[]).length > 0)
    ? (char.level_choices as LevelChoice[])
    : [{
        level: 1,
        class_id: builderData.class_id || inferClassId(char.class),
        hp_roll: 0,
        used_average: true,
      }];

  return {
    ...base,
    mode: 'edit',
    characterId: char.id,
    builderData,
    levelChoices,
    currentLevel: char.level,
    name: char.name,
    personalityTraits: char.personality_traits || '',
    ideals: char.ideals || '',
    bonds: char.bonds || '',
    flaws: char.flaws || '',
    backstory: char.backstory || '',
    age: char.age || '',
    height: char.height || '',
    weight: char.weight || '',
    eyes: char.eyes || '',
    hair: char.hair || '',
    skin: char.skin || '',
    distinctiveFeatures: char.distinctive_features || '',
    goals: char.goals || '',
    alliesOrganizations: char.allies_organizations || '',
    imageUrl: char.image_url || undefined,
  };
}

// ===========================
// Inference helpers for legacy characters
// ===========================

function inferRaceId(raceName: string): string {
  const race = RACES.find(r =>
    r.name.toLowerCase() === raceName.toLowerCase() ||
    r.id === raceName
  );
  return race?.id || raceName;
}

function inferSubraceId(raceName: string, subraceName: string): string | undefined {
  const race = RACES.find(r =>
    r.name.toLowerCase() === raceName.toLowerCase() ||
    r.id === raceName
  );
  if (race?.subraces) {
    const sub = race.subraces.find(s =>
      s.name.toLowerCase() === subraceName.toLowerCase() ||
      s.id === subraceName
    );
    return sub?.id || subraceName;
  }
  return subraceName;
}

function inferClassId(className: string): string {
  const cls = CLASSES.find(c =>
    c.name.toLowerCase() === className.toLowerCase() ||
    c.id === className
  );
  return cls?.id || className;
}
