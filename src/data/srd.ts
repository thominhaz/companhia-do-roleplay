// D&D 5e SRD Data

export interface Race {
  id: string;
  name: string;
  description: string;
  speed: number;
  size: 'Small' | 'Medium';
  abilityBonuses: Partial<Record<Attribute, number>>;
  traits: string[];
  languages: string[];
  subraces?: Subrace[];
}

export interface Subrace {
  id: string;
  name: string;
  description: string;
  abilityBonuses: Partial<Record<Attribute, number>>;
  traits: string[];
}

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  hitDice: string;
  primaryAbility: Attribute;
  savingThrows: Attribute[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  skillChoices: string[];
  numSkillChoices: number;
  startingEquipment: string[];
}

export type Attribute = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export const RACES: Race[] = [
  {
    id: 'dwarf',
    name: 'Anão',
    description: 'Corajosos e resistentes, os anões são conhecidos como hábeis guerreiros, mineradores e trabalhadores em pedra e metal.',
    speed: 25,
    size: 'Medium',
    abilityBonuses: { constitution: 2 },
    traits: ['Visão no Escuro', 'Resiliência Anã', 'Treinamento Anão em Combate', 'Proficiência com Ferramentas'],
    languages: ['Comum', 'Anão'],
    subraces: [
      {
        id: 'hill-dwarf',
        name: 'Anão da Colina',
        description: 'Anões da colina têm sentidos aguçados, intuição profunda e resiliência notável.',
        abilityBonuses: { wisdom: 1 },
        traits: ['Tenacidade Anã'],
      },
      {
        id: 'mountain-dwarf',
        name: 'Anão da Montanha',
        description: 'Anões da montanha são fortes e resistentes, acostumados a terrenos difíceis.',
        abilityBonuses: { strength: 2 },
        traits: ['Treinamento Anão com Armaduras'],
      },
    ],
  },
  {
    id: 'elf',
    name: 'Elfo',
    description: 'Elfos são um povo mágico de graça sobrenatural, vivendo no mundo mas não inteiramente parte dele.',
    speed: 30,
    size: 'Medium',
    abilityBonuses: { dexterity: 2 },
    traits: ['Visão no Escuro', 'Sentidos Aguçados', 'Ancestral Feérico', 'Transe'],
    languages: ['Comum', 'Élfico'],
    subraces: [
      {
        id: 'high-elf',
        name: 'Alto Elfo',
        description: 'Altos elfos têm mentes afiadas e domínio de pelo menos os fundamentos da magia.',
        abilityBonuses: { intelligence: 1 },
        traits: ['Treinamento Élfico com Armas', 'Truque'],
      },
      {
        id: 'wood-elf',
        name: 'Elfo da Floresta',
        description: 'Elfos da floresta têm sentidos e intuição aguçados, seus pés rápidos os carregam através das florestas.',
        abilityBonuses: { wisdom: 1 },
        traits: ['Treinamento Élfico com Armas', 'Pés Ligeiros', 'Máscara da Natureza'],
      },
    ],
  },
  {
    id: 'halfling',
    name: 'Halfling',
    description: 'As inclinações de um halfling para cortesia e boa vizinhança os tornam bem-vindos em quase todo lugar.',
    speed: 25,
    size: 'Small',
    abilityBonuses: { dexterity: 2 },
    traits: ['Sortudo', 'Corajoso', 'Agilidade Halfling'],
    languages: ['Comum', 'Halfling'],
    subraces: [
      {
        id: 'lightfoot',
        name: 'Pés Leves',
        description: 'Halflings pés leves são adeptos em esconder-se, mesmo usando outras pessoas como cobertura.',
        abilityBonuses: { charisma: 1 },
        traits: ['Furtividade Natural'],
      },
      {
        id: 'stout',
        name: 'Robusto',
        description: 'Halflings robustos são mais resistentes que a média e possuem resistência a venenos.',
        abilityBonuses: { constitution: 1 },
        traits: ['Resiliência Robusta'],
      },
    ],
  },
  {
    id: 'human',
    name: 'Humano',
    description: 'Humanos são os mais adaptáveis e ambiciosos entre as raças comuns.',
    speed: 30,
    size: 'Medium',
    abilityBonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    traits: ['Versatilidade'],
    languages: ['Comum', 'Um idioma à escolha'],
  },
  {
    id: 'dragonborn',
    name: 'Draconato',
    description: 'Nascidos de dragões, os draconatos caminham orgulhosamente por um mundo que os vê com medo.',
    speed: 30,
    size: 'Medium',
    abilityBonuses: { strength: 2, charisma: 1 },
    traits: ['Ancestral Dracônico', 'Arma de Sopro', 'Resistência a Dano'],
    languages: ['Comum', 'Dracônico'],
  },
  {
    id: 'gnome',
    name: 'Gnomo',
    description: 'A energia e entusiasmo de um gnomo pela vida brilham através de cada centímetro de seu corpo.',
    speed: 25,
    size: 'Small',
    abilityBonuses: { intelligence: 2 },
    traits: ['Visão no Escuro', 'Esperteza Gnômica'],
    languages: ['Comum', 'Gnômico'],
    subraces: [
      {
        id: 'rock-gnome',
        name: 'Gnomo das Rochas',
        description: 'Gnomos das rochas são inventores e engenhoqueiros naturais.',
        abilityBonuses: { constitution: 1 },
        traits: ['Conhecimento de Artífice', 'Engenhoqueiro'],
      },
    ],
  },
  {
    id: 'half-elf',
    name: 'Meio-Elfo',
    description: 'Meio-elfos combinam o que alguns dizem ser as melhores qualidades de humanos e elfos.',
    speed: 30,
    size: 'Medium',
    abilityBonuses: { charisma: 2 },
    traits: ['Visão no Escuro', 'Ancestral Feérico', 'Versatilidade em Perícias'],
    languages: ['Comum', 'Élfico', 'Um idioma à escolha'],
  },
  {
    id: 'half-orc',
    name: 'Meio-Orc',
    description: 'Meio-orcs combinam a força implacável de seus ancestrais orcs com a tenacidade humana.',
    speed: 30,
    size: 'Medium',
    abilityBonuses: { strength: 2, constitution: 1 },
    traits: ['Visão no Escuro', 'Ameaçador', 'Resistência Implacável', 'Ataques Selvagens'],
    languages: ['Comum', 'Orc'],
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    description: 'Tieflings descendem de humanos que fizeram pactos com demônios, carregando a marca dessa herança.',
    speed: 30,
    size: 'Medium',
    abilityBonuses: { intelligence: 1, charisma: 2 },
    traits: ['Visão no Escuro', 'Resistência Infernal', 'Legado Infernal'],
    languages: ['Comum', 'Infernal'],
  },
];

