import { useState, useEffect } from "react";
import { Loader2, Gem } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHomebrew } from "@/hooks/useHomebrew";
import { HomebrewContent, HomebrewItemData } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CreateItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: HomebrewContent;
}

const itemRarities = [
  { value: "common", label: "Comum" },
  { value: "uncommon", label: "Incomum" },
  { value: "rare", label: "Raro" },
  { value: "very_rare", label: "Muito Raro" },
  { value: "legendary", label: "Lendário" },
  { value: "artifact", label: "Artefato" },
];

// Categorized item types
const itemCategories = [
  { 
    label: "Equipáveis", 
    items: [
      { value: "weapon", label: "Arma", icon: "⚔️" },
      { value: "armor", label: "Armadura", icon: "🛡️" },
      { value: "wondrous", label: "Item Maravilhoso", icon: "✨" },
      { value: "ring", label: "Anel", icon: "💍" },
      { value: "wand", label: "Varinha", icon: "🪄" },
      { value: "rod", label: "Bastão", icon: "🏑" },
      { value: "staff", label: "Cajado", icon: "🦯" },
    ]
  },
  { 
    label: "Consumíveis", 
    items: [
      { value: "potion", label: "Poção", icon: "🧪" },
      { value: "scroll", label: "Pergaminho", icon: "📜" },
      { value: "ammunition", label: "Munição Mágica", icon: "🏹" },
      { value: "poison", label: "Veneno", icon: "☠️" },
      { value: "food", label: "Comida/Bebida", icon: "🍖" },
      { value: "bomb", label: "Bomba/Granada", icon: "💣" },
      { value: "oil", label: "Óleo/Unguento", icon: "🫗" },
      { value: "consumable_other", label: "Outro Consumível", icon: "📦" },
    ]
  },
  {
    label: "Outros",
    items: [
      { value: "container", label: "Recipiente Mágico", icon: "👜" },
      { value: "instrument", label: "Instrumento", icon: "🎸" },
      { value: "tool", label: "Ferramenta Mágica", icon: "🔧" },
      { value: "other", label: "Outro", icon: "💎" },
    ]
  }
];

// Flatten for lookup
const allItemTypes = itemCategories.flatMap(cat => cat.items);

const damageTypes = [
  { value: "none", label: "Nenhum" },
  { value: "acid", label: "Ácido" },
  { value: "bludgeoning", label: "Concussão" },
  { value: "cold", label: "Frio" },
  { value: "fire", label: "Fogo" },
  { value: "force", label: "Força" },
  { value: "lightning", label: "Elétrico" },
  { value: "necrotic", label: "Necrótico" },
  { value: "piercing", label: "Perfurante" },
  { value: "poison", label: "Veneno" },
  { value: "psychic", label: "Psíquico" },
  { value: "radiant", label: "Radiante" },
  { value: "slashing", label: "Cortante" },
  { value: "thunder", label: "Trovão" },
];

// Consumable specific options
const consumableEffectTypes = [
  { value: "healing", label: "Cura", icon: "❤️" },
  { value: "buff", label: "Fortalecimento", icon: "💪" },
  { value: "damage", label: "Dano", icon: "💥" },
  { value: "utility", label: "Utilidade", icon: "🔮" },
  { value: "restoration", label: "Restauração", icon: "✨" },
  { value: "transformation", label: "Transformação", icon: "🦋" },
  { value: "detection", label: "Detecção", icon: "👁️" },
  { value: "movement", label: "Movimento", icon: "💨" },
  { value: "protection", label: "Proteção", icon: "🛡️" },
  { value: "special", label: "Especial", icon: "⭐" },
];

const consumableDurations = [
  { value: "instant", label: "Instantâneo" },
  { value: "1_round", label: "1 rodada" },
  { value: "1_minute", label: "1 minuto" },
  { value: "10_minutes", label: "10 minutos" },
  { value: "1_hour", label: "1 hora" },
  { value: "8_hours", label: "8 horas" },
  { value: "24_hours", label: "24 horas" },
  { value: "permanent", label: "Permanente" },
  { value: "special", label: "Especial" },
];

