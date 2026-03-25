// Go20 Type Definitions

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

// ============================================
// Homebrew Types
// ============================================

export type HomebrewContentType = 
  | 'spell'
  | 'item'
  | 'race'
  | 'subrace'
  | 'class'
  | 'subclass'
  | 'monster'
  | 'background'
  | 'feat';

export type HomebrewSource = 'user' | 'master_shared' | 'community';

export interface HomebrewContent {
  id: string;
  user_id: string;
  type: HomebrewContentType;
  name: string;
  description: string | null;
  icon: string;
  data: HomebrewData;
  source: HomebrewSource;
  is_public: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface HomebrewShare {
  id: string;
  content_id: string;
  campaign_id: string;
  shared_at: string;
}

// Specific homebrew data structures
export interface HomebrewData {
  [key: string]: unknown;
}

export interface HomebrewSpellData extends HomebrewData {
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  duration: string;
  classes: string[];
  mechanics?: {
    save_type?: string;
    damage?: string;
    damage_type?: string;
    healing?: string;
  };
}

export interface HomebrewItemData extends HomebrewData {
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact';
  type: 'weapon' | 'armor' | 'wondrous' | 'potion' | 'scroll' | 'wand' | 'ring' | 'other';
  requires_attunement: boolean;
  attunement_requirements?: string;
  properties?: string[];
  // Weapon specific
  damage?: string;
  damage_type?: string;
  weapon_type?: string;
  // Armor specific
  ac_bonus?: number;
  armor_type?: string;
  // Other
  charges?: number;
  recharge?: string;
}

export interface HomebrewRaceTrait {
  id: string;
  name: string;
  description: string;
  description_markdown?: string;
  mechanical?: {
    weapon_proficiencies?: string[];
    skill_proficiencies?: string[];
    hp_bonus_per_level?: number;
    darkvision_range?: number;
    damage_resistance?: string[];
    saving_throw_advantage?: string[];
    [key: string]: unknown;
  };
}

export interface HomebrewSubrace {
  id: string;
  name: string;
  description?: string;
  ability_bonuses: Partial<CharacterAttributes>;
  traits: HomebrewRaceTrait[];
}

export interface HomebrewRaceData extends HomebrewData {
  size: 'Small' | 'Medium' | 'Large';
  speed: number;
  ability_bonuses: Partial<CharacterAttributes>;
  traits: string[] | HomebrewRaceTrait[];
  languages: string[];
  darkvision?: number;
  weapon_proficiencies?: string[];
  skill_proficiencies?: string[];
  subraces?: HomebrewSubrace[];
}

export interface HomebrewMonsterData extends HomebrewData {
  size: string;
  type: string;
  alignment: string;
  armor_class: number;
  hit_points: string;
  hp?: number;
  ac?: number;
  speed: string;
  attributes: CharacterAttributes;
  saving_throws?: Partial<CharacterAttributes>;
  skills?: Record<string, number>;
  damage_resistances?: string[];
  damage_immunities?: string[];
  condition_immunities?: string[];
  senses?: string;
  languages?: string;
  challenge_rating: string;
  cr?: string;
  xp?: number;
  traits?: MonsterTrait[];
  actions?: MonsterAction[];
  legendary_actions?: MonsterAction[];
  reactions?: MonsterAction[];
}

export interface MonsterTrait {
  name: string;
  description: string;
}

export interface MonsterAction {
  name: string;
  description: string;
  attack_bonus?: number;
  damage?: string;
  damage_type?: string;
}

// Form types for creating homebrew
export interface CreateHomebrewInput {
  type: HomebrewContentType;
  name: string;
  description?: string;
  icon?: string;
  data: HomebrewData;
  is_public?: boolean;
}

export interface UpdateHomebrewInput {
  name?: string;
  description?: string;
  icon?: string;
  data?: HomebrewData;
  is_public?: boolean;
}
