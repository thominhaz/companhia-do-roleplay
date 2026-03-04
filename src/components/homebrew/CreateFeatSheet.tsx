import { useState, useEffect } from "react";
import { Loader2, Star } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useHomebrew } from "@/hooks/useHomebrew";
import { HomebrewContent, HomebrewData } from "@/types";

interface CreateFeatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFeat?: HomebrewContent;
}

interface HomebrewFeatData extends HomebrewData {
  prerequisites: string;
  benefits: string[];
  ability_increase?: {
    options: string[];
    amount: number;
  };
}

const defaultFormState = {
  name: "",
  description: "",
  icon: "⭐",
  prerequisites: "",
  benefits: "",
  hasAbilityIncrease: false,
  abilityOptions: "",
  abilityAmount: 1,
};

export function CreateFeatSheet({ open, onOpenChange, editingFeat }: CreateFeatSheetProps) {
  const { createHomebrew, updateHomebrew, isCreating, isUpdating } = useHomebrew();
  const isEditing = !!editingFeat;
  
  const [form, setForm] = useState(defaultFormState);

  useEffect(() => {
    if (editingFeat) {
      const data = editingFeat.data as HomebrewFeatData;
      setForm({
        name: editingFeat.name,
        description: editingFeat.description || "",
        icon: editingFeat.icon,
        prerequisites: data.prerequisites || "",
        benefits: data.benefits?.join("\n") || "",
        hasAbilityIncrease: !!data.ability_increase,
        abilityOptions: data.ability_increase?.options?.join(", ") || "",
        abilityAmount: data.ability_increase?.amount || 1,
      });
    } else {
      setForm(defaultFormState);
    }
  }, [editingFeat, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const featData: HomebrewFeatData = {
      prerequisites: form.prerequisites,
      benefits: form.benefits.split("\n").filter(b => b.trim()),
      ...(form.hasAbilityIncrease && form.abilityOptions && {
        ability_increase: {
          options: form.abilityOptions.split(",").map(o => o.trim()).filter(Boolean),
          amount: form.abilityAmount,
        },
      }),
    };

    if (isEditing && editingFeat) {
      updateHomebrew({
        id: editingFeat.id,
        input: {
          name: form.name,
          description: form.description,
          icon: form.icon,
          data: featData,
        },
      });
    } else {
      createHomebrew({
        type: 'feat',
        name: form.name,
        description: form.description,
        icon: form.icon,
        data: featData,
      });
    }
    
    onOpenChange(false);
  };

  const updateField = (field: string, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-orange-500" />
            {isEditing ? "Editar Talento" : "Criar Talento"}
          </SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Edite os detalhes do seu talento homebrew"
              : "Crie um talento personalizado com benefícios únicos"
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
              <Label>Nome do Talento *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Ex: Mestre em Combate Dual"
                required
              />
            </div>
          </div>

          {/* Prerequisites */}
          <div>
            <Label>Pré-requisitos</Label>
            <Input
              value={form.prerequisites}
              onChange={(e) => updateField("prerequisites", e.target.value)}
              placeholder="Ex: Destreza 13 ou superior"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deixe em branco se não houver pré-requisitos
            </p>
          </div>

          {/* Description */}
          <div>
            <Label>Descrição *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Descreva o talento e seus efeitos gerais..."
              rows={3}
              required
            />
          </div>

          {/* Benefits */}
          <div>
            <Label>Benefícios (um por linha) *</Label>
            <Textarea
              value={form.benefits}
              onChange={(e) => updateField("benefits", e.target.value)}
              placeholder="Você ganha +1 em ataques com armas leves.&#10;Quando usa a ação de Ataque, pode fazer um ataque adicional.&#10;Você pode sacar ou guardar duas armas de uma mão."
              rows={5}
              required
            />
          </div>

          {/* Ability Increase */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                id="hasAbilityIncrease"
                checked={form.hasAbilityIncrease}
                onCheckedChange={(checked) => updateField("hasAbilityIncrease", !!checked)}
              />
              <Label htmlFor="hasAbilityIncrease" className="font-medium cursor-pointer">
                Incluir aumento de atributo
              </Label>
            </div>

            {form.hasAbilityIncrease && (
              <div className="grid grid-cols-[2fr_1fr] gap-3 pl-6">
                <div>
                  <Label>Atributos (separados por vírgula)</Label>
                  <Input
                    value={form.abilityOptions}
                    onChange={(e) => updateField("abilityOptions", e.target.value)}
                    placeholder="Força, Destreza, Constituição"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O jogador escolhe um destes
                  </p>
                </div>
                <div>
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    value={form.abilityAmount}
                    onChange={(e) => updateField("abilityAmount", parseInt(e.target.value) || 1)}
                    min={1}
                    max={2}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/70"
            disabled={isLoading || !form.name || !form.description || !form.benefits}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? "Salvando..." : "Criando..."}
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                {isEditing ? "Salvar Alterações" : "Criar Talento"}
              </>
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
