import { useState, useEffect } from "react";
import { Loader2, BookOpen } from "lucide-react";
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
import { useHomebrew } from "@/hooks/useHomebrew";
import { HomebrewContent, HomebrewData } from "@/types";

interface CreateBackgroundSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBackground?: HomebrewContent;
}

interface HomebrewBackgroundData extends HomebrewData {
  skill_proficiencies: string[];
  tool_proficiencies: string[];
  languages: number;
  equipment: string[];
  feature_name: string;
  feature_description: string;
  personality_traits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
}

const defaultFormState = {
  name: "",
  description: "",
  icon: "📜",
  skill_proficiencies: "",
  tool_proficiencies: "",
  languages: 0,
  equipment: "",
  feature_name: "",
  feature_description: "",
  personality_traits: "",
  ideals: "",
  bonds: "",
  flaws: "",
};

export function CreateBackgroundSheet({ open, onOpenChange, editingBackground }: CreateBackgroundSheetProps) {
  const { createHomebrew, updateHomebrew, isCreating, isUpdating } = useHomebrew();
  const isEditing = !!editingBackground;
  
  const [form, setForm] = useState(defaultFormState);

  useEffect(() => {
    if (editingBackground) {
      const data = editingBackground.data as HomebrewBackgroundData;
      setForm({
        name: editingBackground.name,
        description: editingBackground.description || "",
        icon: editingBackground.icon,
        skill_proficiencies: data.skill_proficiencies?.join(", ") || "",
        tool_proficiencies: data.tool_proficiencies?.join(", ") || "",
        languages: data.languages || 0,
        equipment: data.equipment?.join("\n") || "",
        feature_name: data.feature_name || "",
        feature_description: data.feature_description || "",
        personality_traits: data.personality_traits?.join("\n") || "",
        ideals: data.ideals?.join("\n") || "",
        bonds: data.bonds?.join("\n") || "",
        flaws: data.flaws?.join("\n") || "",
      });
    } else {
      setForm(defaultFormState);
    }
  }, [editingBackground, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const backgroundData: HomebrewBackgroundData = {
      skill_proficiencies: form.skill_proficiencies.split(",").map(s => s.trim()).filter(Boolean),
      tool_proficiencies: form.tool_proficiencies.split(",").map(s => s.trim()).filter(Boolean),
      languages: form.languages,
      equipment: form.equipment.split("\n").filter(e => e.trim()),
      feature_name: form.feature_name,
      feature_description: form.feature_description,
      personality_traits: form.personality_traits.split("\n").filter(t => t.trim()),
      ideals: form.ideals.split("\n").filter(t => t.trim()),
      bonds: form.bonds.split("\n").filter(t => t.trim()),
      flaws: form.flaws.split("\n").filter(t => t.trim()),
    };

    if (isEditing && editingBackground) {
      updateHomebrew({
        id: editingBackground.id,
        input: {
          name: form.name,
          description: form.description,
          icon: form.icon,
          data: backgroundData,
        },
      });
    } else {
      createHomebrew({
        type: 'background',
        name: form.name,
        description: form.description,
        icon: form.icon,
        data: backgroundData,
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
            <BookOpen className="w-5 h-5 text-green-500" />
            {isEditing ? "Editar Antecedente" : "Criar Antecedente"}
          </SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Edite os detalhes do seu antecedente homebrew"
              : "Crie um antecedente personalizado com proficiências e características únicas"
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
              <Label>Nome do Antecedente *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Ex: Caçador de Recompensas"
                required
              />
            </div>
          </div>

          {/* Proficiencies */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Perícias (separadas por vírgula)</Label>
              <Input
                value={form.skill_proficiencies}
                onChange={(e) => updateField("skill_proficiencies", e.target.value)}
                placeholder="Investigação, Percepção"
              />
            </div>
            <div>
              <Label>Ferramentas (separadas por vírgula)</Label>
              <Input
                value={form.tool_proficiencies}
                onChange={(e) => updateField("tool_proficiencies", e.target.value)}
                placeholder="Kit de disfarce"
              />
            </div>
          </div>

          {/* Languages & Equipment */}
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <div>
              <Label>Idiomas Extras</Label>
              <Input
                type="number"
                value={form.languages}
                onChange={(e) => updateField("languages", parseInt(e.target.value) || 0)}
                min={0}
                max={3}
              />
            </div>
            <div>
              <Label>Equipamento Inicial (um por linha)</Label>
              <Textarea
                value={form.equipment}
                onChange={(e) => updateField("equipment", e.target.value)}
                placeholder="Algemas&#10;Roupas comuns&#10;Bolsa com 15 po"
                rows={2}
              />
            </div>
          </div>

          {/* Feature */}
          <div className="pt-2 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Característica do Antecedente</h4>
            <div className="space-y-3">
              <div>
                <Label>Nome da Característica *</Label>
                <Input
                  value={form.feature_name}
                  onChange={(e) => updateField("feature_name", e.target.value)}
                  placeholder="Ex: Rede de Contatos"
                  required
                />
              </div>
              <div>
                <Label>Descrição da Característica *</Label>
                <Textarea
                  value={form.feature_description}
                  onChange={(e) => updateField("feature_description", e.target.value)}
                  placeholder="Descreva o benefício único deste antecedente..."
                  rows={3}
                  required
                />
              </div>
            </div>
          </div>

          {/* Personality Options */}
          <div className="pt-2 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Opções de Personalidade (opcionais)</h4>
            <div className="space-y-3">
              <div>
                <Label>Traços de Personalidade (um por linha)</Label>
                <Textarea
                  value={form.personality_traits}
                  onChange={(e) => updateField("personality_traits", e.target.value)}
                  placeholder="Sempre avalio o valor de algo antes de qualquer coisa.&#10;Mantenho múltiplas identidades."
                  rows={2}
                />
              </div>
              <div>
                <Label>Ideais (um por linha)</Label>
                <Textarea
                  value={form.ideals}
                  onChange={(e) => updateField("ideals", e.target.value)}
                  placeholder="Justiça. Criminosos devem pagar por seus crimes.&#10;Liberdade. A lei existe para ser questionada."
                  rows={2}
                />
              </div>
              <div>
                <Label>Vínculos (um por linha)</Label>
                <Textarea
                  value={form.bonds}
                  onChange={(e) => updateField("bonds", e.target.value)}
                  placeholder="Um criminoso fugitivo é minha obsessão.&#10;Devo proteger minha família a qualquer custo."
                  rows={2}
                />
              </div>
              <div>
                <Label>Defeitos (um por linha)</Label>
                <Textarea
                  value={form.flaws}
                  onChange={(e) => updateField("flaws", e.target.value)}
                  placeholder="Sou impiedoso na captura de meus alvos.&#10;O dinheiro me corrompe facilmente."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Descrição Geral *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Descreva a origem e história deste antecedente..."
              rows={3}
              required
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-green-700"
            disabled={isLoading || !form.name || !form.description || !form.feature_name || !form.feature_description}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? "Salvando..." : "Criando..."}
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                {isEditing ? "Salvar Alterações" : "Criar Antecedente"}
              </>
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
