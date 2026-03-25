/**
 * 5e.tools JSON → GO20 Homebrew converter
 * Supports: spells, items, monsters, classes/subclasses
 * 
 * 5e.tools JSON format reference:
 * - Spells: { spell: [...] }
 * - Items: { item: [...] } or { magicvariant: [...] }
 * - Monsters: { monster: [...] }
 * - Class: { class: [...] }
 * - Subclass: { subclass: [...] }
 */

import type {
  HomebrewContentType,
  HomebrewSpellData,
  HomebrewItemData,
  HomebrewMonsterData,
  HomebrewData,
  CharacterAttributes,
} from '@/types';

export interface ImportedItem {
  type: HomebrewContentType;
  name: string;
  description: string;
  icon: string;
  data: HomebrewData;
}

export interface ImportResult {
  items: ImportedItem[];
  errors: string[];
  warnings: string[];
}

// ─── Utility helpers ───

function renderEntries(entries: any[] | string | undefined): string {
  if (!entries) return '';
  if (typeof entries === 'string') return entries;
  return entries.map(e => {
    if (typeof e === 'string') return e;
    if (e.type === 'list') {
      return (e.items || []).map((i: any) => `• ${renderEntries([i])}`).join('\n');
    }
    if (e.type === 'table') {
      return `[Tabela: ${e.caption || ''}]`;
    }
    if (e.type === 'entries' || e.type === 'inset') {
      return `**${e.name || ''}**\n${renderEntries(e.entries)}`;
    }
    if (e.entries) return renderEntries(e.entries);
    if (typeof e === 'object') return JSON.stringify(e);
    return String(e);
  }).join('\n\n');
}

function parseAbilityScore(obj: any): Partial<CharacterAttributes> {
  const map: Record<string, keyof CharacterAttributes> = {
    str: 'strength', dex: 'dexterity', con: 'constitution',
    int: 'intelligence', wis: 'wisdom', cha: 'charisma',
  };
  const result: Partial<CharacterAttributes> = {};
  if (!obj) return result;
  for (const [k, v] of Object.entries(obj)) {
    const key = map[k.toLowerCase()];
    if (key && typeof v === 'number') result[key] = v;
  }
  return result;
}

// ─── School mapping ───

const schoolMap: Record<string, string> = {
  A: 'Abjuração', C: 'Conjuração', D: 'Adivinhação', E: 'Encantamento',
  V: 'Evocação', I: 'Ilusão', N: 'Necromancia', T: 'Transmutação',
};

// ─── Spell parser ───

function parseSpell(raw: any): ImportedItem | null {
  try {
    const components: string[] = [];
    if (raw.components?.v) components.push('V');
    if (raw.components?.s) components.push('S');
    if (raw.components?.m) {
      const mat = typeof raw.components.m === 'string' ? raw.components.m : raw.components.m?.text || 'M';
      components.push(`M (${mat})`);
    }

    let range = '';
    if (raw.range?.type === 'point') {
      const dist = raw.range.distance;
      if (dist?.type === 'self') range = 'Pessoal';
      else if (dist?.type === 'touch') range = 'Toque';
      else if (dist?.type === 'feet') range = `${dist.amount} pés`;
      else if (dist?.type === 'miles') range = `${dist.amount} milha(s)`;
      else range = dist?.amount ? `${dist.amount} ${dist.type}` : 'Variável';
    } else if (raw.range?.type === 'special') {
      range = 'Especial';
    } else {
      range = 'Variável';
    }

    let duration = '';
    if (raw.duration?.[0]) {
      const d = raw.duration[0];
      if (d.type === 'instant') duration = 'Instantânea';
      else if (d.type === 'permanent') duration = 'Permanente';
      else if (d.type === 'special') duration = 'Especial';
      else if (d.type === 'timed') {
        const conc = d.concentration ? 'Concentração, ' : '';
        duration = `${conc}${d.duration?.amount || ''} ${d.duration?.type || ''}`;
      } else {
        duration = String(d.type);
      }
    }

    let castingTime = '';
    if (raw.time?.[0]) {
      const t = raw.time[0];
      castingTime = `${t.number || 1} ${t.unit || 'action'}`;
    }

    const classes = (raw.classes?.fromClassList || []).map((c: any) => c.name);

    const data: HomebrewSpellData = {
      level: raw.level ?? 0,
      school: schoolMap[raw.school] || raw.school || 'Evocação',
      casting_time: castingTime,
      range,
      components: components.join(', '),
      duration,
      classes,
      mechanics: {},
    };

    return {
      type: 'spell',
      name: raw.name,
      description: renderEntries(raw.entries),
      icon: '✨',
      data,
    };
  } catch {
    return null;
  }
}

// ─── Item parser ───

const rarityMap: Record<string, HomebrewItemData['rarity']> = {
  common: 'common', uncommon: 'uncommon', rare: 'rare',
  'very rare': 'very_rare', legendary: 'legendary', artifact: 'artifact',
  none: 'common', varies: 'uncommon',
};