export const CLASSES: CharacterClass[] = [
  {
    id: 'barbarian',
    name: 'Bárbaro',
    description: 'Um guerreiro feroz que entra em fúria devastadora em combate.',
    hitDice: 'd12',
    primaryAbility: 'strength',
    savingThrows: ['strength', 'constitution'],
    armorProficiencies: ['Leve', 'Média', 'Escudos'],
    weaponProficiencies: ['Simples', 'Marciais'],
    skillChoices: ['Adestrar Animais', 'Atletismo', 'Intimidação', 'Natureza', 'Percepção', 'Sobrevivência'],
    numSkillChoices: 2,
    startingEquipment: ['Machado Grande ou Arma Marcial', 'Dois Machados de Mão ou Arma Simples', 'Pacote de Explorador', '4 Azagaias'],
  },
  {
    id: 'bard',
    name: 'Bardo',
    description: 'Um mestre inspirador da música, usando palavras e canções para tecer magia.',
    hitDice: 'd8',
    primaryAbility: 'charisma',
    savingThrows: ['dexterity', 'charisma'],
    armorProficiencies: ['Leve'],
    weaponProficiencies: ['Simples', 'Bestas de Mão', 'Espadas Longas', 'Rapieiras', 'Espadas Curtas'],
    skillChoices: ['Qualquer'],
    numSkillChoices: 3,
    startingEquipment: ['Rapieira, Espada Longa ou Arma Simples', 'Pacote de Diplomata ou Entretenimento', 'Alaúde ou Instrumento', 'Armadura de Couro', 'Adaga'],
  },
  {
    id: 'cleric',
    name: 'Clérigo',
    description: 'Um campeão sacerdotal que empunha magia divina a serviço de uma divindade.',
    hitDice: 'd8',
    primaryAbility: 'wisdom',
    savingThrows: ['wisdom', 'charisma'],
    armorProficiencies: ['Leve', 'Média', 'Escudos'],
    weaponProficiencies: ['Simples'],
    skillChoices: ['História', 'Intuição', 'Medicina', 'Persuasão', 'Religião'],
    numSkillChoices: 2,
    startingEquipment: ['Maça ou Martelo de Guerra', 'Cota de Malha, Armadura de Escamas ou Couro', 'Besta Leve ou Arma Simples', 'Pacote de Sacerdote ou Explorador', 'Escudo', 'Símbolo Sagrado'],
  },
  {
    id: 'druid',
    name: 'Druida',
    description: 'Um sacerdote da Velha Fé, empunhando os poderes da natureza.',
    hitDice: 'd8',
    primaryAbility: 'wisdom',
    savingThrows: ['intelligence', 'wisdom'],
    armorProficiencies: ['Leve', 'Média', 'Escudos (não metal)'],
    weaponProficiencies: ['Clavas', 'Adagas', 'Dardos', 'Azagaias', 'Maças', 'Bordões', 'Cimitarras', 'Fundas', 'Lanças'],
    skillChoices: ['Arcanismo', 'Adestrar Animais', 'Intuição', 'Medicina', 'Natureza', 'Percepção', 'Religião', 'Sobrevivência'],
    numSkillChoices: 2,
    startingEquipment: ['Escudo de Madeira ou Arma Simples', 'Cimitarra ou Arma Simples de Combate Corpo a Corpo', 'Armadura de Couro', 'Pacote de Explorador', 'Foco Druídico'],
  },
  {
    id: 'fighter',
    name: 'Guerreiro',
    description: 'Um mestre do combate marcial, proficiente em diversas armas e armaduras.',
    hitDice: 'd10',
    primaryAbility: 'strength',
    savingThrows: ['strength', 'constitution'],
    armorProficiencies: ['Todas', 'Escudos'],
    weaponProficiencies: ['Simples', 'Marciais'],
    skillChoices: ['Acrobacia', 'Adestrar Animais', 'Atletismo', 'História', 'Intuição', 'Intimidação', 'Percepção', 'Sobrevivência'],
    numSkillChoices: 2,
    startingEquipment: ['Cota de Malha ou Armadura de Couro', 'Arma Marcial e Escudo ou Duas Armas Marciais', 'Besta Leve ou Dois Machados de Arremesso', 'Pacote de Aventureiro ou Explorador'],
  },
  {
    id: 'monk',
    name: 'Monge',
    description: 'Um mestre das artes marciais, aproveitando o poder do corpo em busca da perfeição física e espiritual.',
    hitDice: 'd8',
    primaryAbility: 'dexterity',
    savingThrows: ['strength', 'dexterity'],
    armorProficiencies: [],
    weaponProficiencies: ['Simples', 'Espadas Curtas'],
    skillChoices: ['Acrobacia', 'Atletismo', 'História', 'Intuição', 'Religião', 'Furtividade'],
    numSkillChoices: 2,
    startingEquipment: ['Espada Curta ou Arma Simples', 'Pacote de Aventureiro ou Explorador', '10 Dardos'],
  },
  {
    id: 'paladin',
    name: 'Paladino',
    description: 'Um guerreiro sagrado ligado a um juramento sagrado.',
    hitDice: 'd10',
    primaryAbility: 'strength',
    savingThrows: ['wisdom', 'charisma'],
    armorProficiencies: ['Todas', 'Escudos'],
    weaponProficiencies: ['Simples', 'Marciais'],
    skillChoices: ['Atletismo', 'Intuição', 'Intimidação', 'Medicina', 'Persuasão', 'Religião'],
    numSkillChoices: 2,
    startingEquipment: ['Arma Marcial e Escudo ou Duas Armas Marciais', 'Cinco Azagaias ou Arma Simples de Combate Corpo a Corpo', 'Pacote de Sacerdote ou Explorador', 'Cota de Malha', 'Símbolo Sagrado'],
  },
  {
    id: 'ranger',
    name: 'Patrulheiro',
    description: 'Um guerreiro que combate ameaças nas bordas da civilização.',
    hitDice: 'd10',
    primaryAbility: 'dexterity',
    savingThrows: ['strength', 'dexterity'],
    armorProficiencies: ['Leve', 'Média', 'Escudos'],
    weaponProficiencies: ['Simples', 'Marciais'],
    skillChoices: ['Adestrar Animais', 'Atletismo', 'Intuição', 'Investigação', 'Natureza', 'Percepção', 'Furtividade', 'Sobrevivência'],
    numSkillChoices: 3,
    startingEquipment: ['Cota de Escamas ou Armadura de Couro', 'Duas Espadas Curtas ou Duas Armas Simples de Combate Corpo a Corpo', 'Pacote de Aventureiro ou Explorador', 'Arco Longo e Aljava com 20 Flechas'],
  },
  {
    id: 'rogue',
    name: 'Ladino',
    description: 'Um patife que usa furtividade e astúcia para superar obstáculos e inimigos.',
    hitDice: 'd8',
    primaryAbility: 'dexterity',
    savingThrows: ['dexterity', 'intelligence'],
    armorProficiencies: ['Leve'],
    weaponProficiencies: ['Simples', 'Bestas de Mão', 'Espadas Longas', 'Rapieiras', 'Espadas Curtas'],
    skillChoices: ['Acrobacia', 'Atletismo', 'Enganação', 'Intuição', 'Intimidação', 'Investigação', 'Percepção', 'Atuação', 'Persuasão', 'Prestidigitação', 'Furtividade'],
    numSkillChoices: 4,
    startingEquipment: ['Rapieira ou Espada Curta', 'Arco Curto e Aljava com 20 Flechas ou Espada Curta', 'Pacote de Assaltante, Aventureiro ou Explorador', 'Armadura de Couro', 'Duas Adagas', 'Ferramentas de Ladrão'],
  },
  {
    id: 'sorcerer',
    name: 'Feiticeiro',
    description: 'Um conjurador que tira seu poder mágico de uma linhagem abençoada ou alguma outra fonte exótica.',
    hitDice: 'd6',
    primaryAbility: 'charisma',
    savingThrows: ['constitution', 'charisma'],
    armorProficiencies: [],
    weaponProficiencies: ['Adagas', 'Dardos', 'Fundas', 'Bordões', 'Bestas Leves'],
    skillChoices: ['Arcanismo', 'Enganação', 'Intuição', 'Intimidação', 'Persuasão', 'Religião'],
    numSkillChoices: 2,
    startingEquipment: ['Besta Leve e 20 Virotes ou Arma Simples', 'Bolsa de Componentes ou Foco Arcano', 'Pacote de Aventureiro ou Explorador', 'Duas Adagas'],
  },
  {
    id: 'warlock',
    name: 'Bruxo',
    description: 'Um portador de magia derivada de um pacto com uma entidade extraplanar.',
    hitDice: 'd8',
    primaryAbility: 'charisma',
    savingThrows: ['wisdom', 'charisma'],
    armorProficiencies: ['Leve'],
    weaponProficiencies: ['Simples'],
    skillChoices: ['Arcanismo', 'Enganação', 'História', 'Intimidação', 'Investigação', 'Natureza', 'Religião'],
    numSkillChoices: 2,
    startingEquipment: ['Besta Leve e 20 Virotes ou Arma Simples', 'Bolsa de Componentes ou Foco Arcano', 'Pacote de Estudioso ou Aventureiro', 'Armadura de Couro', 'Arma Simples', 'Duas Adagas'],
  },
  {
    id: 'wizard',
    name: 'Mago',
    description: 'Um usuário de magia acadêmico capaz de manipular as estruturas da realidade.',
    hitDice: 'd6',
    primaryAbility: 'intelligence',
    savingThrows: ['intelligence', 'wisdom'],
    armorProficiencies: [],
    weaponProficiencies: ['Adagas', 'Dardos', 'Fundas', 'Bordões', 'Bestas Leves'],
    skillChoices: ['Arcanismo', 'História', 'Intuição', 'Investigação', 'Medicina', 'Religião'],
    numSkillChoices: 2,
    startingEquipment: ['Bordão ou Adaga', 'Bolsa de Componentes ou Foco Arcano', 'Pacote de Estudioso ou Explorador', 'Grimório'],
  },
];

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

export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getModifierString(score: number): string {
  const mod = getModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function calculateHP(hitDice: string, conModifier: number, level: number): number {
  const diceValue = parseInt(hitDice.replace('d', ''));
  // Level 1: max dice + con modifier
  // Each additional level: average (rounded up) + con modifier
  const firstLevel = diceValue + conModifier;
  const additionalLevels = (level - 1) * (Math.ceil(diceValue / 2) + 1 + conModifier);
  return Math.max(1, firstLevel + additionalLevels);
}
