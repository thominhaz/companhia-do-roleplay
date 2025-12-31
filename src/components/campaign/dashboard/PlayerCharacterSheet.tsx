import { useState, useEffect, useMemo } from "react";
import { 
  Heart,
  Shield,
  Zap,
  Footprints,
  Swords,
  BookOpen,
  Backpack,
  User,
  Sparkles,
  ChevronDown,
  ChevronRight,
  X
} from "lucide-react";
import { useCharacter } from "@/hooks/useCharacters";
import { getModifier, getAttributeAbbr } from "@/data/srd";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const ATTRIBUTES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;

const ATTR_NAMES: Record<string, string> = {
  strength: 'Força',
  dexterity: 'Destreza',
  constitution: 'Constituição',
  intelligence: 'Inteligência',
  wisdom: 'Sabedoria',
  charisma: 'Carisma'
};

const SKILLS = [
  { id: 'acrobatics', name: 'Acrobacia', attr: 'dexterity' },
  { id: 'animal_handling', name: 'Lidar com Animais', attr: 'wisdom' },
  { id: 'arcana', name: 'Arcanismo', attr: 'intelligence' },
  { id: 'athletics', name: 'Atletismo', attr: 'strength' },
  { id: 'deception', name: 'Enganação', attr: 'charisma' },
  { id: 'history', name: 'História', attr: 'intelligence' },
  { id: 'insight', name: 'Intuição', attr: 'wisdom' },
  { id: 'intimidation', name: 'Intimidação', attr: 'charisma' },
  { id: 'investigation', name: 'Investigação', attr: 'intelligence' },
  { id: 'medicine', name: 'Medicina', attr: 'wisdom' },
  { id: 'nature', name: 'Natureza', attr: 'intelligence' },
  { id: 'perception', name: 'Percepção', attr: 'wisdom' },
  { id: 'performance', name: 'Atuação', attr: 'charisma' },
  { id: 'persuasion', name: 'Persuasão', attr: 'charisma' },
  { id: 'religion', name: 'Religião', attr: 'intelligence' },
  { id: 'sleight_of_hand', name: 'Prestidigitação', attr: 'dexterity' },
  { id: 'stealth', name: 'Furtividade', attr: 'dexterity' },
  { id: 'survival', name: 'Sobrevivência', attr: 'wisdom' },
];

const SPELL_SCHOOLS: Record<string, { name: string; color: string }> = {
  abjuration: { name: "Abjuração", color: "bg-blue-500/20 text-blue-400" },
  conjuration: { name: "Conjuração", color: "bg-yellow-500/20 text-yellow-400" },
  divination: { name: "Adivinhação", color: "bg-cyan-500/20 text-cyan-400" },
  enchantment: { name: "Encantamento", color: "bg-pink-500/20 text-pink-400" },
  evocation: { name: "Evocação", color: "bg-red-500/20 text-red-400" },
  illusion: { name: "Ilusão", color: "bg-purple-500/20 text-purple-400" },
  necromancy: { name: "Necromancia", color: "bg-green-500/20 text-green-400" },
  transmutation: { name: "Transmutação", color: "bg-orange-500/20 text-orange-400" },
};

interface SpellData {
  name: string;
  originalName: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialDescription?: string;
  };
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevels: string | null;
  classes: string[];
}

interface PlayerCharacterSheetProps {
  characterId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerCharacterSheet({ characterId, open, onOpenChange }: PlayerCharacterSheetProps) {
  const { data: character, isLoading } = useCharacter(characterId);
  const [activeTab, setActiveTab] = useState('atributos');
  const [allSpellsData, setAllSpellsData] = useState<SpellData[]>([]);
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);

  // Load spells data
  useEffect(() => {
    const loadSpells = async () => {
      try {
        const mod = await import("@/data/spells/magias.json");
        setAllSpellsData(mod.default as SpellData[]);
      } catch (error) {
        console.error("Error loading spells:", error);
      }
    };
    if (open) {
      loadSpells();
    }
  }, [open]);

  // Map character spells to full spell data
  const characterSpellsWithData = useMemo(() => {
    const raw = (character?.spells as any[]) ?? [];
    const charSpells = Array.isArray(raw) ? raw : [];

    return charSpells
      .filter((spell) => {
        if (typeof spell === "string") return spell.trim().length > 0;
        return !!spell && typeof spell === "object" && typeof (spell as any).name === "string";
      })
      .map((spell: any) => {
        const spellName: string = typeof spell === "string" ? spell : spell.name;
        const normalized = spellName.toLowerCase();

        const fullData = allSpellsData.find(
          (s) =>
            s.name.toLowerCase() === normalized ||
            s.originalName?.toLowerCase() === normalized
        );

        return {
          id: spellName,
          fullData,
          displayName: fullData?.name || spellName,
        };
      });
  }, [character?.spells, allSpellsData]);