const itemTypeMap: Record<string, HomebrewItemData['type']> = {
  S: 'weapon', M: 'weapon', R: 'weapon', A: 'armor', LA: 'armor', MA: 'armor', HA: 'armor',
  P: 'potion', SC: 'scroll', WD: 'wand', RG: 'ring', W: 'wondrous',
};

function parseItem(raw: any): ImportedItem | null {
  try {
    const data: HomebrewItemData = {
      rarity: rarityMap[raw.rarity?.toLowerCase()] || 'common',
      type: itemTypeMap[raw.type] || 'wondrous',
      requires_attunement: !!raw.reqAttune,
      attunement_requirements: typeof raw.reqAttune === 'string' ? raw.reqAttune : undefined,
      properties: raw.property || [],
      damage: raw.dmg1 ? `${raw.dmg1} ${raw.dmgType || ''}` : undefined,
      damage_type: raw.dmgType || undefined,
      charges: raw.charges || undefined,
      recharge: raw.recharge || undefined,
    };

    return {
      type: 'item',
      name: raw.name,
      description: renderEntries(raw.entries),
      icon: '💎',
      data,
    };
  } catch {
    return null;
  }
}

// ─── Monster parser ───

function parseMonster(raw: any): ImportedItem | null {
  try {
    const attrs: CharacterAttributes = {
      strength: raw.str ?? 10,
      dexterity: raw.dex ?? 10,
      constitution: raw.con ?? 10,
      intelligence: raw.int ?? 10,
      wisdom: raw.wis ?? 10,
      charisma: raw.cha ?? 10,
    };

    let ac = 10;
    if (Array.isArray(raw.ac)) {
      const first = raw.ac[0];
      ac = typeof first === 'number' ? first : first?.ac ?? 10;
    } else if (typeof raw.ac === 'number') {
      ac = raw.ac;
    }

    let hp = '0';
    let hpNum = 0;
    if (raw.hp) {
      if (typeof raw.hp === 'object') {
        hp = raw.hp.formula || `${raw.hp.average || 0}`;
        hpNum = raw.hp.average || 0;
      } else {
        hp = String(raw.hp);
        hpNum = parseInt(String(raw.hp)) || 0;
      }
    }

    let speedStr = '';
    if (raw.speed) {
      const parts: string[] = [];
      if (typeof raw.speed === 'object') {
        if (raw.speed.walk) parts.push(`${typeof raw.speed.walk === 'number' ? raw.speed.walk : raw.speed.walk.number} pés`);
        if (raw.speed.fly) parts.push(`voo ${typeof raw.speed.fly === 'number' ? raw.speed.fly : raw.speed.fly.number} pés`);
        if (raw.speed.swim) parts.push(`nado ${typeof raw.speed.swim === 'number' ? raw.speed.swim : raw.speed.swim.number} pés`);
        if (raw.speed.climb) parts.push(`escalar ${typeof raw.speed.climb === 'number' ? raw.speed.climb : raw.speed.climb.number} pés`);
        if (raw.speed.burrow) parts.push(`escavar ${typeof raw.speed.burrow === 'number' ? raw.speed.burrow : raw.speed.burrow.number} pés`);
      } else {
        speedStr = String(raw.speed);
      }
      if (parts.length) speedStr = parts.join(', ');
    }

    const parseTraits = (arr: any[]): { name: string; description: string }[] => {
      if (!Array.isArray(arr)) return [];
      return arr.map(t => ({
        name: t.name || 'Sem nome',
        description: renderEntries(t.entries),
      }));
    };

    const sizeMap: Record<string, string> = { T: 'Miúdo', S: 'Pequeno', M: 'Médio', L: 'Grande', H: 'Enorme', G: 'Colossal' };

    const cr = typeof raw.cr === 'object' ? raw.cr.cr : (raw.cr ?? '0');

    const data: HomebrewMonsterData = {
      size: sizeMap[Array.isArray(raw.size) ? raw.size[0] : raw.size] || 'Médio',
      type: typeof raw.type === 'string' ? raw.type : raw.type?.type || 'criatura',
      alignment: Array.isArray(raw.alignment)
        ? raw.alignment.map((a: any) => typeof a === 'string' ? a : a.alignment || '').join(' ')
        : (raw.alignment || 'sem alinhamento'),
      armor_class: ac,
      ac,
      hit_points: hp,
      hp: hpNum,
      speed: speedStr,
      attributes: attrs,
      saving_throws: raw.save ? parseAbilityScore(raw.save) : undefined,
      damage_resistances: raw.resist || [],
      damage_immunities: raw.immune || [],
      condition_immunities: (raw.conditionImmune || []).map((c: any) => typeof c === 'string' ? c : c.conditionImmune || ''),
      senses: Array.isArray(raw.senses) ? raw.senses.join(', ') : (raw.senses || ''),
      languages: Array.isArray(raw.languages) ? raw.languages.join(', ') : (raw.languages || ''),
      challenge_rating: String(cr),
      cr: String(cr),
      traits: parseTraits(raw.trait),
      actions: parseTraits(raw.action),
      legendary_actions: parseTraits(raw.legendary),
      reactions: parseTraits(raw.reaction),
    };

    return {
      type: 'monster',
      name: raw.name,
      description: `${data.size} ${data.type}, ${data.alignment}`,
      icon: '💀',
      data,
    };
  } catch {
    return null;
  }
}

