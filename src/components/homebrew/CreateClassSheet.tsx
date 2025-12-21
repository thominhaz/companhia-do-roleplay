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
import { Checkbox } from "@/components/ui/checkbox";

interface CreateClassSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClass?: HomebrewContent;
}

interface ClassFeature {
  name: string;
  level: number;
  description: string;
}

const hitDiceOptions = ['d6', 'd8', 'd10', 'd12'];
const savingThrowOptions = ['Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma'];
const skillOptions = [
  'Acrobacia', 'Arcanismo', 'Atletismo', 'Atuação', 'Enganação', 'Furtividade',
  'História', 'Intimidação', 'Intuição', 'Investigação', 'Lidar com Animais',
  'Medicina', 'Natureza', 'Percepção', 'Persuasão', 'Prestidigitação', 'Religião', 'Sobrevivência'
];

const defaultFormState = {
  icon: '⚔️',
  name: '',
  hitDice: 'd8',
  primaryAbility: '',
  savingThrows: [] as string[],
  armorProficiencies: '',
  weaponProficiencies: '',
  toolProficiencies: '',
  skillChoices: 2,
  availableSkills: [] as string[],
  startingEquipment: '',
  features: [] as ClassFeature[],
  spellcasting: false,
  spellcastingAbility: '',
  description: ''
};

