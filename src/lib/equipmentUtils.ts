import armasData from '@/data/equipment/armas.json';
import armadurasData from '@/data/equipment/armaduras.json';
import pacotesData from '@/data/equipment/pacotes-iniciais.json';

// Map item IDs to Portuguese names
const ITEM_NAMES: Record<string, string> = {
  // Misc items
  shield: 'Escudo',
  wooden_shield: 'Escudo de Madeira',
  holy_symbol: 'Símbolo Sagrado',
  druidic_focus: 'Foco Druídico',
  component_pouch: 'Bolsa de Componentes',
  arcane_focus: 'Foco Arcano',
  thieves_tools: 'Ferramentas de Ladrão',
  spellbook: 'Grimório',
  crossbow_bolts: 'Virotes',
  arrows: 'Flechas',
  lute: 'Alaúde',
  musical_instrument: 'Instrumento Musical',
};

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  simple_weapon: 'Qualquer Arma Simples',
  simple_melee_weapon: 'Qualquer Arma Simples Corpo a Corpo',
  martial_weapon: 'Qualquer Arma Marcial',
  martial_melee_weapon: 'Qualquer Arma Marcial Corpo a Corpo',
};

// Category filters for weapon selection
const CATEGORY_FILTERS: Record<string, (item: typeof armasData.items[0]) => boolean> = {
  simple_weapon: (w) => w.category.startsWith('simple'),
  simple_melee_weapon: (w) => w.category === 'simple_melee',
  martial_weapon: (w) => w.category.startsWith('martial'),
  martial_melee_weapon: (w) => w.category === 'martial_melee',
};

export function getItemName(itemId: string): string {
  // Check direct mapping
  if (ITEM_NAMES[itemId]) return ITEM_NAMES[itemId];
  
  // Check weapons
  const weapon = armasData.items.find(w => w.id === itemId);
  if (weapon) return weapon.name;
  
  // Check armors
  const armor = armadurasData.items.find(a => a.id === itemId);
  if (armor) return armor.name;
  
  // Check packs
  const pack = pacotesData.equipment_packs.packs.find(p => p.id === itemId);
  if (pack) return pack.name;
  
  // Check category labels
  if (CATEGORY_LABELS[itemId]) return CATEGORY_LABELS[itemId];
  
  // Fallback
  return itemId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function isCategory(itemId: string): boolean {
  return itemId in CATEGORY_FILTERS;
}

export function isPack(itemId: string): boolean {
  return pacotesData.equipment_packs.packs.some(p => p.id === itemId);
}

export function isArmor(itemId: string): boolean {
  return armadurasData.items.some(a => a.id === itemId) || itemId === 'shield' || itemId === 'wooden_shield';
}

export function isWeapon(itemId: string): boolean {
  return armasData.items.some(w => w.id === itemId);
}

export function getCategoryWeapons(categoryId: string): { id: string; name: string }[] {
  const filter = CATEGORY_FILTERS[categoryId];
  if (!filter) return [];
  return armasData.items.filter(filter).map(w => ({ id: w.id, name: w.name }));
}

export function parseItemWithQuantity(item: string): { id: string; quantity: number } {
  const parts = item.split(':');
  return {
    id: parts[0],
    quantity: parts.length > 1 ? parseInt(parts[1], 10) : 1,
  };
}

/**
 * Describes an option group like ["rapier"] or ["light_crossbow", "crossbow_bolts:20"]
 */
export function describeOptionGroup(items: string[]): string {
  return items.map(item => {
    const { id, quantity } = parseItemWithQuantity(item);
    const name = getItemName(id);
    return quantity > 1 ? `${name} (${quantity})` : name;
  }).join(' + ');
}

export { armasData, armadurasData, pacotesData, CATEGORY_FILTERS };
