/**
 * Shared types for the character creation/editing steps.
 * Extracted from CharacterWizard to decouple step components
 * from the legacy wizard implementation.
 */
import type { Attribute } from '@/data/srd';

export type WizardData = {
  race: string;
  subrace: string | null;
  class: string;
  subclass: string | null;
  attributes: Record<Attribute, number>;
  abilityBonusChoices: string[];
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
  customBackgroundProficiencies: string[];
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
  // Variant Human
  variantHumanFeat: string;
  variantHumanSkill: string;
};