export function CreateClassSheet({ open, onOpenChange, editingClass }: CreateClassSheetProps) {
  const [formData, setFormData] = useState(defaultFormState);
  const { createHomebrew, updateHomebrew, isCreating, isUpdating } = useHomebrew();

  const isEditing = !!editingClass;
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (open) {
      if (editingClass) {
        const data = editingClass.data as any;
        setFormData({
          icon: editingClass.icon || '⚔️',
          name: editingClass.name,
          hitDice: data.hit_dice || 'd8',
          primaryAbility: data.primary_ability || '',
          savingThrows: data.saving_throws || [],
          armorProficiencies: data.armor_proficiencies || '',
          weaponProficiencies: data.weapon_proficiencies || '',
          toolProficiencies: data.tool_proficiencies || '',
          skillChoices: data.skill_choices || 2,
          availableSkills: data.available_skills || [],
          startingEquipment: data.starting_equipment || '',
          features: data.features || [],
          spellcasting: data.spellcasting || false,
          spellcastingAbility: data.spellcasting_ability || '',
          description: editingClass.description || ''
        });
      } else {
        setFormData(defaultFormState);
      }
    }
  }, [open, editingClass]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const classData = {
      hit_dice: formData.hitDice,
      primary_ability: formData.primaryAbility,
      saving_throws: formData.savingThrows,
      armor_proficiencies: formData.armorProficiencies,
      weapon_proficiencies: formData.weaponProficiencies,
      tool_proficiencies: formData.toolProficiencies,
      skill_choices: formData.skillChoices,
      available_skills: formData.availableSkills,
      starting_equipment: formData.startingEquipment,
      features: formData.features,
      spellcasting: formData.spellcasting,
      spellcasting_ability: formData.spellcastingAbility
    };

    if (isEditing && editingClass) {
      updateHomebrew({
        id: editingClass.id,
        input: {
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          data: classData
        }
      }, {
        onSuccess: () => onOpenChange(false)
      });
    } else {
      createHomebrew({
        name: formData.name,
        type: 'class',
        description: formData.description,
        icon: formData.icon,
        data: classData
      }, {
        onSuccess: () => onOpenChange(false)
      });
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSavingThrow = (st: string) => {
    setFormData(prev => ({
      ...prev,
      savingThrows: prev.savingThrows.includes(st)
        ? prev.savingThrows.filter(s => s !== st)
        : [...prev.savingThrows, st].slice(0, 2)
    }));
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      availableSkills: prev.availableSkills.includes(skill)
        ? prev.availableSkills.filter(s => s !== skill)
        : [...prev.availableSkills, skill]
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { name: '', level: 1, description: '' }]
    }));
  };

  const updateFeature = (index: number, field: keyof ClassFeature, value: any) => {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Classe' : 'Criar Classe'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Modifique os detalhes da classe' : 'Defina uma nova classe para seus jogadores'}
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
                <Label>Nome da Classe *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ex: Espadachim Arcano"
                  required
                />
              </div>
            </div>

            {/* Hit Dice & Primary Ability */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Dado de Vida</Label>
                <Select value={formData.hitDice} onValueChange={(v) => updateField('hitDice', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hitDiceOptions.map(hd => (
                      <SelectItem key={hd} value={hd}>{hd}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Habilidade Principal</Label>
                <Input
                  value={formData.primaryAbility}
                  onChange={(e) => updateField('primaryAbility', e.target.value)}
                  placeholder="Ex: Força ou Destreza"
                />
              </div>
            </div>

            {/* Saving Throws */}
            <div className="space-y-2">
              <Label>Testes de Resistência (escolha 2)</Label>
              <div className="grid grid-cols-3 gap-2">
                {savingThrowOptions.map(st => (
                  <label
                    key={st}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      formData.savingThrows.includes(st) 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Checkbox
                      checked={formData.savingThrows.includes(st)}
                      onCheckedChange={() => toggleSavingThrow(st)}
                    />
                    <span className="text-sm">{st}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Proficiencies */}
            <div className="space-y-1">
              <Label>Proficiência em Armaduras</Label>
              <Input
                value={formData.armorProficiencies}
                onChange={(e) => updateField('armorProficiencies', e.target.value)}
                placeholder="Ex: Armaduras leves e médias, escudos"
              />
            </div>

            <div className="space-y-1">
              <Label>Proficiência em Armas</Label>
              <Input
                value={formData.weaponProficiencies}
                onChange={(e) => updateField('weaponProficiencies', e.target.value)}
                placeholder="Ex: Armas simples e marciais"
              />
            </div>

            <div className="space-y-1">
              <Label>Proficiência em Ferramentas</Label>
              <Input
                value={formData.toolProficiencies}
                onChange={(e) => updateField('toolProficiencies', e.target.value)}
                placeholder="Ex: Nenhuma"
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Label>Perícias Disponíveis</Label>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Escolher:</Label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={formData.skillChoices}
                    onChange={(e) => updateField('skillChoices', parseInt(e.target.value) || 2)}
                    className="w-16 h-8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 max-h-40 overflow-y-auto p-2 bg-muted/30 rounded-lg">
                {skillOptions.map(skill => (
                  <label
                    key={skill}
                    className={`flex items-center gap-1 p-1.5 rounded cursor-pointer text-xs transition-all ${
                      formData.availableSkills.includes(skill) 
                        ? 'bg-primary/20 text-primary' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Checkbox
                      checked={formData.availableSkills.includes(skill)}
                      onCheckedChange={() => toggleSkill(skill)}
                      className="w-3 h-3"
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </div>

            {/* Spellcasting */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={formData.spellcasting}
                  onCheckedChange={(checked) => updateField('spellcasting', checked)}
                />
                <span className="text-sm font-medium">Conjuração</span>
              </label>
              {formData.spellcasting && (
                <Select 
                  value={formData.spellcastingAbility} 
                  onValueChange={(v) => updateField('spellcastingAbility', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Habilidade de conjuração" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inteligência">Inteligência</SelectItem>
                    <SelectItem value="Sabedoria">Sabedoria</SelectItem>
                    <SelectItem value="Carisma">Carisma</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Starting Equipment */}
            <div className="space-y-1">
              <Label>Equipamento Inicial</Label>
              <Textarea
                value={formData.startingEquipment}
                onChange={(e) => updateField('startingEquipment', e.target.value)}
                placeholder="Descreva as opções de equipamento inicial..."
                className="min-h-[80px]"
              />
            </div>

            {/* Features */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Características da Classe</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-3">
                {formData.features.map((feature, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={feature.name}
                        onChange={(e) => updateFeature(idx, 'name', e.target.value)}
                        placeholder="Nome da característica"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={feature.level}
                        onChange={(e) => updateFeature(idx, 'level', parseInt(e.target.value) || 1)}
                        className="w-20"
                        placeholder="Nível"
                      />
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
                placeholder="Uma breve descrição da classe..."
                className="min-h-[80px]"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !formData.name}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Salvando...' : 'Criando...'}
                </>
              ) : (
                isEditing ? 'Salvar Alterações' : 'Criar Classe'
              )}
            </Button>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