const saveTypes = [
  { value: "none", label: "Nenhum" },
  { value: "STR", label: "Força" },
  { value: "DEX", label: "Destreza" },
  { value: "CON", label: "Constituição" },
  { value: "INT", label: "Inteligência" },
  { value: "WIS", label: "Sabedoria" },
  { value: "CHA", label: "Carisma" },
];

const potionColors = [
  { value: "red", label: "Vermelho", hex: "#ef4444" },
  { value: "blue", label: "Azul", hex: "#3b82f6" },
  { value: "green", label: "Verde", hex: "#22c55e" },
  { value: "purple", label: "Roxo", hex: "#a855f7" },
  { value: "orange", label: "Laranja", hex: "#f97316" },
  { value: "yellow", label: "Amarelo", hex: "#eab308" },
  { value: "pink", label: "Rosa", hex: "#ec4899" },
  { value: "black", label: "Preto", hex: "#1f2937" },
  { value: "white", label: "Branco/Transparente", hex: "#f3f4f6" },
  { value: "gold", label: "Dourado", hex: "#fbbf24" },
  { value: "silver", label: "Prateado", hex: "#9ca3af" },
  { value: "multicolor", label: "Multicor", hex: "linear-gradient(45deg, #ef4444, #3b82f6, #22c55e)" },
];

// Weapon specific options
const weaponCategories = [
  { value: "simple", label: "Simples" },
  { value: "martial", label: "Marcial" },
];

const weaponTypes = [
  { value: "melee", label: "Corpo a Corpo" },
  { value: "ranged", label: "À Distância" },
];

const weaponProperties = [
  { value: "ammunition", label: "Munição", description: "Requer munição para atacar à distância" },
  { value: "finesse", label: "Acuidade", description: "Use Força ou Destreza para ataque e dano" },
  { value: "heavy", label: "Pesada", description: "Criaturas Pequenas têm desvantagem" },
  { value: "light", label: "Leve", description: "Ideal para combate com duas armas" },
  { value: "loading", label: "Recarga", description: "Apenas um ataque por ação, independente de ataques extras" },
  { value: "reach", label: "Alcance", description: "+1,5m de alcance em ataques corpo a corpo" },
  { value: "thrown", label: "Arremesso", description: "Pode ser arremessada para ataque à distância" },
  { value: "two_handed", label: "Duas Mãos", description: "Requer duas mãos para usar" },
  { value: "versatile", label: "Versátil", description: "Pode ser usada com uma ou duas mãos" },
  { value: "special", label: "Especial", description: "Possui regras especiais" },
];

// Armor specific options
const armorCategories = [
  { value: "light", label: "Armadura Leve" },
  { value: "medium", label: "Armadura Média" },
  { value: "heavy", label: "Armadura Pesada" },
  { value: "shield", label: "Escudo" },
];

const armorBaseTypes = {
  light: [
    { value: "padded", label: "Acolchoada", baseAC: 11 },
    { value: "leather", label: "Couro", baseAC: 11 },
    { value: "studded", label: "Couro Batido", baseAC: 12 },
    { value: "custom_light", label: "Personalizada", baseAC: 11 },
  ],
  medium: [
    { value: "hide", label: "Peles", baseAC: 12 },
    { value: "chain_shirt", label: "Camisão de Malha", baseAC: 13 },
    { value: "scale_mail", label: "Brunea", baseAC: 14 },
    { value: "breastplate", label: "Corselete", baseAC: 14 },
    { value: "half_plate", label: "Meia Armadura", baseAC: 15 },
    { value: "custom_medium", label: "Personalizada", baseAC: 13 },
  ],
  heavy: [
    { value: "ring_mail", label: "Cota de Anéis", baseAC: 14 },
    { value: "chain_mail", label: "Cota de Malha", baseAC: 16 },
    { value: "splint", label: "Cota de Talas", baseAC: 17 },
    { value: "plate", label: "Armadura Completa (Placas)", baseAC: 18 },
    { value: "custom_heavy", label: "Personalizada", baseAC: 16 },
  ],
  shield: [
    { value: "shield", label: "Escudo", baseAC: 2 },
    { value: "custom_shield", label: "Personalizado", baseAC: 2 },
  ],
};

