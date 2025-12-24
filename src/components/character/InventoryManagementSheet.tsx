import { useState, useMemo } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Swords, 
  Shield, 
  Package, 
  Plus, 
  Search,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Coins
} from "lucide-react";
import { toast } from "sonner";
import { useUpdateCharacter } from "@/hooks/useCharacters";
import { getModifier } from "@/data/srd";

// Import equipment data
import weaponsData from "@/data/equipment/armas.json";
import armorsData from "@/data/equipment/armaduras.json";

interface InventoryManagementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: any;
}

interface EquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'shield' | 'item';
  equipped: boolean;
  quantity?: number;
  // Weapon properties
  damage?: string;
  damageType?: string;
  properties?: string[];
  range?: { normal: number; max: number };
  thrown?: { range_normal: number; range_max: number };
  versatileDamage?: string;
  // Armor properties
  armorClass?: number;
  armorCategory?: 'light' | 'medium' | 'heavy' | 'shield';
  maxDexBonus?: number | null;
  strengthRequirement?: number | null;
  stealthDisadvantage?: boolean;
  // General
  weight?: number;
  cost?: { value: number; currency: string };
  description?: string;
  isCustom?: boolean;
}

const PROPERTY_LABELS: Record<string, string> = {
  finesse: "Acuidade",
  light: "Leve",
  heavy: "Pesada",
  thrown: "Arremesso",
  two_handed: "Duas Mãos",
  versatile: "Versátil",
  ammunition: "Munição",
  loading: "Recarga",
  reach: "Alcance",
  special: "Especial",
};

const DAMAGE_TYPE_LABELS: Record<string, string> = {
  slashing: "Cortante",
  piercing: "Perfurante",
  bludgeoning: "Concussão",
};

