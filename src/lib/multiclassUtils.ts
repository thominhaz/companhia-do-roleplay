/**
 * Multiclass utility functions for D&D 5e SRD.
 * Handles prerequisites, combined spell slots, proficiencies, and hit dice.
 */
import multiclassData from '@/data/rules/multiclasse.json';
import type { LevelChoice } from '@/hooks/useCharacters';

const mc = multiclassData.multiclassing;

// ===========================
// Prerequisites
// ===========================

export interface PrerequisiteResult {
  met: boolean;
  missing: string[]; // e.g. ["Força 13", "Carisma 13"]
}

const ATTR_NAMES: Record<string, string> = {
  strength: 'Força', dexterity: 'Destreza', constitution: 'Constituição',
  intelligence: 'Inteligência', wisdom: 'Sabedoria', charisma: 'Carisma',
};

/**
 * Check if a character meets multiclass prerequisites for a given class.
 * Must meet prerequisites for BOTH current class(es) AND the new class.
 */
export function checkMulticlassPrerequisites(
  targetClassId: string,
  currentClassIds: string[],
  attributes: Record<string, number>,
): PrerequisiteResult {
  const missing: string[] = [];

  // Check prerequisites for target class AND all current classes
  const classesToCheck = [...new Set([...currentClassIds, targetClassId])];

  for (const classId of classesToCheck) {
    const req = mc.prerequisites.requirements.find(
      r => r.class === mapClassIdToEnglish(classId)
    );
    if (!req) continue;

    const mins = req.ability_score_minimum as Record<string, number>;
    for (const [key, minValue] of Object.entries(mins)) {
      if (key === 'strength_or_dexterity') {
        const str = attributes.strength || 10;
        const dex = attributes.dexterity || 10;
        if (str < minValue && dex < minValue) {
          missing.push(`Força ou Destreza ${minValue} (${req.class_pt})`);
        }
      } else {
        const attrValue = attributes[key] || 10;
        if (attrValue < minValue) {
          missing.push(`${ATTR_NAMES[key] || key} ${minValue} (${req.class_pt})`);
        }
      }
    }
  }

  return { met: missing.length === 0, missing };
}

// ===========================
// Class ID mapping
// ===========================

const CLASS_ID_TO_ENGLISH: Record<string, string> = {
  barbaro: 'barbarian', bardo: 'bard', bruxo: 'warlock',
  clerigo: 'cleric', druida: 'druid', feiticeiro: 'sorcerer',
  guerreiro: 'fighter', ladino: 'rogue', mago: 'wizard',
  monge: 'monk', paladino: 'paladin', patrulheiro: 'ranger',
};

const CLASS_ID_TO_PT: Record<string, string> = {
  barbaro: 'Bárbaro', bardo: 'Bardo', bruxo: 'Bruxo',
  clerigo: 'Clérigo', druida: 'Druida', feiticeiro: 'Feiticeiro',
  guerreiro: 'Guerreiro', ladino: 'Ladino', mago: 'Mago',
  monge: 'Monge', paladino: 'Paladino', patrulheiro: 'Patrulheiro',
};

export function mapClassIdToEnglish(classId: string): string {
  return CLASS_ID_TO_ENGLISH[classId] || classId;
}

export function getClassNamePt(classId: string): string {
  return CLASS_ID_TO_PT[classId] || classId;
}

// ===========================
// Multiclass Proficiencies
// ===========================

/**
 * Get the proficiencies gained when multiclassing INTO a class (not your initial class).
 */
export function getMulticlassProficiencies(classId: string): string {
  const englishId = mapClassIdToEnglish(classId);
  const entry = mc.proficiencies.proficiencies_gained.find(
    p => p.class === englishId
  );
  return entry?.proficiencies || '—';
}

// ===========================
// Combined Spell Slots (Multiclass Spellcaster Table)
// ===========================

/** Full casters contribute 1:1 to combined caster level */
const FULL_CASTERS = new Set(['bardo', 'clerigo', 'druida', 'feiticeiro', 'mago']);
/** Half casters contribute 1:2 (rounded down) */
const HALF_CASTERS = new Set(['paladino', 'patrulheiro']);
/** Pact Magic (Warlock) uses separate slots — NOT combined */
const PACT_MAGIC = new Set(['bruxo']);

export interface CombinedSpellSlots {
  slots: number[]; // index 0 = 1st level, index 8 = 9th level
  effectiveCasterLevel: number;
}

/**
 * Calculate combined multiclass spell slots.
 * Warlock Pact Magic slots are handled separately (not combined here).
 */
