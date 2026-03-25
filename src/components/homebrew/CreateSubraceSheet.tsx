import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHomebrew } from "@/hooks/useHomebrew";
import { HomebrewContent } from "@/types";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { RACES, getAttributeAbbr, type Attribute } from "@/data/srd";

interface CreateSubraceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSubrace?: HomebrewContent;
}

interface SubraceTrait {
  id: string;
  name: string;
  description: string;
  mechanical?: Record<string, unknown>;
}

const ATTRIBUTES: { key: Attribute; label: string }[] = [
  { key: 'strength', label: 'Força' },
  { key: 'dexterity', label: 'Destreza' },
  { key: 'constitution', label: 'Constituição' },
  { key: 'intelligence', label: 'Inteligência' },
  { key: 'wisdom', label: 'Sabedoria' },
  { key: 'charisma', label: 'Carisma' },
];

const defaultFormState = {
  icon: '🧬',
  name: '',
  parentRaceId: '',
  description: '',
  abilityBonuses: {} as Partial<Record<Attribute, number>>,
  traits: [] as SubraceTrait[],
};

export function CreateSubraceSheet({ open, onOpenChange, editingSubrace }: CreateSubraceSheetProps) {
  const [formData, setFormData] = useState(defaultFormState);
  const { homebrewContent: homebrewRaces } = useHomebrew('race');
  const { createHomebrew, updateHomebrew, isCreating, isUpdating } = useHomebrew();

  const isEditing = !!editingSubrace;
  const isLoading = isCreating || isUpdating;

  // Combine SRD + homebrew races for parent selection
  const allParentRaces = [
    ...RACES.map(r => ({ id: r.id, name: r.name, source: 'SRD' as const })),
    ...homebrewRaces.map(r => ({ id: r.id, name: r.name, source: 'Homebrew' as const })),
  ];

  useEffect(() => {
    if (open) {
      if (editingSubrace) {
        const data = editingSubrace.data as any;
        setFormData({
          icon: editingSubrace.icon || '🧬',
          name: editingSubrace.name,
          parentRaceId: data.parent_race_id || '',
          description: editingSubrace.description || '',
          abilityBonuses: data.ability_bonuses || {},
          traits: data.traits || [],
        });
      } else {
        setFormData(defaultFormState);
      }
    }
  }, [open, editingSubrace]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subraceData = {
      parent_race_id: formData.parentRaceId,
      ability_bonuses: formData.abilityBonuses,
      traits: formData.traits,
    };

    if (isEditing && editingSubrace) {
      updateHomebrew({
        id: editingSubrace.id,
        input: {
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          data: subraceData,
        },
      }, { onSuccess: () => onOpenChange(false) });
    } else {
      createHomebrew({
        name: formData.name,
        type: 'race',
        description: formData.description,
        icon: formData.icon,
        data: subraceData,
      }, { onSuccess: () => onOpenChange(false) });
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const setBonus = (attr: Attribute, value: string) => {
    const num = parseInt(value);
    setFormData(prev => {
      const bonuses = { ...prev.abilityBonuses };
      if (!num || num === 0) {
        delete bonuses[attr];
      } else {
        bonuses[attr] = num;
      }
      return { ...prev, abilityBonuses: bonuses };
    });
  };

  const addTrait = () => {
    setFormData(prev => ({
      ...prev,
      traits: [...prev.traits, { id: `trait-${Date.now()}`, name: '', description: '' }],
    }));
  };

  const updateTrait = (index: number, field: keyof SubraceTrait, value: any) => {
    setFormData(prev => ({
      ...prev,
      traits: prev.traits.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    }));
  };

  const removeTrait = (index: number) => {
    setFormData(prev => ({
      ...prev,
      traits: prev.traits.filter((_, i) => i !== index),
    }));
  };

  const parentRaceName = allParentRaces.find(r => r.id === formData.parentRaceId)?.name;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Sub-raça' : 'Criar Sub-raça'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Modifique os detalhes da sub-raça'
              : 'Crie uma nova sub-raça para uma raça existente (SRD ou homebrew)'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-[60px_1fr] gap-3">
              <div className="space-y-1">
                <Label>Ícone</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => updateField('icon', e.target.value)}
                  className="text-center text-xl"
                  maxLength={2}
                />
              </div>
              <div className="space-y-1">
                <Label>Nome da Sub-raça *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ex: Anão da Colina"
                  required
                />
              </div>
            </div>

            {/* Parent Race */}
            <div className="space-y-1">
              <Label>Raça Base *</Label>
              <Select value={formData.parentRaceId} onValueChange={(v) => updateField('parentRaceId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a raça base" />
                </SelectTrigger>
                <SelectContent>
                  {allParentRaces.map(race => (
                    <SelectItem key={race.id} value={race.id}>
                      {race.name}
                      {race.source === 'Homebrew' && ' (Homebrew)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {parentRaceName && (
                <p className="text-xs text-muted-foreground">
                  Essa sub-raça aparecerá como opção ao selecionar {parentRaceName} no wizard de criação.
                </p>
              )}
            </div>

            {/* Ability Bonuses */}
            <div className="space-y-2">
              <Label>Bônus de Atributos</Label>
              <p className="text-xs text-muted-foreground">
                Bônus adicionais aos da raça base (ex: +1 Sabedoria)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {ATTRIBUTES.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-12">{getAttributeAbbr(key)}</span>
                    <Select
                      value={(formData.abilityBonuses[key] || 0).toString()}
                      onValueChange={(v) => setBonus(key, v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">+0</SelectItem>
                        <SelectItem value="1">+1</SelectItem>
                        <SelectItem value="2">+2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Traits */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Traços da Sub-raça</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTrait}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-3">
                {formData.traits.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                    Adicione traços únicos desta sub-raça (ex: Resistência Anã, Treinamento em Combate Anão)
                  </p>
                )}
                {formData.traits.map((trait, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={trait.name}
                        onChange={(e) => updateTrait(idx, 'name', e.target.value)}
                        placeholder="Nome do traço"
                        className="flex-1"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeTrait(idx)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <Textarea
                      value={trait.description}
                      onChange={(e) => updateTrait(idx, 'description', e.target.value)}
                      placeholder="Descrição do traço..."
                      className="min-h-[60px]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label>Descrição Geral</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Uma breve descrição desta sub-raça..."
                className="min-h-[80px]"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !formData.name || !formData.parentRaceId}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Salvando...' : 'Criando...'}
                </>
              ) : (
                isEditing ? 'Salvar Alterações' : 'Criar Sub-raça'
              )}
            </Button>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