// ─── Class/Subclass parser ───

function parseClass(raw: any): ImportedItem | null {
  try {
    const features = (raw.classFeatures || []).flatMap((featureGroup: any) => {
      if (typeof featureGroup === 'string') return [];
      const entries = Array.isArray(featureGroup) ? featureGroup : [featureGroup];
      return entries.map((f: any) => ({
        id: crypto.randomUUID(),
        name: f.name || 'Habilidade',
        description: renderEntries(f.entries),
        level: f.level || 1,
      }));
    });

    const data: HomebrewData = {
      hit_die: raw.hd?.faces ? `d${raw.hd.faces}` : 'd8',
      primary_ability: raw.primaryAbility || [],
      saving_throws: raw.proficiency || [],
      features,
    };

    return {
      type: 'class',
      name: raw.name,
      description: renderEntries(raw.entries) || `Classe importada do 5e.tools`,
      icon: '⚔️',
      data,
    };
  } catch {
    return null;
  }
}

function parseSubclass(raw: any): ImportedItem | null {
  try {
    const features = (raw.subclassFeatures || []).flatMap((featureGroup: any) => {
      if (typeof featureGroup === 'string') return [];
      const entries = Array.isArray(featureGroup) ? featureGroup : [featureGroup];
      return entries.map((f: any) => ({
        id: crypto.randomUUID(),
        name: f.name || 'Habilidade',
        description: renderEntries(f.entries),
        level: f.level || 3,
      }));
    });

    const data: HomebrewData = {
      parent_class: raw.className || '',
      parent_class_source: raw.classSource || 'PHB',
      features,
    };

    return {
      type: 'subclass',
      name: raw.name,
      description: renderEntries(raw.entries) || `Subclasse de ${raw.className || 'desconhecida'}`,
      icon: '🛡️',
      data,
    };
  } catch {
    return null;
  }
}

// ─── Main import function ───

export function parse5eToolsJSON(jsonText: string): ImportResult {
  const result: ImportResult = { items: [], errors: [], warnings: [] };

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    result.errors.push('JSON inválido. Verifique a formatação e tente novamente.');
    return result;
  }

  // Detect format: could be { spell: [...] }, { item: [...] }, etc.
  // Or a single object without wrapper
  const processors: { key: string; parser: (raw: any) => ImportedItem | null; label: string }[] = [
    { key: 'spell', parser: parseSpell, label: 'magia' },
    { key: 'item', parser: parseItem, label: 'item' },
    { key: 'baseitem', parser: parseItem, label: 'item base' },
    { key: 'magicvariant', parser: parseItem, label: 'variante mágica' },
    { key: 'monster', parser: parseMonster, label: 'monstro' },
    { key: 'class', parser: parseClass, label: 'classe' },
    { key: 'subclass', parser: parseSubclass, label: 'subclasse' },
  ];

  let found = false;

  for (const { key, parser, label } of processors) {
    const arr = parsed[key];
    if (Array.isArray(arr) && arr.length > 0) {
      found = true;
      for (const raw of arr) {
        const item = parser(raw);
        if (item) {
          result.items.push(item);
        } else {
          result.warnings.push(`Falha ao importar ${label}: ${raw.name || 'sem nome'}`);
        }
      }
    }
  }

  // Try single-object detection if no array wrapper found
  if (!found) {
    // Check if it looks like a single spell/item/monster
    if (parsed.name) {
      let item: ImportedItem | null = null;
      if (parsed.level !== undefined && parsed.school) item = parseSpell(parsed);
      else if (parsed.str !== undefined && parsed.ac) item = parseMonster(parsed);
      else if (parsed.rarity !== undefined || parsed.type) item = parseItem(parsed);
      else if (parsed.hd && parsed.classFeatures) item = parseClass(parsed);
      else if (parsed.className && parsed.subclassFeatures) item = parseSubclass(parsed);

      if (item) {
        result.items.push(item);
        found = true;
      }
    }
  }

  if (!found) {
    result.errors.push('Nenhum conteúdo reconhecido no JSON. Formatos aceitos: spell, item, monster, class, subclass.');
  }

  return result;
}

export function getTypeLabel(type: HomebrewContentType): string {
  const labels: Record<HomebrewContentType, string> = {
    spell: 'Magia',
    item: 'Item',
    race: 'Raça',
    class: 'Classe',
    subclass: 'Subclasse',
    monster: 'Monstro',
    background: 'Antecedente',
    feat: 'Talento',
  };
  return labels[type] || type;
}

export function getTypeIcon(type: HomebrewContentType): string {
  const icons: Record<HomebrewContentType, string> = {
    spell: '✨',
    item: '💎',
    race: '🧬',
    class: '⚔️',
    subclass: '🛡️',
    monster: '💀',
    background: '📖',
    feat: '⭐',
  };
  return icons[type] || '📦';
}
