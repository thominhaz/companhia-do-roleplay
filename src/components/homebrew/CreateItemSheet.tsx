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

const itemTypes = [
  { value: "weapon", label: "Arma" },
  { value: "armor", label: "Armadura" },
  { value: "wondrous", label: "Item Maravilhoso" },
  { value: "potion", label: "Poção" },
  { value: "scroll", label: "Pergaminho" },
  { value: "wand", label: "Varinha" },
  { value: "ring", label: "Anel" },
  { value: "other", label: "Outro" },
];

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
        // Common
        weight: data.weight ? String(data.weight) : "",
        charges: data.charges ? String(data.charges) : "",
        recharge: data.recharge || "",
      });
    } else {
      setForm(defaultFormState);
    }
  }, [editingItem, open]);

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
            {isEditing ? "Editar Item" : "Criar Item Mágico"}
          </SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Edite os detalhes do seu item homebrew"
              : "Preencha os detalhes do seu item mágico homebrew"
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

            {/* Type & Rarity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => updateField("type", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            {/* Attunement */}
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
                      // Reset armor base type when category changes
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

            {/* =================== CHARGES SECTION =================== */}
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
                placeholder="Descreva as propriedades mágicas e a história do item..."
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