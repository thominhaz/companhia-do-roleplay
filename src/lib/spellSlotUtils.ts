// Spell slot tables for D&D 5e SRD
// Full casters: Wizard, Sorcerer, Bard, Cleric, Druid
// Half casters: Paladin, Ranger (gain slots at half rate, starting at level 2)
// Pact Magic: Warlock (unique slot progression)

export const FULL_CASTER_SLOTS: Record<string, number[]> = {
  "1": [2, 0, 0, 0, 0, 0, 0, 0, 0],
  "2": [3, 0, 0, 0, 0, 0, 0, 0, 0],
  "3": [4, 2, 0, 0, 0, 0, 0, 0, 0],
  "4": [4, 3, 0, 0, 0, 0, 0, 0, 0],
  "5": [4, 3, 2, 0, 0, 0, 0, 0, 0],
  "6": [4, 3, 3, 0, 0, 0, 0, 0, 0],
  "7": [4, 3, 3, 1, 0, 0, 0, 0, 0],
  "8": [4, 3, 3, 2, 0, 0, 0, 0, 0],
  "9": [4, 3, 3, 3, 1, 0, 0, 0, 0],
  "10": [4, 3, 3, 3, 2, 0, 0, 0, 0],
  "11": [4, 3, 3, 3, 2, 1, 0, 0, 0],
  "12": [4, 3, 3, 3, 2, 1, 0, 0, 0],
  "13": [4, 3, 3, 3, 2, 1, 1, 0, 0],
  "14": [4, 3, 3, 3, 2, 1, 1, 0, 0],
  "15": [4, 3, 3, 3, 2, 1, 1, 1, 0],
  "16": [4, 3, 3, 3, 2, 1, 1, 1, 0],
  "17": [4, 3, 3, 3, 2, 1, 1, 1, 1],
  "18": [4, 3, 3, 3, 3, 1, 1, 1, 1],
  "19": [4, 3, 3, 3, 3, 2, 1, 1, 1],
  "20": [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

// Half-casters (Paladin, Ranger) - no slots at level 1, gain at half rate
export const HALF_CASTER_SLOTS: Record<string, number[]> = {
  "1": [0, 0, 0, 0, 0, 0, 0, 0, 0],
  "2": [2, 0, 0, 0, 0, 0, 0, 0, 0],
  "3": [3, 0, 0, 0, 0, 0, 0, 0, 0],
  "4": [3, 0, 0, 0, 0, 0, 0, 0, 0],
  "5": [4, 2, 0, 0, 0, 0, 0, 0, 0],
  "6": [4, 2, 0, 0, 0, 0, 0, 0, 0],
  "7": [4, 3, 0, 0, 0, 0, 0, 0, 0],
  "8": [4, 3, 0, 0, 0, 0, 0, 0, 0],
  "9": [4, 3, 2, 0, 0, 0, 0, 0, 0],
  "10": [4, 3, 2, 0, 0, 0, 0, 0, 0],
  "11": [4, 3, 3, 0, 0, 0, 0, 0, 0],
  "12": [4, 3, 3, 0, 0, 0, 0, 0, 0],
  "13": [4, 3, 3, 1, 0, 0, 0, 0, 0],
  "14": [4, 3, 3, 1, 0, 0, 0, 0, 0],
  "15": [4, 3, 3, 2, 0, 0, 0, 0, 0],
  "16": [4, 3, 3, 2, 0, 0, 0, 0, 0],
  "17": [4, 3, 3, 3, 1, 0, 0, 0, 0],
  "18": [4, 3, 3, 3, 1, 0, 0, 0, 0],
  "19": [4, 3, 3, 3, 2, 0, 0, 0, 0],
  "20": [4, 3, 3, 3, 2, 0, 0, 0, 0],
};

// Warlock Pact Magic - fewer slots but all at highest level, recover on short rest
export const WARLOCK_PACT_SLOTS: Record<string, { slots: number; slotLevel: number }> = {
  "1": { slots: 1, slotLevel: 1 },
  "2": { slots: 2, slotLevel: 1 },
  "3": { slots: 2, slotLevel: 2 },
  "4": { slots: 2, slotLevel: 2 },
  "5": { slots: 2, slotLevel: 3 },
  "6": { slots: 2, slotLevel: 3 },
  "7": { slots: 2, slotLevel: 4 },
  "8": { slots: 2, slotLevel: 4 },
  "9": { slots: 2, slotLevel: 5 },
  "10": { slots: 2, slotLevel: 5 },
  "11": { slots: 3, slotLevel: 5 },
  "12": { slots: 3, slotLevel: 5 },
  "13": { slots: 3, slotLevel: 5 },
  "14": { slots: 3, slotLevel: 5 },
  "15": { slots: 3, slotLevel: 5 },
  "16": { slots: 3, slotLevel: 5 },
  "17": { slots: 4, slotLevel: 5 },
  "18": { slots: 4, slotLevel: 5 },
  "19": { slots: 4, slotLevel: 5 },
  "20": { slots: 4, slotLevel: 5 },
};

// Class names that are half-casters (Portuguese and English)
const HALF_CASTER_CLASSES = ['paladino', 'paladin', 'patrulheiro', 'ranger'];
const WARLOCK_CLASSES = ['bruxo', 'warlock'];
// Non-casters get no slots
const NON_CASTER_CLASSES = ['barbaro', 'barbarian', 'guerreiro', 'fighter', 'ladino', 'rogue', 'monge', 'monk'];

export type CasterType = 'full' | 'half' | 'warlock' | 'none';

export function getCasterType(className: string): CasterType {
  const normalized = className.toLowerCase().trim();
  if (NON_CASTER_CLASSES.includes(normalized)) return 'none';
  if (HALF_CASTER_CLASSES.includes(normalized)) return 'half';
  if (WARLOCK_CLASSES.includes(normalized)) return 'warlock';
  return 'full';
}

/**
 * Get spell slots for a character based on class and level.
 * Returns an array of 9 numbers representing max slots for levels 1-9.
 */
export function getSpellSlotsForClass(className: string, level: number): number[] {
  const casterType = getCasterType(className);
  const levelStr = level.toString();
  const empty = [0, 0, 0, 0, 0, 0, 0, 0, 0];

  switch (casterType) {
    case 'none':
      return empty;
    case 'half':
      return HALF_CASTER_SLOTS[levelStr] || empty;
    case 'warlock': {
      const pact = WARLOCK_PACT_SLOTS[levelStr];
      if (!pact) return empty;
      const slots = [...empty];
      slots[pact.slotLevel - 1] = pact.slots;
      return slots;
    }
    case 'full':
    default:
      return FULL_CASTER_SLOTS[levelStr] || empty;
  }
}

/**
 * Map of spellcasting ability by class name (lowercase).
 */
const SPELLCASTING_ABILITY: Record<string, string> = {
  mago: 'intelligence',
  wizard: 'intelligence',
  feiticeiro: 'charisma',
  sorcerer: 'charisma',
  bardo: 'charisma',
  bard: 'charisma',
  bruxo: 'charisma',
  warlock: 'charisma',
  paladino: 'charisma',
  paladin: 'charisma',
  clerigo: 'wisdom',
  cleric: 'wisdom',
  druida: 'wisdom',
  druid: 'wisdom',
  patrulheiro: 'wisdom',
  ranger: 'wisdom',
};

/**
 * Get the spellcasting ability for a given class name.
 */
export function getSpellcastingAbility(className: string): string {
  return SPELLCASTING_ABILITY[className.toLowerCase().trim()] || 'intelligence';
}
