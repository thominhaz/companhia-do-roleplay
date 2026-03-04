import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
import { HomebrewContent, HomebrewSpellData } from "@/types";

interface CreateSpellSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSpell?: HomebrewContent;
}

const spellSchools = [
  { value: "abjuration", label: "Abjuração" },
  { value: "conjuration", label: "Conjuração" },
  { value: "divination", label: "Adivinhação" },
  { value: "enchantment", label: "Encantamento" },
  { value: "evocation", label: "Evocação" },
  { value: "illusion", label: "Ilusão" },
  { value: "necromancy", label: "Necromancia" },
  { value: "transmutation", label: "Transmutação" },
];

const spellLevels = [
  { value: "0", label: "Truque" },
  { value: "1", label: "1º Nível" },
  { value: "2", label: "2º Nível" },
  { value: "3", label: "3º Nível" },
  { value: "4", label: "4º Nível" },
  { value: "5", label: "5º Nível" },
  { value: "6", label: "6º Nível" },
  { value: "7", label: "7º Nível" },
  { value: "8", label: "8º Nível" },
  { value: "9", label: "9º Nível" },
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
  icon: "✨",
  level: "1",
  school: "evocation",
  casting_time: "1 ação",
  range: "9 metros",
  components: "V, S",
  duration: "Instantânea",
  classes: "",
  save_type: "none",
  damage: "",
  damage_type: "none",
};

export function CreateSpellSheet({ open, onOpenChange, editingSpell }: CreateSpellSheetProps) {
  const { createHomebrew, updateHomebrew, isCreating, isUpdating } = useHomebrew();
  const isEditing = !!editingSpell;
  
  const [form, setForm] = useState(defaultFormState);

  // Populate form when editing
  useEffect(() => {
    if (editingSpell) {
      const data = editingSpell.data as HomebrewSpellData;
      setForm({
        name: editingSpell.name,
        description: editingSpell.description || "",
        icon: editingSpell.icon,
        level: String(data.level || 1),
        school: data.school || "evocation",
        casting_time: data.casting_time || "1 ação",
        range: data.range || "9 metros",
        components: data.components || "V, S",
        duration: data.duration || "Instantânea",
        classes: data.classes?.join(", ") || "",
        save_type: data.mechanics?.save_type || "none",
        damage: data.mechanics?.damage || "",
        damage_type: data.mechanics?.damage_type || "none",
      });
    } else {
      setForm(defaultFormState);
    }
  }, [editingSpell, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const spellData: HomebrewSpellData = {
      level: parseInt(form.level),
      school: form.school,
      casting_time: form.casting_time,
      range: form.range,
      components: form.components,
      duration: form.duration,
      classes: form.classes.split(",").map(c => c.trim()).filter(Boolean),
      mechanics: {
        save_type: form.save_type !== "none" ? form.save_type : undefined,
        damage: form.damage || undefined,
        damage_type: form.damage_type !== "none" ? form.damage_type : undefined,
      },
    };

    if (isEditing && editingSpell) {
      updateHomebrew({
        id: editingSpell.id,
        input: {
          name: form.name,
          description: form.description,
          icon: form.icon,
          data: spellData,
        },
      });
    } else {
      createHomebrew({
        type: 'spell',
        name: form.name,
        description: form.description,
        icon: form.icon,
        data: spellData,
      });
    }
    
    onOpenChange(false);
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-foreground" />
            {isEditing ? "Editar Magia" : "Criar Magia"}
          </SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Edite os detalhes da sua magia homebrew"
              : "Preencha os detalhes da sua magia homebrew"
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
              <Label>Nome da Magia *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Ex: Explosão de Éter"
                required
              />
            </div>
          </div>

          {/* Level & School */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nível *</Label>
              <Select value={form.level} onValueChange={(v) => updateField("level", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {spellLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Escola *</Label>
              <Select value={form.school} onValueChange={(v) => updateField("school", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {spellSchools.map((school) => (
                    <SelectItem key={school.value} value={school.value}>
                      {school.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Casting Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tempo de Conjuração</Label>
              <Input
                value={form.casting_time}
                onChange={(e) => updateField("casting_time", e.target.value)}
                placeholder="1 ação"
              />
            </div>
            <div>
              <Label>Alcance</Label>
              <Input
                value={form.range}
                onChange={(e) => updateField("range", e.target.value)}
                placeholder="9 metros"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Componentes</Label>
              <Input
                value={form.components}
                onChange={(e) => updateField("components", e.target.value)}
                placeholder="V, S, M"
              />
            </div>
            <div>
              <Label>Duração</Label>
              <Input
                value={form.duration}
                onChange={(e) => updateField("duration", e.target.value)}
                placeholder="Instantânea"
              />
            </div>
          </div>

          {/* Mechanics */}
          <div className="pt-2 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Mecânicas</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Teste de Resistência</Label>
                <Select value={form.save_type} onValueChange={(v) => updateField("save_type", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum" />
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
              <div>
                <Label>Dano</Label>
                <Input
                  value={form.damage}
                  onChange={(e) => updateField("damage", e.target.value)}
                  placeholder="6d6"
                />
              </div>
              <div>
                <Label>Tipo de Dano</Label>
                <Select value={form.damage_type} onValueChange={(v) => updateField("damage_type", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum" />
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

          {/* Classes */}
          <div>
            <Label>Classes (separadas por vírgula)</Label>
            <Input
              value={form.classes}
              onChange={(e) => updateField("classes", e.target.value)}
              placeholder="Mago, Feiticeiro, Bruxo"
            />
          </div>

          {/* Description */}
          <div>
            <Label>Descrição *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Descreva os efeitos e funcionamento da magia..."
              rows={4}
              required
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/70"
            disabled={isLoading || !form.name || !form.description}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? "Salvando..." : "Criando..."}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {isEditing ? "Salvar Alterações" : "Criar Magia"}
              </>
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
