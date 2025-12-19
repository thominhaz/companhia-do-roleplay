// Ward RPG Type Definitions

export interface Character {
  id: string;
  userId?: string;
  name: string;
  race: string;
  subrace?: string;
  class: string;
  level: number;
  experience: number;
  
  // Core Stats
  maxHp: number;
  currentHp: number;
  temporaryHp: number;
  armorClass: number;
  initiative: number;
  speed: number;
  proficiencyBonus: number;
  
  // Attributes
  attributes: CharacterAttributes;
  
  // Saving Throws & Skills
  savingThrows: SavingThrows;
  skills: Skills;
  
  // Combat
  hitDice: HitDice;
  deathSaves: DeathSaves;
  
  // Equipment & Inventory
  equipment: Equipment[];
  inventory: InventoryItem[];
  currency: Currency;
  
  // Spellcasting
  spellcasting?: SpellcastingInfo;
  spells: SpellSlot[];
  
  // Background & Personality
  background: string;
  alignment: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
  
  // Features & Traits
  features: Feature[];
  proficiencies: Proficiency[];
  languages: string[];
  
  // Meta
  imageUrl?: string;
  isLocal: boolean;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterAttributes {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface SavingThrows {
  strength: { proficient: boolean; modifier: number };
  dexterity: { proficient: boolean; modifier: number };
  constitution: { proficient: boolean; modifier: number };
  intelligence: { proficient: boolean; modifier: number };
  wisdom: { proficient: boolean; modifier: number };
  charisma: { proficient: boolean; modifier: number };
}

export interface Skills {
  acrobatics: SkillInfo;
  animalHandling: SkillInfo;
  arcana: SkillInfo;
  athletics: SkillInfo;
  deception: SkillInfo;
  history: SkillInfo;
  insight: SkillInfo;
  intimidation: SkillInfo;
  investigation: SkillInfo;
  medicine: SkillInfo;
  nature: SkillInfo;
  perception: SkillInfo;
  performance: SkillInfo;
  persuasion: SkillInfo;
  religion: SkillInfo;
  sleightOfHand: SkillInfo;
  stealth: SkillInfo;
  survival: SkillInfo;
}

export interface SkillInfo {
  proficient: boolean;
  expertise: boolean;
  modifier: number;
}

export interface HitDice {
  total: number;
  current: number;
  diceType: string; // e.g., "d10"
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'shield' | 'other';
  equipped: boolean;
  properties?: string[];
  damage?: string;
  damageType?: string;
  acBonus?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight?: number;
  description?: string;
}

export interface Currency {
  copper: number;
  silver: number;
  electrum: number;
  gold: number;
  platinum: number;
}

export interface SpellcastingInfo {
  class: string;
  ability: keyof CharacterAttributes;
  spellSaveDC: number;
  spellAttackBonus: number;
}

export interface SpellSlot {
  level: number;
  total: number;
  used: number;
}

export interface Feature {
  id: string;
  name: string;
  source: string;
  description: string;
  uses?: number;
  maxUses?: number;
  rechargeOn?: 'shortRest' | 'longRest' | 'dawn';
}

export interface Proficiency {
  type: 'armor' | 'weapon' | 'tool' | 'savingThrow' | 'skill';
  name: string;
}

// Campaign Types
export interface Campaign {
  id: string;
  name: string;
  description: string;
  masterId: string;
  masterName: string;
  playerIds: string[];
  players: CampaignPlayer[];
  nextSession?: SessionInfo;
  imageUrl?: string;
  isLocal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignPlayer {
  id: string;
  name: string;
  characterId?: string;
  characterName?: string;
  role: 'player' | 'master';
}

export interface SessionInfo {
  id: string;
  campaignId: string;
  title: string;
  scheduledAt: string;
  location?: string;
  notes?: string;
}

// User & Subscription Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  subscription: SubscriptionStatus;
  createdAt: string;
}

export type SubscriptionStatus = 'free' | 'player' | 'master' | 'premium';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  expiresAt?: string;
  features: string[];
}

// SRD Data Types
export interface Race {
  name: string;
  description: string;
  abilityBonuses: Partial<CharacterAttributes>;
  size: 'Small' | 'Medium' | 'Large';
  speed: number;
  traits: string[];
  languages: string[];
  subraces?: Subrace[];
}

export interface Subrace {
  name: string;
  description: string;
  abilityBonuses: Partial<CharacterAttributes>;
  traits: string[];
}

export interface CharacterClass {
  name: string;
  description: string;
  hitDice: string;
  primaryAbility: keyof CharacterAttributes;
  savingThrows: (keyof CharacterAttributes)[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  skillChoices: string[];
  numSkillChoices: number;
  features: ClassFeature[];
}

export interface ClassFeature {
  name: string;
  level: number;
  description: string;
}

export interface Spell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
  higherLevels?: string;
  classes: string[];
}

export interface Condition {
  name: string;
  description: string;
  effects: string[];
}

// Navigation Types
export type TabRoute = 'home' | 'characters' | 'campaigns' | 'tools' | 'menu';

// Quick Action Types
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: 'purple' | 'pink' | 'blue' | 'gold';
  route: string;
}
