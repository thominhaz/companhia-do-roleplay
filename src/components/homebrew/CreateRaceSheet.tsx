import { useState, useEffect } from "react";
import { Loader2, Users, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
import { HomebrewContent, HomebrewRaceData, HomebrewRaceTrait, HomebrewSubrace } from "@/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

interface TraitForm {
  name: string;
  description: string;
  weapon_proficiencies: string;
  skill_proficiencies: string;
  hp_bonus_per_level: number;
}

interface SubraceForm {
  id: string;
  name: string;
  description: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  traits: TraitForm[];
}

const emptyTrait: TraitForm = {
  name: "",
  description: "",
  weapon_proficiencies: "",
  skill_proficiencies: "",
  hp_bonus_per_level: 0,
};

const emptySubrace: SubraceForm = {
  id: "",
  name: "",
  description: "",
  strength: 0, dexterity: 0, constitution: 0,
  intelligence: 0, wisdom: 0, charisma: 0,
  traits: [],
};

const defaultFormState = {
  name: "",
  description: "",
  icon: "👤",
  size: "Medium" as 'Small' | 'Medium' | 'Large',
  speed: 30,
  darkvision: 0,
  languages: "Comum",
  strength: 0,
  dexterity: 0,
  constitution: 0,
  intelligence: 0,
  wisdom: 0,
  charisma: 0,
  weapon_proficiencies: "",
  skill_proficiencies: "",
};

function parseLegacyTraits(traits: unknown): TraitForm[] {
  if (!Array.isArray(traits) || traits.length === 0) return [];
  
  return traits.map((t, i) => {
    if (typeof t === 'string') {
      const parts = t.split(':');
      return {
        name: parts.length > 1 ? parts[0].trim() : `Traço ${i + 1}`,
        description: parts.length > 1 ? parts.slice(1).join(':').trim() : t,
        weapon_proficiencies: "",
        skill_proficiencies: "",
        hp_bonus_per_level: 0,
      };
    }
    const trait = t as HomebrewRaceTrait;
    return {
      name: trait.name || `Traço ${i + 1}`,
      description: trait.description_markdown || trait.description || "",
      weapon_proficiencies: trait.mechanical?.weapon_proficiencies?.join(", ") || "",
      skill_proficiencies: trait.mechanical?.skill_proficiencies?.join(", ") || "",
      hp_bonus_per_level: trait.mechanical?.hp_bonus_per_level || 0,
    };
  });
}

function parseSubraces(subraces: unknown): SubraceForm[] {
  if (!Array.isArray(subraces)) return [];
  return subraces.map((sr: HomebrewSubrace) => ({
    id: sr.id || crypto.randomUUID(),
    name: sr.name || "",
    description: sr.description || "",
    strength: sr.ability_bonuses?.strength || 0,
    dexterity: sr.ability_bonuses?.dexterity || 0,
    constitution: sr.ability_bonuses?.constitution || 0,
    intelligence: sr.ability_bonuses?.intelligence || 0,
    wisdom: sr.ability_bonuses?.wisdom || 0,
    charisma: sr.ability_bonuses?.charisma || 0,
    traits: parseLegacyTraits(sr.traits),
  }));
}

export function CreateRaceSheet({ open, onOpenChange, editingRace }: CreateRaceSheetProps) {
  const { createHomebrew, updateHomebrew, isCreating, isUpdating } = useHomebrew();
  const isEditing = !!editingRace;
  
  const [form, setForm] = useState(defaultFormState);
  const [traits, setTraits] = useState<TraitForm[]>([]);
  const [subraces, setSubraces] = useState<SubraceForm[]>([]);
  const [expandedSubrace, setExpandedSubrace] = useState<number | null>(null);

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
        strength: data.ability_bonuses?.strength || 0,
        dexterity: data.ability_bonuses?.dexterity || 0,
        constitution: data.ability_bonuses?.constitution || 0,
        intelligence: data.ability_bonuses?.intelligence || 0,
        wisdom: data.ability_bonuses?.wisdom || 0,
        charisma: data.ability_bonuses?.charisma || 0,
        weapon_proficiencies: data.weapon_proficiencies?.join(", ") || "",
        skill_proficiencies: data.skill_proficiencies?.join(", ") || "",
      });
      setTraits(parseLegacyTraits(data.traits));
      setSubraces(parseSubraces(data.subraces));
    } else {
      setForm(defaultFormState);
      setTraits([]);
      setSubraces([]);
    }
  }, [editingRace, open]);

  const buildTraitData = (t: TraitForm, idx: number): HomebrewRaceTrait => {
    const mechanical: Record<string, unknown> = {};
    const wp = t.weapon_proficiencies.split(",").map(s => s.trim()).filter(Boolean);
    const sp = t.skill_proficiencies.split(",").map(s => s.trim()).filter(Boolean);
    if (wp.length) mechanical.weapon_proficiencies = wp;
    if (sp.length) mechanical.skill_proficiencies = sp;
    if (t.hp_bonus_per_level) mechanical.hp_bonus_per_level = t.hp_bonus_per_level;
    
    return {
      id: `homebrew-trait-${idx}`,
      name: t.name,
      description: t.description,
      description_markdown: t.description,
      ...(Object.keys(mechanical).length > 0 ? { mechanical: mechanical as HomebrewRaceTrait['mechanical'] } : {}),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const buildBonuses = (s: { strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number }) => ({
      ...(s.strength !== 0 && { strength: s.strength }),
      ...(s.dexterity !== 0 && { dexterity: s.dexterity }),
      ...(s.constitution !== 0 && { constitution: s.constitution }),
      ...(s.intelligence !== 0 && { intelligence: s.intelligence }),
      ...(s.wisdom !== 0 && { wisdom: s.wisdom }),
      ...(s.charisma !== 0 && { charisma: s.charisma }),
    });

    const raceData: HomebrewRaceData = {
      size: form.size,
      speed: form.speed,
      darkvision: form.darkvision > 0 ? form.darkvision : undefined,
      languages: form.languages.split(",").map(l => l.trim()).filter(Boolean),
      traits: traits.filter(t => t.name.trim()).map((t, i) => buildTraitData(t, i)),
      ability_bonuses: buildBonuses(form),
      weapon_proficiencies: form.weapon_proficiencies.split(",").map(s => s.trim()).filter(Boolean),
      skill_proficiencies: form.skill_proficiencies.split(",").map(s => s.trim()).filter(Boolean),
      subraces: subraces.filter(sr => sr.name.trim()).map(sr => ({
        id: sr.id || sr.name.toLowerCase().replace(/\s+/g, '_'),
        name: sr.name,
        description: sr.description,
        ability_bonuses: buildBonuses(sr),
        traits: sr.traits.filter(t => t.name.trim()).map((t, i) => buildTraitData(t, i)),
      })),
    };

    if (isEditing && editingRace) {
      updateHomebrew({
        id: editingRace.id,
        input: { name: form.name, description: form.description, icon: form.icon, data: raceData },
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

  const updateTrait = (index: number, field: keyof TraitForm, value: string | number) => {
    setTraits(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const updateSubrace = (index: number, field: string, value: string | number) => {
    setSubraces(prev => prev.map((sr, i) => i === index ? { ...sr, [field]: value } : sr));
  };

  const updateSubraceTrait = (srIdx: number, tIdx: number, field: keyof TraitForm, value: string | number) => {
    setSubraces(prev => prev.map((sr, i) => 
      i === srIdx 
        ? { ...sr, traits: sr.traits.map((t, j) => j === tIdx ? { ...t, [field]: value } : t) }
        : sr
    ));
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
              <Input value={form.icon} onChange={(e) => updateField("icon", e.target.value)} className="w-16 text-center text-xl" maxLength={2} />
            </div>
            <div>
              <Label>Nome da Raça *</Label>
              <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Ex: Aasimar" required />
            </div>
          </div>

          {/* Size & Speed */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Tamanho</Label>
              <Select value={form.size} onValueChange={(v) => updateField("size", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((size) => (
                    <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Deslocamento</Label>
              <Input type="number" value={form.speed} onChange={(e) => updateField("speed", parseInt(e.target.value) || 30)} min={0} step={5} />
            </div>
            <div>
              <Label>Visão no Escuro</Label>
              <Input type="number" value={form.darkvision} onChange={(e) => updateField("darkvision", parseInt(e.target.value) || 0)} min={0} step={30} placeholder="0" />
            </div>
          </div>

          {/* Attribute Bonuses */}
          <div className="pt-2 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Bônus de Atributos</h4>
            <div className="grid grid-cols-3 gap-3">
              {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(attr => (
                <div key={attr}>
                  <Label className="text-xs capitalize">
                    {{ strength: 'Força', dexterity: 'Destreza', constitution: 'Constituição', intelligence: 'Inteligência', wisdom: 'Sabedoria', charisma: 'Carisma' }[attr]}
                  </Label>
                  <Input type="number" value={form[attr]} onChange={(e) => updateField(attr, parseInt(e.target.value) || 0)} min={-2} max={4} />
                </div>
              ))}
            </div>
          </div>

          {/* Proficiencies */}
          <div className="pt-2 border-t border-border space-y-3">
            <h4 className="text-sm font-medium">Proficiências Raciais</h4>
            <div>
              <Label className="text-xs">Armas (separadas por vírgula)</Label>
              <Input value={form.weapon_proficiencies} onChange={(e) => updateField("weapon_proficiencies", e.target.value)} placeholder="Ex: machado de batalha, martelo de guerra" />
            </div>
            <div>
              <Label className="text-xs">Perícias (separadas por vírgula)</Label>
              <Input value={form.skill_proficiencies} onChange={(e) => updateField("skill_proficiencies", e.target.value)} placeholder="Ex: percepção, furtividade" />
            </div>
          </div>

          {/* Languages */}
          <div>
            <Label>Idiomas (separados por vírgula)</Label>
            <Input value={form.languages} onChange={(e) => updateField("languages", e.target.value)} placeholder="Comum, Élfico" />
          </div>

          {/* Structured Traits */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Traços Raciais</h4>
              <Button type="button" variant="outline" size="sm" onClick={() => setTraits(prev => [...prev, { ...emptyTrait }])}>
                <Plus className="w-3 h-3 mr-1" /> Traço
              </Button>
            </div>
            <div className="space-y-3">
              {traits.map((trait, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input value={trait.name} onChange={(e) => updateTrait(idx, 'name', e.target.value)} placeholder="Nome do traço" className="flex-1" />
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => setTraits(prev => prev.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea value={trait.description} onChange={(e) => updateTrait(idx, 'description', e.target.value)} placeholder="Descrição do traço..." rows={2} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Proficiência em armas</Label>
                      <Input value={trait.weapon_proficiencies} onChange={(e) => updateTrait(idx, 'weapon_proficiencies', e.target.value)} placeholder="machado, martelo" className="text-xs h-8" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Proficiência em perícias</Label>
                      <Input value={trait.skill_proficiencies} onChange={(e) => updateTrait(idx, 'skill_proficiencies', e.target.value)} placeholder="percepção" className="text-xs h-8" />
                    </div>
                  </div>
                  <div className="w-1/2">
                    <Label className="text-[10px] text-muted-foreground">PV extra/nível</Label>
                    <Input type="number" value={trait.hp_bonus_per_level} onChange={(e) => updateTrait(idx, 'hp_bonus_per_level', parseInt(e.target.value) || 0)} min={0} max={5} className="text-xs h-8" />
                  </div>
                </div>
              ))}
              {traits.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhum traço adicionado. Clique em "+ Traço" acima.</p>
              )}
            </div>
          </div>

          {/* Subraces */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Sub-raças</h4>
              <Button type="button" variant="outline" size="sm" onClick={() => {
                setSubraces(prev => [...prev, { ...emptySubrace, id: crypto.randomUUID() }]);
                setExpandedSubrace(subraces.length);
              }}>
                <Plus className="w-3 h-3 mr-1" /> Sub-raça
              </Button>
            </div>
            <div className="space-y-3">
              {subraces.map((sr, srIdx) => (
                <Collapsible key={sr.id} open={expandedSubrace === srIdx} onOpenChange={(open) => setExpandedSubrace(open ? srIdx : null)}>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button type="button" className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                        <span className="font-medium text-sm">{sr.name || `Sub-raça ${srIdx + 1}`}</span>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); setSubraces(prev => prev.filter((_, i) => i !== srIdx)); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          {expandedSubrace === srIdx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Nome *</Label>
                            <Input value={sr.name} onChange={(e) => updateSubrace(srIdx, 'name', e.target.value)} placeholder="Ex: Anão da Colina" />
                          </div>
                          <div>
                            <Label className="text-xs">Descrição</Label>
                            <Input value={sr.description} onChange={(e) => updateSubrace(srIdx, 'description', e.target.value)} placeholder="Breve descrição" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Bônus de Atributos da Sub-raça</Label>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(attr => (
                              <div key={attr}>
                                <Label className="text-[10px]">
                                  {{ strength: 'FOR', dexterity: 'DES', constitution: 'CON', intelligence: 'INT', wisdom: 'SAB', charisma: 'CAR' }[attr]}
                                </Label>
                                <Input type="number" value={sr[attr]} onChange={(e) => updateSubrace(srIdx, attr, parseInt(e.target.value) || 0)} min={-2} max={4} className="h-8 text-xs" />
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Subrace Traits */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs font-medium">Traços da Sub-raça</Label>
                            <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => {
                              setSubraces(prev => prev.map((s, i) => i === srIdx ? { ...s, traits: [...s.traits, { ...emptyTrait }] } : s));
                            }}>
                              <Plus className="w-3 h-3 mr-1" /> Traço
                            </Button>
                          </div>
                          {sr.traits.map((trait, tIdx) => (
                            <div key={tIdx} className="p-2 rounded border border-border/50 bg-background space-y-1.5 mb-2">
                              <div className="flex items-center gap-2">
                                <Input value={trait.name} onChange={(e) => updateSubraceTrait(srIdx, tIdx, 'name', e.target.value)} placeholder="Nome do traço" className="flex-1 h-7 text-xs" />
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => {
                                  setSubraces(prev => prev.map((s, i) => i === srIdx ? { ...s, traits: s.traits.filter((_, j) => j !== tIdx) } : s));
                                }}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <Textarea value={trait.description} onChange={(e) => updateSubraceTrait(srIdx, tIdx, 'description', e.target.value)} placeholder="Descrição..." rows={2} className="text-xs" />
                              <div className="grid grid-cols-3 gap-1">
                                <div>
                                  <Label className="text-[9px] text-muted-foreground">Armas</Label>
                                  <Input value={trait.weapon_proficiencies} onChange={(e) => updateSubraceTrait(srIdx, tIdx, 'weapon_proficiencies', e.target.value)} className="text-[10px] h-6" />
                                </div>
                                <div>
                                  <Label className="text-[9px] text-muted-foreground">Perícias</Label>
                                  <Input value={trait.skill_proficiencies} onChange={(e) => updateSubraceTrait(srIdx, tIdx, 'skill_proficiencies', e.target.value)} className="text-[10px] h-6" />
                                </div>
                                <div>
                                  <Label className="text-[9px] text-muted-foreground">PV/nível</Label>
                                  <Input type="number" value={trait.hp_bonus_per_level} onChange={(e) => updateSubraceTrait(srIdx, tIdx, 'hp_bonus_per_level', parseInt(e.target.value) || 0)} min={0} className="text-[10px] h-6" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
              {subraces.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhuma sub-raça. Opcional — clique em "+ Sub-raça" para adicionar.</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Descrição *</Label>
            <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Descreva a origem, aparência e cultura desta raça..." rows={4} required />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-700" disabled={isLoading || !form.name || !form.description}>
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEditing ? "Salvando..." : "Criando..."}</>
            ) : (
              <><Users className="w-4 h-4 mr-2" />{isEditing ? "Salvar Alterações" : "Criar Raça"}</>
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
