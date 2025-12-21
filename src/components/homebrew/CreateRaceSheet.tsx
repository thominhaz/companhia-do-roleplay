import { useState, useEffect } from "react";
import { Loader2, Users } from "lucide-react";
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
import { HomebrewContent, HomebrewRaceData } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateRaceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRace?: HomebrewContent;
}

const sizeOptions = [
  { value: "Small", label: "Pequeno" },
  { value: "Medium", label: "Médio" },
  { value: "Large", label: "Grande" },
];

const defaultFormState = {
  name: "",
  description: "",
  icon: "👤",
  size: "Medium" as 'Small' | 'Medium' | 'Large',
  speed: 30,
  darkvision: 0,
  languages: "Comum",
  traits: "",
  // Attribute bonuses
  strength: 0,
  dexterity: 0,
  constitution: 0,
  intelligence: 0,
  wisdom: 0,
  charisma: 0,
};

export function CreateRaceSheet({ open, onOpenChange, editingRace }: CreateRaceSheetProps) {
  const { createHomebrew, updateHomebrew, isCreating, isUpdating } = useHomebrew();
  const isEditing = !!editingRace;
  
  const [form, setForm] = useState(defaultFormState);

  useEffect(() => {
    if (editingRace) {
      const data = editingRace.data as HomebrewRaceData;
      setForm({
        name: editingRace.name,
        description: editingRace.description || "",
        icon: editingRace.icon,
        size: data.size || "Medium",
        speed: data.speed || 30,
        darkvision: data.darkvision || 0,
        languages: data.languages?.join(", ") || "Comum",
        traits: data.traits?.join("\n") || "",
        strength: data.ability_bonuses?.strength || 0,
        dexterity: data.ability_bonuses?.dexterity || 0,
        constitution: data.ability_bonuses?.constitution || 0,
        intelligence: data.ability_bonuses?.intelligence || 0,
        wisdom: data.ability_bonuses?.wisdom || 0,
        charisma: data.ability_bonuses?.charisma || 0,
      });
    } else {
      setForm(defaultFormState);
    }
  }, [editingRace, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const raceData: HomebrewRaceData = {
      size: form.size,
      speed: form.speed,
      darkvision: form.darkvision > 0 ? form.darkvision : undefined,
      languages: form.languages.split(",").map(l => l.trim()).filter(Boolean),
      traits: form.traits.split("\n").filter(t => t.trim()),
      ability_bonuses: {
        ...(form.strength !== 0 && { strength: form.strength }),
        ...(form.dexterity !== 0 && { dexterity: form.dexterity }),
        ...(form.constitution !== 0 && { constitution: form.constitution }),
        ...(form.intelligence !== 0 && { intelligence: form.intelligence }),
        ...(form.wisdom !== 0 && { wisdom: form.wisdom }),
        ...(form.charisma !== 0 && { charisma: form.charisma }),
      },
    };

    if (isEditing && editingRace) {
      updateHomebrew({
        id: editingRace.id,
        input: {
          name: form.name,
          description: form.description,
          icon: form.icon,
          data: raceData,
        },
      });
    } else {
      createHomebrew({
        type: 'race',
        name: form.name,
        description: form.description,
        icon: form.icon,
        data: raceData,
      });
    }
    
    onOpenChange(false);
  };

  const updateField = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            {isEditing ? "Editar Raça" : "Criar Raça"}
          </SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Edite os detalhes da sua raça homebrew"
              : "Crie uma raça personalizada com bônus e traços únicos"
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
              <Label>Nome da Raça *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Ex: Aasimar"
                required
              />
            </div>
          </div>

          {/* Size & Speed */}
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
              <Label>Deslocamento</Label>
              <Input
                type="number"
                value={form.speed}
                onChange={(e) => updateField("speed", parseInt(e.target.value) || 30)}
                min={0}
                step={5}
              />
            </div>
            <div>
              <Label>Visão no Escuro</Label>
              <Input
                type="number"
                value={form.darkvision}
                onChange={(e) => updateField("darkvision", parseInt(e.target.value) || 0)}
                min={0}
                step={30}
                placeholder="0"
              />
            </div>
          </div>

          {/* Attribute Bonuses */}
          <div className="pt-2 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Bônus de Atributos</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Força</Label>
                <Input
                  type="number"
                  value={form.strength}
                  onChange={(e) => updateField("strength", parseInt(e.target.value) || 0)}
                  min={-2}
                  max={4}
                />
              </div>
              <div>
                <Label className="text-xs">Destreza</Label>
                <Input
                  type="number"
                  value={form.dexterity}
                  onChange={(e) => updateField("dexterity", parseInt(e.target.value) || 0)}
                  min={-2}
                  max={4}
                />
              </div>
              <div>
                <Label className="text-xs">Constituição</Label>
                <Input
                  type="number"
                  value={form.constitution}
                  onChange={(e) => updateField("constitution", parseInt(e.target.value) || 0)}
                  min={-2}
                  max={4}
                />
              </div>
              <div>
                <Label className="text-xs">Inteligência</Label>
                <Input
                  type="number"
                  value={form.intelligence}
                  onChange={(e) => updateField("intelligence", parseInt(e.target.value) || 0)}
                  min={-2}
                  max={4}
                />
              </div>
              <div>
                <Label className="text-xs">Sabedoria</Label>
                <Input
                  type="number"
                  value={form.wisdom}
                  onChange={(e) => updateField("wisdom", parseInt(e.target.value) || 0)}
                  min={-2}
                  max={4}
                />
              </div>
              <div>
                <Label className="text-xs">Carisma</Label>
                <Input
                  type="number"
                  value={form.charisma}
                  onChange={(e) => updateField("charisma", parseInt(e.target.value) || 0)}
                  min={-2}
                  max={4}
                />
              </div>
            </div>
          </div>

          {/* Languages */}
          <div>
            <Label>Idiomas (separados por vírgula)</Label>
            <Input
              value={form.languages}
              onChange={(e) => updateField("languages", e.target.value)}
              placeholder="Comum, Élfico"
            />
          </div>

          {/* Traits */}
          <div>
            <Label>Traços Raciais (um por linha)</Label>
            <Textarea
              value={form.traits}
              onChange={(e) => updateField("traits", e.target.value)}
              placeholder="Resistência Feérica: Vantagem em testes contra encantamentos&#10;Ancestralidade Élfica: Você conta como elfo para efeitos..."
              rows={4}
            />
          </div>

          {/* Description */}
          <div>
            <Label>Descrição *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Descreva a origem, aparência e cultura desta raça..."
              rows={4}
              required
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700"
            disabled={isLoading || !form.name || !form.description}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? "Salvando..." : "Criando..."}
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                {isEditing ? "Salvar Alterações" : "Criar Raça"}
              </>
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
