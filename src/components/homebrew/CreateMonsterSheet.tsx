import { useState, useEffect } from "react";
import { Loader2, Skull, Plus, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHomebrew } from "@/hooks/useHomebrew";
import { HomebrewContent, HomebrewMonsterData, MonsterAction } from "@/types";

interface CreateMonsterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMonster?: HomebrewContent;
}

const sizeOptions = [
  { value: "Tiny", label: "Miúdo" },
  { value: "Small", label: "Pequeno" },
  { value: "Medium", label: "Médio" },
  { value: "Large", label: "Grande" },
  { value: "Huge", label: "Enorme" },
  { value: "Gargantuan", label: "Colossal" },
];

const monsterTypes = [
  "Aberração", "Besta", "Celestial", "Construto", "Dragão", "Elemental",
  "Fada", "Fera", "Gigante", "Humanóide", "Monstrosidade", "Morto-Vivo", "Planta"
];

const alignments = [
  "Leal e Bom", "Neutro e Bom", "Caótico e Bom",
  "Leal e Neutro", "Neutro", "Caótico e Neutro",
  "Leal e Mau", "Neutro e Mau", "Caótico e Mau",
  "Sem Alinhamento"
];

const challengeRatings = [
  "0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"
];

const defaultFormState = {
  name: "",
  description: "",
  icon: "👹",
  size: "Medium",
  type: "Monstrosidade",
  alignment: "Neutro e Mau",
  armor_class: 13,
  hit_points: "2d8+2",
  speed: "30 pés",
  // Attributes
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  // Other
  senses: "Percepção passiva 10",
  languages: "—",
  challenge_rating: "1",
  damage_resistances: "",
  damage_immunities: "",
  condition_immunities: "",
};

interface ActionForm {
  name: string;
  description: string;
  attack_bonus?: number;
  damage?: string;
  damage_type?: string;
}