export function InventoryManagementSheet({ open, onOpenChange, character }: InventoryManagementSheetProps) {
  const updateCharacter = useUpdateCharacter();
  const [activeTab, setActiveTab] = useState("weapons");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  
  // Custom item form state
  const [customItem, setCustomItem] = useState({
    name: "",
    type: "item" as 'weapon' | 'armor' | 'shield' | 'item',
    damage: "",
    damageType: "slashing",
    armorClass: "",
    armorCategory: "light" as 'light' | 'medium' | 'heavy' | 'shield',
    weight: "",
    quantity: "1",
  });

  const equipment = (character.equipment || []) as EquipmentItem[];
  const attributes = character.attributes as Record<string, number>;
  const dexMod = getModifier(attributes?.dexterity || 10);
  const strMod = getModifier(attributes?.strength || 10);
  const proficiencies = character.proficiencies as any;

  // Get armor proficiencies
  const armorProficiencies = useMemo(() => {
    if (!proficiencies) return [];
    if (Array.isArray(proficiencies)) return proficiencies;
    return proficiencies.armor || [];
  }, [proficiencies]);

  // Check armor proficiency
  const hasArmorProficiency = (category: string) => {
    const profMap: Record<string, string[]> = {
      light: ["light_armor", "armadura leve", "armaduras leves"],
      medium: ["medium_armor", "armadura média", "armaduras médias"],
      heavy: ["heavy_armor", "armadura pesada", "armaduras pesadas"],
      shield: ["shield", "escudo", "escudos"],
    };
    const validProfs = profMap[category] || [];
    return armorProficiencies.some((p: string) => 
      validProfs.some(v => p.toLowerCase().includes(v.toLowerCase()))
    );
  };

  // Filter SRD weapons
  const filteredWeapons = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return weaponsData.items.filter(w => 
      w.name.toLowerCase().includes(query) || 
      w.name_en.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Filter SRD armors
  const filteredArmors = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return armorsData.items.filter(a => 
      a.name.toLowerCase().includes(query) || 
      a.name_en.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Add SRD weapon to inventory
  const addWeapon = async (weapon: typeof weaponsData.items[0]) => {
    const newItem: EquipmentItem = {
      id: `${weapon.id}_${Date.now()}`,
      name: weapon.name,
      type: 'weapon',
      equipped: false,
      damage: weapon.damage.dice,
      damageType: weapon.damage.type,
      properties: weapon.properties,
      weight: weapon.weight,
      cost: weapon.cost,
      range: weapon.range,
      thrown: weapon.thrown,
      versatileDamage: weapon.versatile?.dice,
    };

    const newEquipment = [...equipment, newItem];
    await updateCharacter.mutateAsync({
      id: character.id,
      equipment: newEquipment,
    });
    toast.success(`${weapon.name} adicionada ao inventário`);
  };

  // Add SRD armor to inventory
  const addArmor = async (armor: typeof armorsData.items[0]) => {
    const isShield = armor.category === 'shield';
    const newItem: EquipmentItem = {
      id: `${armor.id}_${Date.now()}`,
      name: armor.name,
      type: isShield ? 'shield' : 'armor',
      equipped: false,
      armorClass: isShield ? (armor.armor_class as any).bonus : armor.armor_class.base,
      armorCategory: armor.category as any,
      maxDexBonus: armor.armor_class.max_dex_bonus,
      strengthRequirement: armor.strength_requirement,
      stealthDisadvantage: armor.stealth_disadvantage,
      weight: armor.weight,
      cost: armor.cost,
    };

    const newEquipment = [...equipment, newItem];
    await updateCharacter.mutateAsync({
      id: character.id,
      equipment: newEquipment,
    });
    toast.success(`${armor.name} adicionada ao inventário`);
  };

  // Add custom item
  const addCustomItem = async () => {
    if (!customItem.name.trim()) {
      toast.error("Nome do item é obrigatório");
      return;
    }

    const newItem: EquipmentItem = {
      id: `custom_${Date.now()}`,
      name: customItem.name,
      type: customItem.type,
      equipped: false,
      quantity: parseInt(customItem.quantity) || 1,
      isCustom: true,
      weight: customItem.weight ? parseFloat(customItem.weight) : undefined,
    };

    if (customItem.type === 'weapon' && customItem.damage) {
      newItem.damage = customItem.damage;
      newItem.damageType = customItem.damageType;
    }

    if ((customItem.type === 'armor' || customItem.type === 'shield') && customItem.armorClass) {
      newItem.armorClass = parseInt(customItem.armorClass);
      newItem.armorCategory = customItem.armorCategory;
    }

    const newEquipment = [...equipment, newItem];
    await updateCharacter.mutateAsync({
      id: character.id,
      equipment: newEquipment,
    });
    
    toast.success(`${customItem.name} adicionado ao inventário`);
    setCustomItem({
      name: "",
      type: "item",
      damage: "",
      damageType: "slashing",
      armorClass: "",
      armorCategory: "light",
      weight: "",
      quantity: "1",
    });
    setShowCustomForm(false);
  };

  // Remove item from inventory
  const removeItem = async (itemId: string) => {
    const item = equipment.find(e => e.id === itemId);
    const newEquipment = equipment.filter(e => e.id !== itemId);
    
    // Recalculate AC if removing equipped armor
    let updates: any = { equipment: newEquipment };
    if (item?.equipped && (item.type === 'armor' || item.type === 'shield')) {
      const newAC = calculateNewAC(newEquipment);
      updates.armor_class = newAC;
    }

    await updateCharacter.mutateAsync({
      id: character.id,
      ...updates,
    });
    toast.success("Item removido do inventário");
  };

  // Toggle equip/unequip
  const toggleEquip = async (itemId: string) => {
    const itemIndex = equipment.findIndex(e => e.id === itemId);
    if (itemIndex < 0) return;

    const item = equipment[itemIndex];
    const newEquipped = !item.equipped;
    const newEquipment = [...equipment];

    // If equipping armor, unequip other armor of same type
    if (newEquipped && (item.type === 'armor' || item.type === 'shield')) {
      newEquipment.forEach((e, i) => {
        if (i !== itemIndex && e.type === item.type && e.equipped) {
          newEquipment[i] = { ...e, equipped: false };
        }
      });
    }

    newEquipment[itemIndex] = { ...item, equipped: newEquipped };

    // Calculate new AC
    const newAC = calculateNewAC(newEquipment);

    await updateCharacter.mutateAsync({
      id: character.id,
      equipment: newEquipment,
      armor_class: newAC,
    });

    toast.success(newEquipped ? `${item.name} equipado` : `${item.name} desequipado`);
  };

  // Calculate AC based on equipped armor
  const calculateNewAC = (equipmentList: EquipmentItem[]) => {
    const equippedArmor = equipmentList.find(e => e.type === 'armor' && e.equipped);
    const equippedShield = equipmentList.find(e => e.type === 'shield' && e.equipped);

    let baseAC = 10 + dexMod; // Default: no armor

    if (equippedArmor) {
      const armorAC = equippedArmor.armorClass || 10;
      
      if (equippedArmor.armorCategory === 'heavy') {
        // Heavy armor: no DEX bonus
        baseAC = armorAC;
      } else if (equippedArmor.armorCategory === 'medium') {
        // Medium armor: DEX bonus max +2
        const dexBonus = equippedArmor.maxDexBonus !== null && equippedArmor.maxDexBonus !== undefined 
          ? Math.min(dexMod, equippedArmor.maxDexBonus) 
          : Math.min(dexMod, 2);
        baseAC = armorAC + dexBonus;
      } else {
        // Light armor: full DEX bonus
        baseAC = armorAC + dexMod;
      }
    }

    // Add shield bonus
    if (equippedShield) {
      baseAC += equippedShield.armorClass || 2;
    }

    return baseAC;
  };

  // Calculate weapon damage with modifier
  const getWeaponDamageDisplay = (weapon: EquipmentItem) => {
    const hasFinesse = weapon.properties?.includes('finesse');
    const isRanged = weapon.properties?.includes('ammunition') || 
                     (weapon.range && !weapon.properties?.includes('thrown'));
    
    // Use DEX for ranged and finesse (if DEX > STR)
    let mod = strMod;
    if (isRanged) {
      mod = dexMod;
    } else if (hasFinesse) {
      mod = Math.max(strMod, dexMod);
    }

    const modSign = mod >= 0 ? '+' : '';
    return `${weapon.damage} ${modSign}${mod}`;
  };

  // Get damage type label
  const getDamageTypeLabel = (type: string) => {
    return DAMAGE_TYPE_LABELS[type] || type;
  };

  // Check if character meets strength requirement
  const meetsStrengthRequirement = (item: EquipmentItem) => {
    if (!item.strengthRequirement) return true;
    return (attributes?.strength || 10) >= item.strengthRequirement;
  };

  // Currency management
  const currency = character.currency as any || { gold: 0, silver: 0, copper: 0, electrum: 0, platinum: 0 };

  const updateCurrency = async (type: string, delta: number) => {
    const newCurrency = { ...currency };
    newCurrency[type] = Math.max(0, (newCurrency[type] || 0) + delta);
    await updateCharacter.mutateAsync({
      id: character.id,
      currency: newCurrency,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Gerenciar Inventário
          </SheetTitle>
          <SheetDescription>
            Adicione, remova e equipe itens do seu personagem
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="weapons" className="flex items-center gap-1">
              <Swords className="w-4 h-4" />
              <span className="hidden sm:inline">Armas</span>
            </TabsTrigger>
            <TabsTrigger value="armor" className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Armaduras</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Inventário</span>
            </TabsTrigger>
            <TabsTrigger value="currency" className="flex items-center gap-1">
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Moedas</span>
            </TabsTrigger>
          </TabsList>

          {/* Weapons Tab */}
          <TabsContent value="weapons" className="mt-4">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar armas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Current weapons */}
              {equipment.filter(e => e.type === 'weapon').length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary">Suas Armas</h4>
                  {equipment.filter(e => e.type === 'weapon').map(item => (
                    <div 
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        item.equipped 
                          ? 'bg-primary/20 border border-primary/40' 
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {item.isCustom && (
                            <Badge variant="outline" className="text-[10px]">Custom</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-primary font-mono">
                            {getWeaponDamageDisplay(item)} {getDamageTypeLabel(item.damageType || '')}
                          </span>
                          {item.properties?.map(prop => (
                            <Badge key={prop} variant="secondary" className="text-[10px]">
                              {PROPERTY_LABELS[prop] || prop}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleEquip(item.id)}
                          className="w-8 h-8"
                        >
                          {item.equipped ? (
                            <Eye className="w-4 h-4 text-primary" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="w-8 h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SRD Weapons List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Adicionar do SRD</h4>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1">
                    {filteredWeapons.map(weapon => (
                      <div 
                        key={weapon.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{weapon.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-primary">{weapon.damage.dice}</span>
                            <span className="text-xs text-muted-foreground">
                              {getDamageTypeLabel(weapon.damage.type)}
                            </span>
                            {weapon.properties.slice(0, 2).map(prop => (
                              <Badge key={prop} variant="outline" className="text-[9px] px-1 py-0">
                                {PROPERTY_LABELS[prop] || prop}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => addWeapon(weapon)}
                          className="w-8 h-8"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Armor Tab */}
          <TabsContent value="armor" className="mt-4">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar armaduras..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Current armor */}
              {equipment.filter(e => e.type === 'armor' || e.type === 'shield').length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary">Suas Armaduras</h4>
                  {equipment.filter(e => e.type === 'armor' || e.type === 'shield').map(item => {
                    const meetsStr = meetsStrengthRequirement(item);
                    const hasProficiency = item.armorCategory ? hasArmorProficiency(item.armorCategory) : true;
                    
                    return (
                      <div 
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                          item.equipped 
                            ? 'bg-cyan-500/20 border border-cyan-500/40' 
                            : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            {!hasProficiency && item.equipped && (
                              <Badge variant="destructive" className="text-[10px]">
                                Sem Proficiência
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-cyan-400 font-mono">
                              {item.type === 'shield' ? `+${item.armorClass}` : `CA ${item.armorClass}`}
                              {item.armorCategory === 'light' && ' + DES'}
                              {item.armorCategory === 'medium' && ' + DES (máx 2)'}
                            </span>
                            {item.stealthDisadvantage && (
                              <Badge variant="secondary" className="text-[10px] bg-orange-500/20 text-orange-400">
                                Furtividade -
                              </Badge>
                            )}
                            {item.strengthRequirement && (
                              <Badge 
                                variant="secondary" 
                                className={`text-[10px] ${!meetsStr ? 'bg-red-500/20 text-red-400' : ''}`}
                              >
                                FOR {item.strengthRequirement}
                                {!meetsStr && <AlertTriangle className="w-3 h-3 ml-1" />}
                              </Badge>
                            )}
                          </div>
                          {!meetsStr && item.equipped && (
                            <p className="text-[10px] text-red-400 mt-1">
                              Deslocamento -3m (FOR insuficiente)
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleEquip(item.id)}
                            className="w-8 h-8"
                          >
                            {item.equipped ? (
                              <Eye className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SRD Armors List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Adicionar do SRD</h4>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1">
                    {filteredArmors.map(armor => {
                      const isShield = armor.category === 'shield';
                      const acDisplay = isShield 
                        ? `+${(armor.armor_class as any).bonus}`
                        : `CA ${armor.armor_class.base}`;
                      
                      return (
                        <div 
                          key={armor.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{armor.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-cyan-400">{acDisplay}</span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0">
                                {armor.category === 'light' ? 'Leve' :
                                 armor.category === 'medium' ? 'Média' :
                                 armor.category === 'heavy' ? 'Pesada' : 'Escudo'}
                              </Badge>
                              {armor.stealth_disadvantage && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 text-orange-400">
                                  Furt. -
                                </Badge>
                              )}
                              {armor.strength_requirement && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0">
                                  FOR {armor.strength_requirement}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => addArmor(armor)}
                            className="w-8 h-8"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="mt-4">
            <div className="space-y-4">
              {/* Add Custom Item Form */}
              {showCustomForm ? (
                <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                  <h4 className="text-sm font-semibold">Adicionar Item Personalizado</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>Nome</Label>
                      <Input
                        value={customItem.name}
                        onChange={(e) => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome do item"
                      />
                    </div>
                    
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={customItem.type}
                        onValueChange={(v: any) => setCustomItem(prev => ({ ...prev, type: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="item">Item</SelectItem>
                          <SelectItem value="weapon">Arma</SelectItem>
                          <SelectItem value="armor">Armadura</SelectItem>
                          <SelectItem value="shield">Escudo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        value={customItem.quantity}
                        onChange={(e) => setCustomItem(prev => ({ ...prev, quantity: e.target.value }))}
                        min="1"
                      />
                    </div>

                    {customItem.type === 'weapon' && (
                      <>
                        <div>
                          <Label>Dano</Label>
                          <Input
                            value={customItem.damage}
                            onChange={(e) => setCustomItem(prev => ({ ...prev, damage: e.target.value }))}
                            placeholder="Ex: 1d8"
                          />
                        </div>
                        <div>
                          <Label>Tipo de Dano</Label>
                          <Select
                            value={customItem.damageType}
                            onValueChange={(v) => setCustomItem(prev => ({ ...prev, damageType: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="slashing">Cortante</SelectItem>
                              <SelectItem value="piercing">Perfurante</SelectItem>
                              <SelectItem value="bludgeoning">Concussão</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {(customItem.type === 'armor' || customItem.type === 'shield') && (
                      <>
                        <div>
                          <Label>CA</Label>
                          <Input
                            type="number"
                            value={customItem.armorClass}
                            onChange={(e) => setCustomItem(prev => ({ ...prev, armorClass: e.target.value }))}
                            placeholder="Ex: 14"
                          />
                        </div>
                        <div>
                          <Label>Categoria</Label>
                          <Select
                            value={customItem.armorCategory}
                            onValueChange={(v: any) => setCustomItem(prev => ({ ...prev, armorCategory: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Leve</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="heavy">Pesada</SelectItem>
                              <SelectItem value="shield">Escudo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <div>
                      <Label>Peso (kg)</Label>
                      <Input
                        type="number"
                        value={customItem.weight}
                        onChange={(e) => setCustomItem(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="Opcional"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={addCustomItem} className="flex-1">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                    <Button variant="outline" onClick={() => setShowCustomForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={() => setShowCustomForm(true)} 
                  variant="outline" 
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item Personalizado
                </Button>
              )}

              {/* All Inventory Items */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {equipment.filter(e => e.type === 'item').length > 0 ? (
                    equipment.filter(e => e.type === 'item').map(item => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                      >
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.quantity && item.quantity > 1 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              x{item.quantity}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="w-8 h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum item no inventário
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Currency Tab */}
          <TabsContent value="currency" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'platinum', label: 'Platina (PP)', color: 'text-gray-300' },
                { key: 'gold', label: 'Ouro (PO)', color: 'text-yellow-500' },
                { key: 'electrum', label: 'Electrum (PE)', color: 'text-blue-300' },
                { key: 'silver', label: 'Prata (PP)', color: 'text-gray-400' },
                { key: 'copper', label: 'Cobre (PC)', color: 'text-orange-600' },
              ].map(({ key, label, color }) => (
                <div key={key} className="p-4 bg-muted/30 rounded-xl">
                  <Label className={`text-sm ${color}`}>{label}</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => updateCurrency(key, -1)}
                      disabled={(currency[key] || 0) <= 0}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={currency[key] || 0}
                      onChange={(e) => {
                        const newVal = parseInt(e.target.value) || 0;
                        const delta = newVal - (currency[key] || 0);
                        updateCurrency(key, delta);
                      }}
                      className="text-center text-lg font-bold"
                      min="0"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => updateCurrency(key, 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-muted/30 rounded-xl">
              <p className="text-sm text-muted-foreground text-center">
                Total em ouro: <span className="font-bold text-yellow-500">
                  {(
                    (currency.platinum || 0) * 10 +
                    (currency.gold || 0) +
                    (currency.electrum || 0) * 0.5 +
                    (currency.silver || 0) * 0.1 +
                    (currency.copper || 0) * 0.01
                  ).toFixed(2)} PO
                </span>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
