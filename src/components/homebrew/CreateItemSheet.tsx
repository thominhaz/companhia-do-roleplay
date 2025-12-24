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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHomebrew } from "@/hooks/useHomebrew";
import { HomebrewContent, HomebrewItemData } from "@/types";

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

const defaultFormState = {
  name: "",
  description: "",
  icon: "💎",
  rarity: "uncommon",
  type: "wondrous",
  requires_attunement: false,
  attunement_requirements: "",
  damage: "",
  damage_type: "none",
  ac_bonus: "",
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
      const data = editingItem.data as HomebrewItemData;
      setForm({
        name: editingItem.name,
        description: editingItem.description || "",
        icon: editingItem.icon,
        rarity: data.rarity || "uncommon",
        type: data.type || "wondrous",
        requires_attunement: data.requires_attunement || false,
        attunement_requirements: data.attunement_requirements || "",
        damage: data.damage || "",
        damage_type: data.damage_type || "none",
        ac_bonus: data.ac_bonus ? String(data.ac_bonus) : "",
        charges: data.charges ? String(data.charges) : "",
        recharge: data.recharge || "",
      });
    } else {
      setForm(defaultFormState);
    }
  }, [editingItem, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData: HomebrewItemData = {
      rarity: form.rarity as HomebrewItemData['rarity'],
      type: form.type as HomebrewItemData['type'],
      requires_attunement: form.requires_attunement,
      attunement_requirements: form.attunement_requirements || undefined,
      damage: form.damage || undefined,
      damage_type: form.damage_type !== "none" ? form.damage_type : undefined,
      ac_bonus: form.ac_bonus ? parseInt(form.ac_bonus) : undefined,
      charges: form.charges ? parseInt(form.charges) : undefined,
      recharge: form.recharge || undefined,
    };

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

  const updateField = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = isCreating || isUpdating;
  const isWeapon = form.type === 'weapon';
  const isArmor = form.type === 'armor';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-8">
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

          {/* Weapon specific fields */}
          {isWeapon && (
            <div className="pt-2 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Propriedades de Arma</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Dano</Label>
                  <Input
                    value={form.damage}
                    onChange={(e) => updateField("damage", e.target.value)}
                    placeholder="2d6"
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
            </div>
          )}

          {/* Armor specific fields */}
          {isArmor && (
            <div className="pt-2 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Propriedades de Armadura</h4>
              <div>
                <Label>Bônus de CA</Label>
                <Input
                  type="number"
                  value={form.ac_bonus}
                  onChange={(e) => updateField("ac_bonus", e.target.value)}
                  placeholder="1"
                  min="0"
                  max="5"
                />
              </div>
            </div>
          )}

          {/* Charges */}
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
      </SheetContent>
    </Sheet>
  );
}
