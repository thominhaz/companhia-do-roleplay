// D&D 5e SRD Data - Loaded from JSON files

// Import race JSONs
import anaoData from './races/anao.json';
import draconatoData from './races/draconato.json';
import elfoData from './races/elfo.json';
import gnomoData from './races/gnomo.json';
import halflingData from './races/halfling.json';
import humanoData from './races/humano.json';
import meioElfoData from './races/meio-elfo.json';
import meioOrcData from './races/meio-orc.json';
import tieflingData from './races/tiefling.json';

// Import class JSONs
import barbaroData from './classes/barbaro.json';
import bardoData from './classes/bardo.json';
import bruxoData from './classes/bruxo.json';
import clerigoData from './classes/clerigo.json';
import druidaData from './classes/druida.json';
import feiticeiroData from './classes/feiticeiro.json';
import guerreiroData from './classes/guerreiro.json';
import ladinoData from './classes/ladino.json';
import magoData from './classes/mago.json';
import mongeData from './classes/monge.json';
import paladinoData from './classes/paladino.json';
import patrulheiroData from './classes/patrulheiro.json';

// Types
export type Attribute = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export interface RaceTrait {
  id: string;
  name: string;
  description_markdown: string;
  mechanical?: Record<string, unknown>;
}

export interface Subrace {
  id: string;
  name: string;
  name_en: string;
  description: string;
  ability_bonuses: Partial<Record<Attribute, number>>;
  traits?: RaceTrait[];
}

export interface Race {
  id: string;
  name: string;
  name_en: string;
  size: string;
  speed: number;
  ability_bonuses: Partial<Record<Attribute, number>>;
  ability_bonuses_choice?: {
    count: number;
    options: Attribute[];
  };
  age_description: string;
  alignment_description: string;
  size_description: string;
  languages: string[];
  traits: RaceTrait[];
  subraces?: Subrace[];
}

export interface ClassLevel {
  level: number;
  proficiency_bonus: number;
  features: string[];
  cantrips_known?: number;
  spells_known?: number;
  spell_slots?: number[] | number;
  slot_level?: number;
  invocations_known?: number;
  sorcery_points?: number;
  martial_arts?: string;
  ki_points?: number;
  unarmored_movement?: number;
  sneak_attack?: string;
}

export interface ClassFeature {
  id: string;
  name: string;
  level: number;
  description_markdown: string;
  mechanical?: Record<string, unknown>;
}

export interface CharacterClass {
  id: string;
  name: string;
  name_en: string;
  hit_die: number;
  primary_abilities: Attribute[];
  saving_throw_proficiencies: Attribute[];
  proficiencies: {
    armor: string[];
    armor_restriction?: string;
    weapons: string[];
    tools: string[] | { choose: number; from: string | string[] };
    skills: { choose: number; from: string | string[] };
  };
  equipment_markdown: string;
  starting_equipment?: {
    choices: { choose: number; from: string[][] }[];
    granted?: string[];
  };
  levels: ClassLevel[];
  features?: ClassFeature[];
  subclasses?: unknown[];
}

// Export races
export const RACES: Race[] = [
  anaoData as Race,
  elfoData as Race,
  halflingData as Race,
  humanoData as Race,
  draconatoData as Race,
  gnomoData as Race,
  meioElfoData as Race,
  meioOrcData as Race,
  tieflingData as Race,
];

// Export classes
export const CLASSES: CharacterClass[] = [
  barbaroData as CharacterClass,
  bardoData as CharacterClass,
  bruxoData as CharacterClass,
  clerigoData as CharacterClass,
  druidaData as CharacterClass,
  feiticeiroData as CharacterClass,
  guerreiroData as CharacterClass,
  ladinoData as CharacterClass,
  magoData as CharacterClass,
  mongeData as CharacterClass,
  paladinoData as CharacterClass,
  patrulheiroData as CharacterClass,
];

// Backgrounds
export const BACKGROUNDS = [
  { id: 'acolyte', name: 'Acólito', description: 'Você passou a vida a serviço de um templo.' },
  { id: 'charlatan', name: 'Charlatão', description: 'Você sempre teve facilidade com as pessoas.' },
  { id: 'criminal', name: 'Criminoso', description: 'Você é um criminoso experiente com histórico de infringir a lei.' },
  { id: 'entertainer', name: 'Artista', description: 'Você prospera diante de um público.' },
  { id: 'folk-hero', name: 'Herói do Povo', description: 'Você vem de uma origem humilde.' },
  { id: 'guild-artisan', name: 'Artesão de Guilda', description: 'Você é membro de uma guilda de artesãos.' },
  { id: 'hermit', name: 'Eremita', description: 'Você viveu em reclusão.' },
  { id: 'noble', name: 'Nobre', description: 'Você nasceu nas graças de uma família nobre.' },
  { id: 'outlander', name: 'Forasteiro', description: 'Você cresceu na natureza selvagem.' },
  { id: 'sage', name: 'Sábio', description: 'Você passou anos estudando o multiverso.' },
  { id: 'sailor', name: 'Marinheiro', description: 'Você navegou por anos em navios.' },
  { id: 'soldier', name: 'Soldado', description: 'Você é um veterano de guerra.' },
  { id: 'urchin', name: 'Órfão', description: 'Você cresceu nas ruas, pobre e órfão.' },
];

export const ALIGNMENTS = [
  { id: 'lawful-good', name: 'Leal e Bom' },
  { id: 'neutral-good', name: 'Neutro e Bom' },
  { id: 'chaotic-good', name: 'Caótico e Bom' },
  { id: 'lawful-neutral', name: 'Leal e Neutro' },
  { id: 'true-neutral', name: 'Neutro' },
  { id: 'chaotic-neutral', name: 'Caótico e Neutro' },
  { id: 'lawful-evil', name: 'Leal e Mau' },
  { id: 'neutral-evil', name: 'Neutro e Mau' },
  { id: 'chaotic-evil', name: 'Caótico e Mau' },
];

// Utility functions
export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getModifierString(score: number): string {
  const mod = getModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function calculateHP(hitDie: number, conModifier: number, level: number): number {
  // Level 1: max dice + con modifier
  // Each additional level: average (rounded up) + con modifier
  const firstLevel = hitDie + conModifier;
  const additionalLevels = (level - 1) * (Math.ceil(hitDie / 2) + 1 + conModifier);
  return Math.max(1, firstLevel + additionalLevels);
}

// Convert speed from meters to feet (for display)
export function speedToFeet(meters: number): number {
  return Math.round(meters * 3.28);
}

// Get attribute abbreviation in Portuguese
export function getAttributeAbbr(attr: string): string {
  const abbrs: Record<string, string> = {
    strength: 'FOR',
    dexterity: 'DES',
    constitution: 'CON',
    intelligence: 'INT',
    wisdom: 'SAB',
    charisma: 'CAR',
  };
  return abbrs[attr] || attr.slice(0, 3).toUpperCase();
}

// Get attribute name in Portuguese
export function getAttributeName(attr: string): string {
  const names: Record<string, string> = {
    strength: 'Força',
    dexterity: 'Destreza',
    constitution: 'Constituição',
    intelligence: 'Inteligência',
    wisdom: 'Sabedoria',
    charisma: 'Carisma',
  };
  return names[attr] || attr;
}