// Check if type is consumable
const consumableTypes = ['potion', 'scroll', 'ammunition', 'poison', 'food', 'bomb', 'oil', 'consumable_other'];
const isConsumableType = (type: string) => consumableTypes.includes(type);

const defaultFormState = {
  name: "",
  description: "",
  icon: "💎",
  rarity: "uncommon",
  type: "wondrous",
  requires_attunement: false,
  attunement_requirements: "",
  // Weapon fields
  damage: "",
  damage_type: "none",
  weapon_category: "simple",
  weapon_type: "melee",
  weapon_properties: [] as string[],
  range_normal: "",
  range_long: "",
  versatile_damage: "",
  // Armor fields
  armor_category: "light",
  armor_base_type: "leather",
  base_ac: 11,
  ac_bonus: "",
  max_dex_bonus: "full",
  stealth_disadvantage: false,
  strength_requirement: "",
  // Consumable fields
  consumable_effect_type: "utility",
  consumable_effect_value: "",
  consumable_duration: "instant",
  consumable_save_dc: "",
  consumable_save_type: "none",
  consumable_damage: "",
  consumable_damage_type: "none",
  consumable_healing: "",
  consumable_uses: "1",
  consumable_area: "",
  potion_color: "blue",
  scroll_spell_level: "0",
  scroll_spell_name: "",
  ammunition_quantity: "20",
  // Common
  weight: "",
  charges: "",
  recharge: "",
};

