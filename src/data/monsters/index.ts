// Monster data types and loader
import monstersAB from './a-b.json';

export interface MonsterStats {
  STR: string;
  DEX: string;
  CON: string;
  INT: string;
  WIS: string;
  CHA: string;
}

export interface MonsterTrait {
  name: string;
  description: string;
}

export interface MonsterAction {
  name: string;
  description: string;
}

export interface LegendaryActions {
  description: string;
  actions: MonsterAction[];
}

export interface Monster {
  name: string;
  meta: string; // "Aberração grande, leal e mau"
  armorClass: string;
  hitPoints: string;
  speed: string;
  stats: MonsterStats;
  savingThrows: string | null;
  skills: string | null;
  damageVulnerabilities: string | null;
  damageResistances: string | string[] | null;
  damageImmunities: string | string[] | null;
  conditionImmunities: string | string[] | null;
  senses: string;
  languages: string;
  challenge: string; // "10 (5,900 XP)"
  traits: MonsterTrait[] | null;
  actions: MonsterAction[] | null;
  legendaryActions: LegendaryActions | null;
  lairActions: unknown | null;
  regionalEffects: unknown | null;
  reactions?: MonsterAction[] | null;
}

// Parse challenge rating to numeric value for sorting/filtering
export function parseChallengeRating(challenge: string): number {
  const match = challenge.match(/^([\d\/]+)/);
  if (!match) return 0;
  
  const cr = match[1];
  if (cr.includes('/')) {
    const [num, den] = cr.split('/').map(Number);
    return num / den;
  }
  return parseFloat(cr);
}

// Parse XP from challenge string
export function parseXP(challenge: string): number {
  const match = challenge.match(/\(([\d,]+)\s*XP\)/);
  if (!match) return 0;
  return parseInt(match[1].replace(/,/g, ''));
}

// Extract type from meta string
export function extractMonsterType(meta: string): string {
  const types = [
    'Aberração', 'Besta', 'Celestial', 'Construto', 'Dragão', 
    'Elemental', 'Fada', 'Corruptor', 'Gigante', 'Humanoide', 
    'Monstruosidade', 'Limo', 'Planta', 'Morto-vivo'
  ];
  
  const metaLower = meta.toLowerCase();
  for (const type of types) {
    if (metaLower.includes(type.toLowerCase())) {
      return type;
    }
  }
  return 'Desconhecido';
}

// Extract size from meta string
export function extractMonsterSize(meta: string): string {
  const sizes = ['Miúdo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Colossal'];
  const metaLower = meta.toLowerCase();
  
  for (const size of sizes) {
    if (metaLower.includes(size.toLowerCase())) {
      return size;
    }
  }
  return 'Médio';
}

// Load all monsters from all files
export function loadAllMonsters(): Monster[] {
  const allMonsters: Monster[] = [
    ...(monstersAB as Monster[]),
    // Add more files as they become available:
    // ...(monstersCD as Monster[]),
    // ...(monstersEF as Monster[]),
  ];
  
  // Sort alphabetically
  return allMonsters.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

// Get unique challenge ratings for filter
export function getUniqueChallengeRatings(monsters: Monster[]): string[] {
  const ratings = new Set<string>();
  monsters.forEach(m => {
    const match = m.challenge.match(/^([\d\/]+)/);
    if (match) ratings.add(match[1]);
  });
  
  return Array.from(ratings).sort((a, b) => {
    return parseChallengeRating(a) - parseChallengeRating(b);
  });
}

// Get unique monster types
export function getUniqueTypes(monsters: Monster[]): string[] {
  const types = new Set<string>();
  monsters.forEach(m => {
    types.add(extractMonsterType(m.meta));
  });
  return Array.from(types).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