  if (!open) return null;

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!character) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Personagem não encontrado</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const attributes = character.attributes as Record<string, number>;
  const rawSkills = character.skills as Record<string, { proficient?: boolean; expertise?: boolean } | boolean>;
  const inventory = character.inventory as any[];
  const equipment = character.equipment as any;
  const currency = character.currency as { gold?: number; silver?: number; copper?: number };

  const hpPercentage = (character.current_hp / character.max_hp) * 100;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              {character.image_url ? (
                <img 
                  src={character.image_url} 
                  alt={character.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold">{character.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {character.race} • {character.class} Nv.{character.level}
                </p>
                {character.background && (
                  <Badge variant="outline" className="mt-1">{character.background}</Badge>
                )}
              </div>
            </div>

            {/* Combat Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-card rounded-xl p-3 text-center border border-border">
                <Heart className="w-4 h-4 mx-auto mb-1 text-red-500" />
                <div className="text-lg font-bold">{character.current_hp}/{character.max_hp}</div>
                <div className="text-xs text-muted-foreground">HP</div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      hpPercentage > 50 ? 'bg-green-500' : 
                      hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
                  />
                </div>
              </div>
              <div className="bg-card rounded-xl p-3 text-center border border-border">
                <Shield className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                <div className="text-lg font-bold">{character.armor_class}</div>
                <div className="text-xs text-muted-foreground">CA</div>
              </div>
              <div className="bg-card rounded-xl p-3 text-center border border-border">
                <Zap className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                <div className="text-lg font-bold">{character.initiative >= 0 ? '+' : ''}{character.initiative}</div>
                <div className="text-xs text-muted-foreground">Inic.</div>
              </div>
              <div className="bg-card rounded-xl p-3 text-center border border-border">
                <Footprints className="w-4 h-4 mx-auto mb-1 text-green-500" />
                <div className="text-lg font-bold">{character.speed}m</div>
                <div className="text-xs text-muted-foreground">Veloc.</div>
              </div>
            </div>

            {/* Conditions */}
            {character.conditions && character.conditions.length > 0 && (
              <div className="bg-destructive/10 rounded-xl p-3 border border-destructive/30">
                <p className="text-xs text-destructive font-medium mb-2">Condições Ativas</p>
                <div className="flex flex-wrap gap-1">
                  {character.conditions.map((condition, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">{condition}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-auto p-1">
                <TabsTrigger value="atributos" className="text-xs py-2">
                  <User className="w-3 h-3 mr-1" />
                  Atrib.
                </TabsTrigger>
                <TabsTrigger value="combate" className="text-xs py-2">
                  <Swords className="w-3 h-3 mr-1" />
                  Comb.
                </TabsTrigger>
                <TabsTrigger value="magias" className="text-xs py-2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Magias
                </TabsTrigger>
                <TabsTrigger value="inventario" className="text-xs py-2">
                  <Backpack className="w-3 h-3 mr-1" />
                  Inv.
                </TabsTrigger>
              </TabsList>

              {/* Atributos Tab */}
              <TabsContent value="atributos" className="mt-4 space-y-4">
                {/* Attributes Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {ATTRIBUTES.map(attr => {
                    const value = attributes[attr] || 10;
                    const mod = getModifier(value);
                    return (
                      <div key={attr} className="bg-muted/50 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold">{mod >= 0 ? '+' : ''}{mod}</div>
                        <div className="text-xs text-muted-foreground">{ATTR_NAMES[attr]}</div>
                        <div className="text-xs text-primary mt-1">({value})</div>
                      </div>
                    );
                  })}
                </div>

                {/* Skills */}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold mb-3">Perícias</h3>
                  <div className="space-y-1">
                    {SKILLS.map(skill => {
                      const attrValue = attributes[skill.attr] || 10;
                      const mod = getModifier(attrValue);
                      const skillData = rawSkills[skill.id];
                      const isProficient = typeof skillData === 'boolean' ? skillData : skillData?.proficient;
                      const hasExpertise = typeof skillData === 'object' && skillData?.expertise;
                      const bonus = isProficient ? (hasExpertise ? character.proficiency_bonus * 2 : character.proficiency_bonus) : 0;
                      const total = mod + bonus;
                      
                      if (!isProficient && !hasExpertise) return null;
                      
                      return (
                        <div key={skill.id} className={`flex items-center justify-between py-1.5 px-2 rounded ${
                          hasExpertise ? 'bg-yellow-500/10' : 'bg-primary/10'
                        }`}>
                          <span className="text-sm">{skill.name}</span>
                          <span className={`font-bold ${hasExpertise ? 'text-yellow-400' : 'text-primary'}`}>
                            {total >= 0 ? '+' : ''}{total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Languages */}
                {character.languages && (character.languages as string[]).length > 0 && (
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <h3 className="font-semibold mb-2">Idiomas</h3>
                    <div className="flex flex-wrap gap-1">
                      {(character.languages as string[]).map((lang, i) => (
                        <Badge key={i} variant="secondary">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Combate Tab */}
              <TabsContent value="combate" className="mt-4 space-y-4">
                {/* Equipped Weapons */}
                {equipment?.weapons && equipment.weapons.length > 0 && (
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Swords className="w-4 h-4" />
                      Armas Equipadas
                    </h3>
                    <div className="space-y-2">
                      {equipment.weapons.map((weapon: any, i: number) => (
                        <div key={i} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{weapon.name}</span>
                            <Badge variant="outline">{weapon.damage}</Badge>
                          </div>
                          {weapon.properties && (
                            <p className="text-xs text-muted-foreground mt-1">{weapon.properties}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipped Armor */}
                {equipment?.armor && equipment.armor.length > 0 && (
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Armaduras
                    </h3>
                    <div className="space-y-2">
                      {equipment.armor.map((armor: any, i: number) => (
                        <div key={i} className="bg-muted/50 rounded-lg p-3">
                          <span className="font-medium">{armor.name}</span>
                          {armor.ac && (
                            <Badge variant="outline" className="ml-2">CA {armor.ac}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proficiency */}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bônus de Proficiência</span>
                    <span className="text-xl font-bold text-primary">+{character.proficiency_bonus}</span>
                  </div>
                </div>
              </TabsContent>

              {/* Magias Tab */}
              <TabsContent value="magias" className="mt-4 space-y-4">
                {characterSpellsWithData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma magia conhecida</p>
                  </div>
                ) : (
                  <>
                    {/* Cantrips */}
                    {characterSpellsWithData.filter(s => s.fullData?.level === 0).length > 0 && (
                      <div className="bg-card rounded-xl p-4 border border-border">
                        <h3 className="font-semibold mb-3">Truques</h3>
                        <div className="space-y-2">
                          {characterSpellsWithData
                            .filter(s => s.fullData?.level === 0)
                            .map(spell => (
                              <div 
                                key={spell.id} 
                                className="bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted"
                                onClick={() => setExpandedSpell(expandedSpell === spell.id ? null : spell.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{spell.displayName}</span>
                                  {expandedSpell === spell.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </div>
                                {expandedSpell === spell.id && spell.fullData && (
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    <p>{spell.fullData.description}</p>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      <Badge variant="outline">{spell.fullData.castingTime}</Badge>
                                      <Badge variant="outline">{spell.fullData.range}</Badge>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Leveled Spells */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
                      const spellsAtLevel = characterSpellsWithData.filter(s => s.fullData?.level === level);
                      if (spellsAtLevel.length === 0) return null;
                      return (
                        <div key={level} className="bg-card rounded-xl p-4 border border-border">
                          <h3 className="font-semibold mb-3">Nível {level}</h3>
                          <div className="space-y-2">
                            {spellsAtLevel.map(spell => (
                              <div 
                                key={spell.id} 
                                className="bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted"
                                onClick={() => setExpandedSpell(expandedSpell === spell.id ? null : spell.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{spell.displayName}</span>
                                    {spell.fullData?.concentration && (
                                      <Badge variant="secondary" className="text-xs">C</Badge>
                                    )}
                                    {spell.fullData?.ritual && (
                                      <Badge variant="secondary" className="text-xs">R</Badge>
                                    )}
                                  </div>
                                  {expandedSpell === spell.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </div>
                                {expandedSpell === spell.id && spell.fullData && (
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    <p>{spell.fullData.description}</p>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      <Badge variant="outline">{spell.fullData.castingTime}</Badge>
                                      <Badge variant="outline">{spell.fullData.range}</Badge>
                                      <Badge variant="outline">{spell.fullData.duration}</Badge>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </TabsContent>

              {/* Inventário Tab */}
              <TabsContent value="inventario" className="mt-4 space-y-4">
                {/* Currency */}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold mb-3">Moedas</h3>
                  <div className="flex gap-4 justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-500">{currency?.gold || 0}</div>
                      <div className="text-xs text-muted-foreground">Ouro</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-400">{currency?.silver || 0}</div>
                      <div className="text-xs text-muted-foreground">Prata</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{currency?.copper || 0}</div>
                      <div className="text-xs text-muted-foreground">Cobre</div>
                    </div>
                  </div>
                </div>

                {/* Inventory Items */}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-semibold mb-3">Itens ({inventory?.length || 0})</h3>
                  {inventory && inventory.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {inventory.map((item: any, i: number) => (
                        <div key={i} className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.quantity > 1 && (
                              <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                            )}
                          </div>
                          {item.rarity && (
                            <Badge variant="outline" className="text-xs">{item.rarity}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Inventário vazio</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