export function CreateItemSheet({ open, onOpenChange, editingItem }: CreateItemSheetProps) {
  const { createHomebrew, updateHomebrew, isCreating, isUpdating } = useHomebrew();
  const isEditing = !!editingItem;
  
  const [form, setForm] = useState(defaultFormState);

  // Populate form when editing
  useEffect(() => {
    if (editingItem) {
      const data = editingItem.data as HomebrewItemData & Record<string, any>;
      setForm({
        name: editingItem.name,
        description: editingItem.description || "",
        icon: editingItem.icon,
        rarity: data.rarity || "uncommon",
        type: data.type || "wondrous",
        requires_attunement: data.requires_attunement || false,
        attunement_requirements: data.attunement_requirements || "",
        // Weapon
        damage: data.damage || "",
        damage_type: data.damage_type || "none",
        weapon_category: data.weapon_category || "simple",
        weapon_type: data.weapon_type || "melee",
        weapon_properties: data.weapon_properties || [],
        range_normal: data.range_normal ? String(data.range_normal) : "",
        range_long: data.range_long ? String(data.range_long) : "",
        versatile_damage: data.versatile_damage || "",
        // Armor
        armor_category: data.armor_category || "light",
        armor_base_type: data.armor_base_type || "leather",
        base_ac: data.base_ac || 11,
        ac_bonus: data.ac_bonus ? String(data.ac_bonus) : "",
        max_dex_bonus: data.max_dex_bonus || "full",
        stealth_disadvantage: data.stealth_disadvantage || false,
        strength_requirement: data.strength_requirement ? String(data.strength_requirement) : "",
        // Consumable
        consumable_effect_type: data.consumable_effect_type || "utility",
        consumable_effect_value: data.consumable_effect_value || "",
        consumable_duration: data.consumable_duration || "instant",
        consumable_save_dc: data.consumable_save_dc ? String(data.consumable_save_dc) : "",
        consumable_save_type: data.consumable_save_type || "none",
        consumable_damage: data.consumable_damage || "",
        consumable_damage_type: data.consumable_damage_type || "none",
        consumable_healing: data.consumable_healing || "",
        consumable_uses: data.consumable_uses ? String(data.consumable_uses) : "1",
        consumable_area: data.consumable_area || "",
        potion_color: data.potion_color || "blue",
        scroll_spell_level: data.scroll_spell_level ? String(data.scroll_spell_level) : "0",
        scroll_spell_name: data.scroll_spell_name || "",
        ammunition_quantity: data.ammunition_quantity ? String(data.ammunition_quantity) : "20",
        // Common
        weight: data.weight ? String(data.weight) : "",
        charges: data.charges ? String(data.charges) : "",
        recharge: data.recharge || "",
      });
    } else {
      setForm(defaultFormState);
    }
  }, [editingItem, open]);

  // Update icon based on type
  useEffect(() => {
    if (!isEditing) {
      const typeInfo = allItemTypes.find(t => t.value === form.type);
      if (typeInfo) {
        setForm(prev => ({ ...prev, icon: typeInfo.icon }));
      }
    }
  }, [form.type, isEditing]);

  // Update base AC when armor type changes
  useEffect(() => {
    if (form.type === 'armor' && form.armor_category) {
      const armorTypes = armorBaseTypes[form.armor_category as keyof typeof armorBaseTypes] || [];
      const selectedArmor = armorTypes.find(a => a.value === form.armor_base_type);
      if (selectedArmor) {
        setForm(prev => ({ ...prev, base_ac: selectedArmor.baseAC }));
      }
    }
  }, [form.armor_base_type, form.armor_category, form.type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData: HomebrewItemData & Record<string, any> = {
      rarity: form.rarity as HomebrewItemData['rarity'],
      type: form.type as HomebrewItemData['type'],
      requires_attunement: form.requires_attunement,
      attunement_requirements: form.attunement_requirements || undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      charges: form.charges ? parseInt(form.charges) : undefined,
      recharge: form.recharge || undefined,
    };

    // Add weapon-specific data
    if (form.type === 'weapon') {
      itemData.damage = form.damage || undefined;
      itemData.damage_type = form.damage_type !== "none" ? form.damage_type : undefined;
      itemData.weapon_category = form.weapon_category;
      itemData.weapon_type = form.weapon_type;
      itemData.weapon_properties = form.weapon_properties.length > 0 ? form.weapon_properties : undefined;
      if (form.weapon_type === 'ranged' || form.weapon_properties.includes('thrown')) {
        itemData.range_normal = form.range_normal ? parseInt(form.range_normal) : undefined;
        itemData.range_long = form.range_long ? parseInt(form.range_long) : undefined;
      }
      if (form.weapon_properties.includes('versatile')) {
        itemData.versatile_damage = form.versatile_damage || undefined;
      }
    }

    // Add armor-specific data
    if (form.type === 'armor') {
      itemData.armor_category = form.armor_category;
      itemData.armor_base_type = form.armor_base_type;
      itemData.base_ac = form.base_ac;
      itemData.ac_bonus = form.ac_bonus ? parseInt(form.ac_bonus) : undefined;
      itemData.max_dex_bonus = form.max_dex_bonus;
      itemData.stealth_disadvantage = form.stealth_disadvantage;
      itemData.strength_requirement = form.strength_requirement ? parseInt(form.strength_requirement) : undefined;
    }

    // Add consumable-specific data
    if (isConsumableType(form.type)) {
      itemData.is_consumable = true;
      itemData.consumable_effect_type = form.consumable_effect_type;
      itemData.consumable_effect_value = form.consumable_effect_value || undefined;
      itemData.consumable_duration = form.consumable_duration;
      itemData.consumable_uses = form.consumable_uses ? parseInt(form.consumable_uses) : 1;
      
      if (form.consumable_save_type !== 'none') {
        itemData.consumable_save_type = form.consumable_save_type;
        itemData.consumable_save_dc = form.consumable_save_dc ? parseInt(form.consumable_save_dc) : undefined;
      }
      
      if (form.consumable_effect_type === 'damage' || form.type === 'bomb' || form.type === 'poison') {
        itemData.consumable_damage = form.consumable_damage || undefined;
        itemData.consumable_damage_type = form.consumable_damage_type !== 'none' ? form.consumable_damage_type : undefined;
        itemData.consumable_area = form.consumable_area || undefined;
      }
      
      if (form.consumable_effect_type === 'healing' || form.consumable_effect_type === 'restoration') {
        itemData.consumable_healing = form.consumable_healing || undefined;
      }
      
      if (form.type === 'potion') {
        itemData.potion_color = form.potion_color;
      }
      
      if (form.type === 'scroll') {
        itemData.scroll_spell_level = form.scroll_spell_level ? parseInt(form.scroll_spell_level) : 0;
        itemData.scroll_spell_name = form.scroll_spell_name || undefined;
      }
      
      if (form.type === 'ammunition') {
        itemData.ammunition_quantity = form.ammunition_quantity ? parseInt(form.ammunition_quantity) : 20;
      }
    }

    if (isEditing && editingItem) {
      updateHomebrew({
        id: editingItem.id,
        input: {
          name: form.name,
          description: form.description,
          icon: form.icon,
          data: itemData,
        },
      });
    } else {
      createHomebrew({
        type: 'item',
        name: form.name,
        description: form.description,
        icon: form.icon,
        data: itemData,
      });
    }
    
    onOpenChange(false);
  };

  const updateField = (field: string, value: string | boolean | number | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleWeaponProperty = (property: string) => {
    setForm(prev => ({
      ...prev,
      weapon_properties: prev.weapon_properties.includes(property)
        ? prev.weapon_properties.filter(p => p !== property)
        : [...prev.weapon_properties, property]
    }));
  };

  const isLoading = isCreating || isUpdating;
  const isWeapon = form.type === 'weapon';
  const isArmor = form.type === 'armor';
  const isConsumable = isConsumableType(form.type);

  const currentArmorTypes = isArmor 
    ? armorBaseTypes[form.armor_category as keyof typeof armorBaseTypes] || []
    : [];

  // Calculate displayed AC for armor
  const getArmorACDisplay = () => {
    if (!isArmor) return "";
    const bonus = form.ac_bonus ? parseInt(form.ac_bonus) : 0;
    const baseAC = form.base_ac + bonus;
    
    if (form.armor_category === 'shield') {
      return `+${baseAC} CA`;
    }
    
    switch (form.max_dex_bonus) {
      case 'none':
        return `CA ${baseAC}`;
      case 'max2':
        return `CA ${baseAC} + Des (máx 2)`;
      case 'full':
        return `CA ${baseAC} + Des`;
      default:
        return `CA ${baseAC}`;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Gem className="w-5 h-5 text-amber-500" />
            {isEditing ? "Editar Item" : "Criar Item"}
            {isConsumable && <Badge variant="secondary" className="text-xs">Consumível</Badge>}
          </SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Edite os detalhes do seu item homebrew"
              : "Preencha os detalhes do seu item homebrew"
            }
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-[auto_1fr] gap-3">
              <div>
                <Label>Ícone</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => updateField("icon", e.target.value)}
                  className="w-16 text-center text-xl"
                  maxLength={2}
                />
              </div>
              <div>
                <Label>Nome do Item *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Ex: Espada do Crepúsculo"
                  required
                />
              </div>
            </div>

            {/* Type Selection - Categorized */}
            <div>
              <Label>Tipo de Item *</Label>
              <div className="mt-2 space-y-3">
                {itemCategories.map((category) => (
                  <div key={category.label}>
                    <p className="text-xs text-muted-foreground mb-2">{category.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {category.items.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => updateField("type", type.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                            form.type === type.value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rarity */}
            <div>
              <Label>Raridade *</Label>
              <Select value={form.rarity} onValueChange={(v) => updateField("rarity", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemRarities.map((rarity) => (
                    <SelectItem key={rarity.value} value={rarity.value}>
                      {rarity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Attunement (only for non-consumables) */}
            {!isConsumable && (
              <>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <Label>Requer Sintonização</Label>
                    <p className="text-xs text-muted-foreground">
                      O item precisa de sintonização para funcionar
                    </p>
                  </div>
                  <Switch
                    checked={form.requires_attunement}
                    onCheckedChange={(v) => updateField("requires_attunement", v)}
                  />
                </div>

                {form.requires_attunement && (
                  <div>
                    <Label>Requisitos de Sintonização (opcional)</Label>
                    <Input
                      value={form.attunement_requirements}
                      onChange={(e) => updateField("attunement_requirements", e.target.value)}
                      placeholder="Ex: por um conjurador"
                    />
                  </div>
                )}
              </>
            )}

            {/* =================== CONSUMABLE SECTION =================== */}
            {isConsumable && (
              <div className="pt-2 border-t border-border space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  🧪 Propriedades do Consumível
                </h4>

                {/* Effect Type */}
                <div>
                  <Label>Tipo de Efeito</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {consumableEffectTypes.map((effect) => (
                      <button
                        key={effect.value}
                        type="button"
                        onClick={() => updateField("consumable_effect_type", effect.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                          form.consumable_effect_type === effect.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <span>{effect.icon}</span>
                        <span>{effect.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Healing (for healing/restoration effects) */}
                {(form.consumable_effect_type === 'healing' || form.consumable_effect_type === 'restoration') && (
                  <div>
                    <Label>Cura</Label>
                    <Input
                      value={form.consumable_healing}
                      onChange={(e) => updateField("consumable_healing", e.target.value)}
                      placeholder="Ex: 2d4+2 ou 'remove 1 condição'"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Pode ser dados (2d4+2) ou texto descritivo
                    </p>
                  </div>
                )}

                {/* Damage (for damage effects, bombs, poisons) */}
                {(form.consumable_effect_type === 'damage' || form.type === 'bomb' || form.type === 'poison') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Dano</Label>
                      <Input
                        value={form.consumable_damage}
                        onChange={(e) => updateField("consumable_damage", e.target.value)}
                        placeholder="Ex: 3d6"
                      />
                    </div>
                    <div>
                      <Label>Tipo de Dano</Label>
                      <Select value={form.consumable_damage_type} onValueChange={(v) => updateField("consumable_damage_type", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {damageTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Area of Effect (for bombs, some potions) */}
                {(form.type === 'bomb' || form.consumable_effect_type === 'damage') && (
                  <div>
                    <Label>Área de Efeito</Label>
                    <Input
                      value={form.consumable_area}
                      onChange={(e) => updateField("consumable_area", e.target.value)}
                      placeholder="Ex: esfera de 6m de raio"
                    />
                  </div>
                )}

                {/* Effect Value (for buffs and utility) */}
                {(form.consumable_effect_type === 'buff' || form.consumable_effect_type === 'utility' || 
                  form.consumable_effect_type === 'protection' || form.consumable_effect_type === 'movement' ||
                  form.consumable_effect_type === 'detection' || form.consumable_effect_type === 'transformation') && (
                  <div>
                    <Label>Efeito</Label>
                    <Textarea
                      value={form.consumable_effect_value}
                      onChange={(e) => updateField("consumable_effect_value", e.target.value)}
                      placeholder="Ex: +2 em testes de Força por 1 hora"
                      rows={2}
                    />
                  </div>
                )}

                {/* Duration */}
                <div>
                  <Label>Duração</Label>
                  <Select value={form.consumable_duration} onValueChange={(v) => updateField("consumable_duration", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {consumableDurations.map((dur) => (
                        <SelectItem key={dur.value} value={dur.value}>
                          {dur.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Save DC & Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Teste de Resistência</Label>
                    <Select value={form.consumable_save_type} onValueChange={(v) => updateField("consumable_save_type", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {saveTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.consumable_save_type !== 'none' && (
                    <div>
                      <Label>CD do Teste</Label>
                      <Input
                        type="number"
                        value={form.consumable_save_dc}
                        onChange={(e) => updateField("consumable_save_dc", e.target.value)}
                        placeholder="15"
                        min="1"
                        max="30"
                      />
                    </div>
                  )}
                </div>

                {/* Uses */}
                <div>
                  <Label>Usos</Label>
                  <Input
                    type="number"
                    value={form.consumable_uses}
                    onChange={(e) => updateField("consumable_uses", e.target.value)}
                    placeholder="1"
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Quantas vezes pode ser usado antes de ser consumido
                  </p>
                </div>

                {/* Potion-specific: Color */}
                {form.type === 'potion' && (
                  <div>
                    <Label>Cor da Poção</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {potionColors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => updateField("potion_color", color.value)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                            form.potion_color === color.value
                              ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                              : ''
                          }`}
                          style={{
                            background: color.hex.startsWith('linear') ? color.hex : undefined,
                            backgroundColor: !color.hex.startsWith('linear') ? color.hex : undefined,
                            color: ['black', 'blue', 'purple'].includes(color.value) ? 'white' : 'black'
                          }}
                        >
                          {color.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scroll-specific: Spell */}
                {form.type === 'scroll' && (
                  <div className="grid grid-cols-[1fr_2fr] gap-3">
                    <div>
                      <Label>Nível da Magia</Label>
                      <Select value={form.scroll_spell_level} onValueChange={(v) => updateField("scroll_spell_level", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Truque</SelectItem>
                          <SelectItem value="1">1º Nível</SelectItem>
                          <SelectItem value="2">2º Nível</SelectItem>
                          <SelectItem value="3">3º Nível</SelectItem>
                          <SelectItem value="4">4º Nível</SelectItem>
                          <SelectItem value="5">5º Nível</SelectItem>
                          <SelectItem value="6">6º Nível</SelectItem>
                          <SelectItem value="7">7º Nível</SelectItem>
                          <SelectItem value="8">8º Nível</SelectItem>
                          <SelectItem value="9">9º Nível</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nome da Magia</Label>
                      <Input
                        value={form.scroll_spell_name}
                        onChange={(e) => updateField("scroll_spell_name", e.target.value)}
                        placeholder="Ex: Bola de Fogo"
                      />
                    </div>
                  </div>
                )}

                {/* Ammunition-specific: Quantity */}
                {form.type === 'ammunition' && (
                  <div>
                    <Label>Quantidade por Unidade</Label>
                    <Input
                      type="number"
                      value={form.ammunition_quantity}
                      onChange={(e) => updateField("ammunition_quantity", e.target.value)}
                      placeholder="20"
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Quantas peças de munição vêm no pacote
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* =================== WEAPON SECTION =================== */}
            {isWeapon && (
              <div className="pt-2 border-t border-border space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  ⚔️ Propriedades de Arma
                </h4>
                
                {/* Weapon Category & Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={form.weapon_category} onValueChange={(v) => updateField("weapon_category", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {weaponCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.weapon_category === 'simple' ? 'Maioria das pessoas sabe usar' : 'Requer treinamento'}
                    </p>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.weapon_type} onValueChange={(v) => updateField("weapon_type", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {weaponTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Damage */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Dano</Label>
                    <Input
                      value={form.damage}
                      onChange={(e) => updateField("damage", e.target.value)}
                      placeholder="Ex: 2d6"
                    />
                  </div>
                  <div>
                    <Label>Tipo de Dano</Label>
                    <Select value={form.damage_type} onValueChange={(v) => updateField("damage_type", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {damageTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Range (for ranged or thrown) */}
                {(form.weapon_type === 'ranged' || form.weapon_properties.includes('thrown')) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Alcance Normal (m)</Label>
                      <Input
                        type="number"
                        value={form.range_normal}
                        onChange={(e) => updateField("range_normal", e.target.value)}
                        placeholder="6"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Alcance Máximo (m)</Label>
                      <Input
                        type="number"
                        value={form.range_long}
                        onChange={(e) => updateField("range_long", e.target.value)}
                        placeholder="18"
                        min="0"
                      />
                    </div>
                  </div>
                )}

                {/* Versatile Damage */}
                {form.weapon_properties.includes('versatile') && (
                  <div>
                    <Label>Dano Versátil (duas mãos)</Label>
                    <Input
                      value={form.versatile_damage}
                      onChange={(e) => updateField("versatile_damage", e.target.value)}
                      placeholder="Ex: 2d8"
                    />
                  </div>
                )}

                {/* Weapon Properties */}
                <div>
                  <Label className="mb-2 block">Propriedades da Arma</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {weaponProperties.map((prop) => (
                      <label
                        key={prop.value}
                        className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                          form.weapon_properties.includes(prop.value) 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Checkbox
                          checked={form.weapon_properties.includes(prop.value)}
                          onCheckedChange={() => toggleWeaponProperty(prop.value)}
                          className="mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium">{prop.label}</span>
                          <p className="text-xs text-muted-foreground">{prop.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* =================== ARMOR SECTION =================== */}
            {isArmor && (
              <div className="pt-2 border-t border-border space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  🛡️ Propriedades de Armadura
                </h4>

                {/* Armor Category */}
                <div>
                  <Label>Categoria de Armadura</Label>
                  <Select 
                    value={form.armor_category} 
                    onValueChange={(v) => {
                      updateField("armor_category", v);
                      const types = armorBaseTypes[v as keyof typeof armorBaseTypes] || [];
                      if (types.length > 0) {
                        updateField("armor_base_type", types[0].value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {armorCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.armor_category === 'light' && 'Proficiência: Armaduras Leves'}
                    {form.armor_category === 'medium' && 'Proficiência: Armaduras Médias'}
                    {form.armor_category === 'heavy' && 'Proficiência: Armaduras Pesadas'}
                    {form.armor_category === 'shield' && 'Proficiência: Escudos'}
                  </p>
                </div>

                {/* Armor Base Type */}
                <div>
                  <Label>Tipo Base</Label>
                  <Select value={form.armor_base_type} onValueChange={(v) => updateField("armor_base_type", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentArmorTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} (CA base {type.baseAC})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* AC Display & Bonus */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Classe de Armadura</Label>
                      <p className="text-lg font-bold text-primary">{getArmorACDisplay()}</p>
                    </div>
                    <div className="w-24">
                      <Label>Bônus Mágico</Label>
                      <Input
                        type="number"
                        value={form.ac_bonus}
                        onChange={(e) => updateField("ac_bonus", e.target.value)}
                        placeholder="+0"
                        min="0"
                        max="5"
                      />
                    </div>
                  </div>
                </div>

                {/* Dex Bonus (for non-shields) */}
                {form.armor_category !== 'shield' && (
                  <div>
                    <Label>Bônus de Destreza</Label>
                    <Select value={form.max_dex_bonus} onValueChange={(v) => updateField("max_dex_bonus", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Completo (armadura leve)</SelectItem>
                        <SelectItem value="max2">Máximo +2 (armadura média)</SelectItem>
                        <SelectItem value="none">Nenhum (armadura pesada)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Strength Requirement (for heavy armor) */}
                {form.armor_category === 'heavy' && (
                  <div>
                    <Label>Requisito de Força</Label>
                    <Input
                      type="number"
                      value={form.strength_requirement}
                      onChange={(e) => updateField("strength_requirement", e.target.value)}
                      placeholder="13"
                      min="0"
                      max="20"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Velocidade reduzida em 3m se não atender o requisito
                    </p>
                  </div>
                )}

                {/* Stealth Disadvantage */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <Label>Desvantagem em Furtividade</Label>
                    <p className="text-xs text-muted-foreground">
                      O usuário tem desvantagem em testes de Furtividade
                    </p>
                  </div>
                  <Switch
                    checked={form.stealth_disadvantage}
                    onCheckedChange={(v) => updateField("stealth_disadvantage", v)}
                  />
                </div>
              </div>
            )}

            {/* =================== CHARGES SECTION (for non-consumables) =================== */}
            {!isConsumable && (
              <div className="pt-2 border-t border-border">
                <h4 className="text-sm font-medium mb-3">Cargas (opcional)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Número de Cargas</Label>
                    <Input
                      type="number"
                      value={form.charges}
                      onChange={(e) => updateField("charges", e.target.value)}
                      placeholder="3"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Recarga</Label>
                    <Input
                      value={form.recharge}
                      onChange={(e) => updateField("recharge", e.target.value)}
                      placeholder="1d4 ao amanhecer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Weight */}
            <div>
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                value={form.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                placeholder="1.5"
                min="0"
                step="0.1"
              />
            </div>

            {/* Description */}
            <div>
              <Label>Descrição *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder={isConsumable 
                  ? "Descreva o efeito, aparência e como usar o consumível..."
                  : "Descreva as propriedades mágicas e a história do item..."
                }
                rows={4}
                required
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-700"
              disabled={isLoading || !form.name || !form.description}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? "Salvando..." : "Criando..."}
                </>
              ) : (
                <>
                  <Gem className="w-4 h-4 mr-2" />
                  {isEditing ? "Salvar Alterações" : "Criar Item"}
                </>
              )}
            </Button>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}