export function CreateMonsterSheet({ open, onOpenChange, editingMonster }: CreateMonsterSheetProps) {
  const { createHomebrew, updateHomebrew, isCreating, isUpdating } = useHomebrew();
  const isEditing = !!editingMonster;
  
  const [form, setForm] = useState(defaultFormState);
  const [actions, setActions] = useState<ActionForm[]>([]);
  const [traits, setTraits] = useState("");

  useEffect(() => {
    if (editingMonster) {
      const data = editingMonster.data as HomebrewMonsterData;
      setForm({
        name: editingMonster.name,
        description: editingMonster.description || "",
        icon: editingMonster.icon,
        size: data.size || "Medium",
        type: data.type || "Monstrosidade",
        alignment: data.alignment || "Neutro e Mau",
        armor_class: data.armor_class || 13,
        hit_points: data.hit_points || "2d8+2",
        speed: data.speed || "30 pés",
        strength: data.attributes?.strength || 10,
        dexterity: data.attributes?.dexterity || 10,
        constitution: data.attributes?.constitution || 10,
        intelligence: data.attributes?.intelligence || 10,
        wisdom: data.attributes?.wisdom || 10,
        charisma: data.attributes?.charisma || 10,
        senses: data.senses || "",
        languages: data.languages || "—",
        challenge_rating: data.challenge_rating || "1",
        damage_resistances: data.damage_resistances?.join(", ") || "",
        damage_immunities: data.damage_immunities?.join(", ") || "",
        condition_immunities: data.condition_immunities?.join(", ") || "",
      });
      setActions(data.actions || []);
    } else {
      setForm(defaultFormState);
      setActions([]);
      setTraits("");
    }
  }, [editingMonster, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const monsterData: HomebrewMonsterData = {
      size: form.size,
      type: form.type,
      alignment: form.alignment,
      armor_class: form.armor_class,
      hit_points: form.hit_points,
      speed: form.speed,
      attributes: {
        strength: form.strength,
        dexterity: form.dexterity,
        constitution: form.constitution,
        intelligence: form.intelligence,
        wisdom: form.wisdom,
        charisma: form.charisma,
      },
      senses: form.senses,
      languages: form.languages,
      challenge_rating: form.challenge_rating,
      damage_resistances: form.damage_resistances ? form.damage_resistances.split(",").map(s => s.trim()) : undefined,
      damage_immunities: form.damage_immunities ? form.damage_immunities.split(",").map(s => s.trim()) : undefined,
      condition_immunities: form.condition_immunities ? form.condition_immunities.split(",").map(s => s.trim()) : undefined,
      actions: actions.filter(a => a.name && a.description),
    };

    if (isEditing && editingMonster) {
      updateHomebrew({
        id: editingMonster.id,
        input: {
          name: form.name,
          description: form.description,
          icon: form.icon,
          data: monsterData,
        },
      });
    } else {
      createHomebrew({
        type: 'monster',
        name: form.name,
        description: form.description,
        icon: form.icon,
        data: monsterData,
      });
    }
    
    onOpenChange(false);
  };

  const updateField = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addAction = () => {
    setActions(prev => [...prev, { name: "", description: "" }]);
  };

  const removeAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: keyof ActionForm, value: string | number) => {
    setActions(prev => prev.map((action, i) => 
      i === index ? { ...action, [field]: value } : action
    ));
  };

  const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-destructive" />
            {isEditing ? "Editar Monstro" : "Criar Monstro"}
          </SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Edite os detalhes do seu monstro homebrew"
              : "Crie um monstro personalizado para suas aventuras"
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
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Ex: Basilisco Sombrio"
                required
              />
            </div>
          </div>

          {/* Type, Size, Alignment */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Tamanho</Label>
              <Select value={form.size} onValueChange={(v) => updateField("size", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => updateField("type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monsterTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ND</Label>
              <Select value={form.challenge_rating} onValueChange={(v) => updateField("challenge_rating", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {challengeRatings.map((cr) => (
                    <SelectItem key={cr} value={cr}>
                      {cr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Combat Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>CA</Label>
              <Input
                type="number"
                value={form.armor_class}
                onChange={(e) => updateField("armor_class", parseInt(e.target.value) || 10)}
              />
            </div>
            <div>
              <Label>Pontos de Vida</Label>
              <Input
                value={form.hit_points}
                onChange={(e) => updateField("hit_points", e.target.value)}
                placeholder="4d10+8"
              />
            </div>
            <div>
              <Label>Deslocamento</Label>
              <Input
                value={form.speed}
                onChange={(e) => updateField("speed", e.target.value)}
                placeholder="30 pés"
              />
            </div>
          </div>

          {/* Attributes */}
          <div className="pt-2 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Atributos</h4>
            <div className="grid grid-cols-6 gap-2">
              {[
                { key: "strength", label: "FOR" },
                { key: "dexterity", label: "DES" },
                { key: "constitution", label: "CON" },
                { key: "intelligence", label: "INT" },
                { key: "wisdom", label: "SAB" },
                { key: "charisma", label: "CAR" },
              ].map(({ key, label }) => (
                <div key={key} className="text-center">
                  <Label className="text-xs">{label}</Label>
                  <Input
                    type="number"
                    value={form[key as keyof typeof form] as number}
                    onChange={(e) => updateField(key, parseInt(e.target.value) || 10)}
                    className="text-center"
                    min={1}
                    max={30}
                  />
                  <span className="text-xs text-muted-foreground">
                    ({getModifier(form[key as keyof typeof form] as number)})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Senses & Languages */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sentidos</Label>
              <Input
                value={form.senses}
                onChange={(e) => updateField("senses", e.target.value)}
                placeholder="Visão no escuro 18m"
              />
            </div>
            <div>
              <Label>Idiomas</Label>
              <Input
                value={form.languages}
                onChange={(e) => updateField("languages", e.target.value)}
                placeholder="Comum, Dracônico"
              />
            </div>
          </div>

          {/* Resistances */}
          <div className="space-y-2">
            <div>
              <Label>Resistências a Dano</Label>
              <Input
                value={form.damage_resistances}
                onChange={(e) => updateField("damage_resistances", e.target.value)}
                placeholder="Fogo, Frio"
              />
            </div>
            <div>
              <Label>Imunidades a Dano</Label>
              <Input
                value={form.damage_immunities}
                onChange={(e) => updateField("damage_immunities", e.target.value)}
                placeholder="Veneno"
              />
            </div>
            <div>
              <Label>Imunidades a Condições</Label>
              <Input
                value={form.condition_immunities}
                onChange={(e) => updateField("condition_immunities", e.target.value)}
                placeholder="Envenenado, Amedrontado"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Ações</h4>
              <Button type="button" variant="outline" size="sm" onClick={addAction}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={action.name}
                      onChange={(e) => updateAction(index, "name", e.target.value)}
                      placeholder="Nome da ação"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeAction(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={action.description}
                    onChange={(e) => updateAction(index, "description", e.target.value)}
                    placeholder="Descrição da ação..."
                    rows={2}
                  />
                </div>
              ))}
              {actions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma ação adicionada
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Descreva a aparência e comportamento do monstro..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/70"
            disabled={isLoading || !form.name}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? "Salvando..." : "Criando..."}
              </>
            ) : (
              <>
                <Skull className="w-4 h-4 mr-2" />
                {isEditing ? "Salvar Alterações" : "Criar Monstro"}
              </>
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
