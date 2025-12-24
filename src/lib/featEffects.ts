// Feat effects definitions and calculation utilities
// This file maps feat names to their mechanical effects

export interface FeatEffects {
  initiative_bonus?: number;
  ac_bonus?: number;
  speed_bonus?: number;
  passive_bonus?: number;
  hp_per_level?: number;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  attribute_bonus?: number;
  attribute_choice?: string[];
  saving_throw_proficiency?: boolean;
}

// Map of feat names (normalized) to their effects
// Uses lowercase normalized names for matching
export const FEAT_EFFECTS: Record<string, FeatEffects> = {
  'alerta': { initiative_bonus: 5 },
  'alert': { initiative_bonus: 5 },
  'atleta': { attribute_choice: ['strength', 'dexterity'], attribute_bonus: 1 },
  'athlete': { attribute_choice: ['strength', 'dexterity'], attribute_bonus: 1 },
  'ator': { charisma: 1 },
  'actor': { charisma: 1 },
  'combatente com duas armas': { ac_bonus: 1 },
  'dual wielder': { ac_bonus: 1 },
  'durão': { constitution: 1 },
  'durable': { constitution: 1 },
  'armadura pesada': { strength: 1 },
  'heavily armored': { strength: 1 },
  'mobilidade': { speed_bonus: 3 },
  'mobile': { speed_bonus: 3 },
  'observador': { passive_bonus: 5, attribute_choice: ['intelligence', 'wisdom'], attribute_bonus: 1 },
  'observant': { passive_bonus: 5, attribute_choice: ['intelligence', 'wisdom'], attribute_bonus: 1 },
  'resiliente': { attribute_choice: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'], attribute_bonus: 1, saving_throw_proficiency: true },
  'resilient': { attribute_choice: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'], attribute_bonus: 1, saving_throw_proficiency: true },
  'robusto': { hp_per_level: 2 },
  'tough': { hp_per_level: 2 },
  'brigão de taverna': { attribute_choice: ['strength', 'constitution'], attribute_bonus: 1 },
  'tavern brawler': { attribute_choice: ['strength', 'constitution'], attribute_bonus: 1 },
};

// Normalize feat name for lookup
function normalizeFeatName(name: string): string {
  return name.toLowerCase().trim();
}

// Get effects for a feat by name
export function getFeatEffects(featName: string): FeatEffects | undefined {
  return FEAT_EFFECTS[normalizeFeatName(featName)];
}

// Calculate total bonuses from character features (feats)
export interface CalculatedBonuses {
  initiative: number;
  ac: number;
  speed: number;
  passive_perception: number;
  passive_investigation: number;
  passive_insight: number;
  hp_bonus: number; // Total HP bonus (hp_per_level * level)
}

interface CharacterFeature {
  name: string;
  source?: string;
  level?: number;
  description?: string;
}

export function calculateFeatBonuses(
  features: CharacterFeature[] | undefined | null,
  characterLevel: number
): CalculatedBonuses {
  const bonuses: CalculatedBonuses = {
    initiative: 0,
    ac: 0,
    speed: 0,
    passive_perception: 0,
    passive_investigation: 0,
    passive_insight: 0,
    hp_bonus: 0,
  };

  if (!features || !Array.isArray(features)) {
    return bonuses;
  }

  // Track processed feats to avoid duplicates
  const processedFeats = new Set<string>();

  for (const feature of features) {
    // Only process feats (source === 'feat' or 'Talento')
    const source = feature.source?.toLowerCase();
    if (source !== 'feat' && source !== 'talento') {
      continue;
    }

    const normalizedName = normalizeFeatName(feature.name);
    
    // Skip if already processed (avoid double counting)
    if (processedFeats.has(normalizedName)) {
      continue;
    }
    processedFeats.add(normalizedName);

    const effects = getFeatEffects(feature.name);
    if (!effects) {
      continue;
    }

    // Apply effects
    if (effects.initiative_bonus) {
      bonuses.initiative += effects.initiative_bonus;
    }
    if (effects.ac_bonus) {
      bonuses.ac += effects.ac_bonus;
    }
    if (effects.speed_bonus) {
      bonuses.speed += effects.speed_bonus;
    }
    if (effects.passive_bonus) {
      bonuses.passive_perception += effects.passive_bonus;
      bonuses.passive_investigation += effects.passive_bonus;
      bonuses.passive_insight += effects.passive_bonus;
    }
    if (effects.hp_per_level) {
      bonuses.hp_bonus += effects.hp_per_level * characterLevel;
    }
  }

  return bonuses;
}
