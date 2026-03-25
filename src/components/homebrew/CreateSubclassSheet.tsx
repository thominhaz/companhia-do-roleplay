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
import { CLASSES } from "@/data/srd";

interface CreateSubclassSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSubclass?: HomebrewContent;
}

interface SubclassFeature {
  name: string;
  level: number;
  description: string;
}

const defaultFormState = {
  icon: '🌟',
  name: '',
  parentClass: '',
  subclassLevel: 3,
  features: [] as SubclassFeature[],
  description: ''
};

export function CreateSubclassSheet({ open, onOpenChange, editingSubclass }: CreateSubclassSheetProps) {
  const [formData, setFormData] = useState(defaultFormState);
  const { createHomebrew, updateHomebrew, isCreating, isUpdating } = useHomebrew();

  const isEditing = !!editingSubclass;
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (open) {
      if (editingSubclass) {
        const data = editingSubclass.data as any;
        setFormData({
          icon: editingSubclass.icon || '🌟',
          name: editingSubclass.name,
          parentClass: data.parent_class || '',
          subclassLevel: data.subclass_level || 3,
          features: data.features || [],
          description: editingSubclass.description || ''
        });
      } else {
        setFormData(defaultFormState);
      }
    }
  }, [open, editingSubclass]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subclassData = {
      parent_class: formData.parentClass,
      subclass_level: formData.subclassLevel,
      features: formData.features
    };

    if (isEditing && editingSubclass) {
      updateHomebrew({
        id: editingSubclass.id,
        input: {
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          data: subclassData
        }
      }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createHomebrew({
        name: formData.name,
        type: 'subclass',
        description: formData.description,
        icon: formData.icon,
        data: subclassData
      }, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    const levels = getSubclassLevels();
    const usedLevels = formData.features.map(f => f.level);
    const nextLevel = levels.find(l => !usedLevels.includes(l)) || levels[0] || 3;
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { name: '', level: nextLevel, description: '' }]
    }));
  };

  const updateFeature = (index: number, field: keyof SubclassFeature, value: any) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? { ...f, [field]: value } : f)
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Get subclass level based on parent class
  const getSubclassLevels = () => {
    const classInfo = CLASSES.find(c => c.id === formData.parentClass);
    if (!classInfo) return [3];
    
    // Different classes get subclass at different levels
    const subclassLevelMap: Record<string, number[]> = {
      'barbaro': [3, 6, 10, 14],
      'bardo': [3, 6, 14],
      'bruxo': [1, 6, 10, 14],
      'clerigo': [1, 2, 6, 8, 17],
      'druida': [2, 6, 10, 14],
      'feiticeiro': [1, 6, 14, 18],
      'guerreiro': [3, 7, 10, 15, 18],
      'ladino': [3, 9, 13, 17],
      'mago': [2, 6, 10, 14],
      'monge': [3, 6, 11, 17],
      'paladino': [3, 7, 15, 20],
      'patrulheiro': [3, 7, 11, 15],
    };
    
    return subclassLevelMap[formData.parentClass] || [3];
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Subclasse' : 'Criar Subclasse'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Modifique os detalhes da subclasse' : 'Defina uma nova subclasse para uma classe existente'}
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
                <Label>Nome da Subclasse *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ex: Caminho do Berserker"
                  required
                />
              </div>
            </div>

            {/* Parent Class */}
            <div className="space-y-1">
              <Label>Classe Base *</Label>
              <Select value={formData.parentClass} onValueChange={(v) => updateField('parentClass', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a classe base" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subclass Feature Levels Info */}
            {formData.parentClass && (
              <div className="space-y-1">
                <Label>Níveis de Características</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
                  {getSubclassLevels().map(level => (
                    <span key={level} className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary border border-primary/30">
                      Nível {level}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Níveis em que esta subclasse concede características. Adicione uma característica para cada nível abaixo.
                </p>
              </div>
            )}

            {/* Features */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Características da Subclasse</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-3">
                {formData.features.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                    Adicione características que a subclasse concede em cada nível
                  </p>
                )}
                {formData.features.map((feature, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={feature.name}
                        onChange={(e) => updateFeature(idx, 'name', e.target.value)}
                        placeholder="Nome da característica"
                        className="flex-1"
                      />
                      <Select 
                        value={feature.level.toString()} 
                        onValueChange={(v) => updateFeature(idx, 'level', parseInt(v))}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getSubclassLevels().map(level => (
                            <SelectItem key={level} value={level.toString()}>Nv.{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeFeature(idx)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <Textarea
                      value={feature.description}
                      onChange={(e) => updateFeature(idx, 'description', e.target.value)}
                      placeholder="Descrição da característica..."
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
                placeholder="Uma breve descrição da subclasse e seu tema..."
                className="min-h-[80px]"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !formData.name || !formData.parentClass}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Salvando...' : 'Criando...'}
                </>
              ) : (
                isEditing ? 'Salvar Alterações' : 'Criar Subclasse'
              )}
            </Button>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