export function calculateMulticlassSpellSlots(levelChoices: LevelChoice[]): CombinedSpellSlots {
  // Count levels per class
  const classLevels: Record<string, number> = {};
  levelChoices.forEach(lc => {
    classLevels[lc.class_id] = (classLevels[lc.class_id] || 0) + 1;
  });

  // Calculate effective caster level
  let effectiveCasterLevel = 0;
  for (const [classId, levels] of Object.entries(classLevels)) {
    if (FULL_CASTERS.has(classId)) {
      effectiveCasterLevel += levels;
    } else if (HALF_CASTERS.has(classId)) {
      effectiveCasterLevel += Math.floor(levels / 2);
    }
    // Pact Magic (warlock) doesn't contribute
  }

  if (effectiveCasterLevel === 0) {
    return { slots: [0, 0, 0, 0, 0, 0, 0, 0, 0], effectiveCasterLevel: 0 };
  }

  // Lookup in the multiclass spellcaster table
  const tableEntry = mc.class_features.special_rules.spellcasting.spell_slots_table.levels.find(
    l => l.level === effectiveCasterLevel
  );

  if (!tableEntry) {
    return { slots: [0, 0, 0, 0, 0, 0, 0, 0, 0], effectiveCasterLevel };
  }

  return {
    slots: [
      tableEntry['1st'], tableEntry['2nd'], tableEntry['3rd'],
      tableEntry['4th'], tableEntry['5th'], tableEntry['6th'],
      tableEntry['7th'], tableEntry['8th'], tableEntry['9th'],
    ],
    effectiveCasterLevel,
  };
}

// ===========================
// Combined Hit Dice
// ===========================

const CLASS_HIT_DIE: Record<string, number> = {
  barbaro: 12, bardo: 8, bruxo: 8, clerigo: 8, druida: 8,
  feiticeiro: 6, guerreiro: 10, ladino: 8, mago: 6,
  monge: 8, paladino: 10, patrulheiro: 10,
};

export interface HitDiceGroup {
  diceType: string; // e.g. "d10"
  die: number;      // e.g. 10
  total: number;     // how many dice of this type
  classIds: string[]; // which classes contribute
}

/**
 * Group hit dice by type for multiclass characters.
 */
export function getMulticlassHitDice(levelChoices: LevelChoice[]): HitDiceGroup[] {
  const classLevels: Record<string, number> = {};
  levelChoices.forEach(lc => {
    classLevels[lc.class_id] = (classLevels[lc.class_id] || 0) + 1;
  });

  // Group by die size
  const byDie: Record<number, { total: number; classIds: string[] }> = {};
  for (const [classId, levels] of Object.entries(classLevels)) {
    const die = CLASS_HIT_DIE[classId] || 8;
    if (!byDie[die]) byDie[die] = { total: 0, classIds: [] };
    byDie[die].total += levels;
    byDie[die].classIds.push(classId);
  }

  return Object.entries(byDie)
    .sort(([a], [b]) => Number(b) - Number(a)) // largest dice first
    .map(([die, data]) => ({
      diceType: `d${die}`,
      die: Number(die),
      total: data.total,
      classIds: data.classIds,
    }));
}

// ===========================
// Class String (e.g. "Guerreiro 3 / Clérigo 2")
// ===========================

export function getMulticlassString(levelChoices: LevelChoice[]): string {
  const classLevels: Record<string, number> = {};
  const classOrder: string[] = [];

  levelChoices.forEach(lc => {
    if (!classLevels[lc.class_id]) {
      classOrder.push(lc.class_id);
    }
    classLevels[lc.class_id] = (classLevels[lc.class_id] || 0) + 1;
  });

  if (classOrder.length <= 1) {
    return getClassNamePt(classOrder[0] || '');
  }

  return classOrder
    .map(cid => `${getClassNamePt(cid)} ${classLevels[cid]}`)
    .join(' / ');
}

/**
 * Check if a character is multiclassed.
 */
export function isMulticlassed(levelChoices: LevelChoice[]): boolean {
  const classIds = new Set(levelChoices.map(lc => lc.class_id));
  return classIds.size > 1;
}

/**
 * Get distinct classes in a character's level choices.
 */
export function getDistinctClasses(levelChoices: LevelChoice[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  levelChoices.forEach(lc => {
    if (!seen.has(lc.class_id)) {
      seen.add(lc.class_id);
      result.push(lc.class_id);
    }
  });
  return result;
}

/**
 * Get the number of levels in a specific class.
 */
export function getClassLevelCount(levelChoices: LevelChoice[], classId: string): number {
  return levelChoices.filter(lc => lc.class_id === classId).length;
}

/**
 * Get subclass level for a class.
 */
const SUBCLASS_LEVELS: Record<string, number> = {
  clerigo: 1, feiticeiro: 1, bruxo: 1,
  druida: 2, mago: 2,
  barbaro: 3, bardo: 3, guerreiro: 3, ladino: 3,
  monge: 3, paladino: 3, patrulheiro: 3,
};

export function getSubclassLevelForClass(classId: string): number {
  return SUBCLASS_LEVELS[classId] || 3;
}

/**
 * Check if the character already has Extra Attack from any class.
 */
export function hasExtraAttack(levelChoices: LevelChoice[]): boolean {
  // Extra Attack is typically gained at class level 5 for martial classes
  const martialClasses = new Set(['barbaro', 'guerreiro', 'monge', 'paladino', 'patrulheiro']);
  const classLevels: Record<string, number> = {};
  levelChoices.forEach(lc => {
    classLevels[lc.class_id] = (classLevels[lc.class_id] || 0) + 1;
  });

  for (const [classId, levels] of Object.entries(classLevels)) {
    if (martialClasses.has(classId) && levels >= 5) return true;
  }
  return false;
}
