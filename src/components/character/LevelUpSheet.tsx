import { useState, useMemo, useEffect, useCallback } from "react";
import { TrendingUp, Sparkles, Heart, Dices, Award, Check, Search, Gem, Plus, Minus, ChevronDown, Layers, Swords, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateCharacter, CharacterDB } from "@/hooks/useCharacters";
import { useHomebrew } from "@/hooks/useHomebrew";
import { getModifier, getAttributeName, CLASSES, RACES } from "@/data/srd";
import advancementData from "@/data/rules/avanco-personagem.json";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LevelUpSheetProps {
  character: CharacterDB;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CLASS_HIT_DICE: Record<string, { dice: string; avg: number }> = {
  Bárbaro: { dice: "d12", avg: 7 },
  Guerreiro: { dice: "d10", avg: 6 },
  Paladino: { dice: "d10", avg: 6 },
  Patrulheiro: { dice: "d10", avg: 6 },
  Bardo: { dice: "d8", avg: 5 },
  Clérigo: { dice: "d8", avg: 5 },
  Druida: { dice: "d8", avg: 5 },
  Monge: { dice: "d8", avg: 5 },
  Ladino: { dice: "d8", avg: 5 },
  Bruxo: { dice: "d8", avg: 5 },
  Feiticeiro: { dice: "d6", avg: 4 },
  Mago: { dice: "d6", avg: 4 },
};

// Feat levels (4, 8, 12, 16, 19 for most classes)
const FEAT_LEVELS = [4, 8, 12, 16, 19];

// Subclass unlock levels per class (D&D 5e SRD)
const SUBCLASS_LEVELS: Record<string, number> = {
  'Clérigo': 1,
  'Feiticeiro': 1,
  'Bruxo': 1,
  'Druida': 2,
  'Mago': 2,
  'Bárbaro': 3,
  'Bardo': 3,
  'Guerreiro': 3,
  'Ladino': 3,
  'Monge': 3,
  'Paladino': 3,
  'Patrulheiro': 3,
};

const ATTRIBUTES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;

// Standard feats from SRD with effects
const STANDARD_FEATS = [
  { id: "alert", name: "Alerta", description: "Bônus +5 na iniciativa e não pode ser surpreendido", effects: { initiative_bonus: 5 } },
  { id: "athlete", name: "Atleta", description: "Aumenta FOR ou DES em 1 e vantagens em acrobacias", effects: { attribute_choice: ['strength', 'dexterity'], attribute_bonus: 1 } },
  { id: "actor", name: "Ator", description: "Aumenta CAR em 1 e vantagem em disfarces", effects: { charisma: 1 } },
  { id: "charger", name: "Investidor", description: "Após Disparada, pode fazer ataque bônus", effects: {} },
  { id: "crossbow_expert", name: "Especialista em Besta", description: "Ignora recarga e penalidades de combate próximo", effects: {} },
  { id: "defensive_duelist", name: "Duelista Defensivo", description: "Reação para aumentar CA com arma de acuidade", effects: {} },
  { id: "dual_wielder", name: "Combatente com Duas Armas", description: "+1 CA e armas não-leves em ambas as mãos", effects: { ac_bonus: 1 } },
  { id: "dungeon_delver", name: "Explorador de Masmorras", description: "Vantagem em armadilhas e passagens secretas", effects: {} },
  { id: "durable", name: "Durão", description: "Aumenta CON em 1 e recupera mais HP em descansos", effects: { constitution: 1 } },
  { id: "grappler", name: "Lutador", description: "Vantagem em agarrar e pode restringir criaturas", effects: {} },
  { id: "great_weapon_master", name: "Mestre em Armas Grandes", description: "-5 ataque/+10 dano e ataque bônus ao derrubar", effects: {} },
  { id: "healer", name: "Curandeiro", description: "Kit de cura restaura 1d6+4+nível HP", effects: {} },
  { id: "heavily_armored", name: "Armadura Pesada", description: "Proficiência em armaduras pesadas e +1 FOR", effects: { strength: 1 } },
  { id: "inspiring_leader", name: "Líder Inspirador", description: "Concede HP temporário aos aliados", effects: {} },
  { id: "lucky", name: "Sortudo", description: "3 pontos de sorte para re-rolar d20s", effects: {} },
  { id: "mage_slayer", name: "Matador de Magos", description: "Reações contra conjuradores adjacentes", effects: {} },
  { id: "mobile", name: "Mobilidade", description: "+3m de deslocamento e esquiva após ataques", effects: { speed_bonus: 3 } },
  { id: "observant", name: "Observador", description: "+5 em percepção e investigação passivas, +1 INT ou SAB", effects: { passive_bonus: 5, attribute_choice: ['intelligence', 'wisdom'], attribute_bonus: 1 } },
  { id: "resilient", name: "Resiliente", description: "+1 em atributo e proficiência na salvaguarda", effects: { attribute_choice: ATTRIBUTES as unknown as string[], attribute_bonus: 1, saving_throw_proficiency: true } },
  { id: "sentinel", name: "Sentinela", description: "Reações de oportunidade param inimigos", effects: {} },
  { id: "sharpshooter", name: "Atirador Aguçado", description: "-5 ataque/+10 dano à distância", effects: {} },
  { id: "shield_master", name: "Mestre dos Escudos", description: "Empurrar com escudo e bônus em salvaguardas", effects: {} },
  { id: "skilled", name: "Habilidoso", description: "Proficiência em 3 perícias ou ferramentas", effects: {} },
  { id: "skulker", name: "Furtivo", description: "Pode se esconder com pouca obscuridade", effects: {} },
  { id: "spell_sniper", name: "Atirador Mágico", description: "Dobra alcance de ataques mágicos", effects: {} },
  { id: "tavern_brawler", name: "Brigão de Taverna", description: "Armas improvisadas e agarrar como bônus, +1 FOR ou CON", effects: { attribute_choice: ['strength', 'constitution'], attribute_bonus: 1 } },
  { id: "tough", name: "Robusto", description: "+2 HP por nível", effects: { hp_per_level: 2 } },
  { id: "war_caster", name: "Conjurador de Guerra", description: "Vantagem em concentração e magias como reação", effects: {} },
];

export function LevelUpSheet({ character, open, onOpenChange }: LevelUpSheetProps) {
  const updateCharacter = useUpdateCharacter();
  const [hpRoll, setHpRoll] = useState<number | null>(null);
  const [hasRolledHp, setHasRolledHp] = useState(false);
  const [useAverage, setUseAverage] = useState(false);
  const [selectedFeat, setSelectedFeat] = useState<string | null>(null);
  const [featSearch, setFeatSearch] = useState("");
  const [improvementChoice, setImprovementChoice] = useState<'feat' | 'attributes'>('feat');
  const [attributePoints, setAttributePoints] = useState<Record<string, number>>({});
  const [pointsRemaining, setPointsRemaining] = useState(2);
  const [selectedFeatAttribute, setSelectedFeatAttribute] = useState<string | null>(null);
  const [selectedSubclass, setSelectedSubclass] = useState<string | null>(null);
  const [selectedFeatureOptions, setSelectedFeatureOptions] = useState<Record<string, string>>({});
  const [selectedBonusSkills, setSelectedBonusSkills] = useState<string[]>([]);
  
  // Fetch homebrew feats and subclasses
  const { homebrewContent: homebrewFeats, isLoading: loadingFeats } = useHomebrew('feat');
  const { homebrewContent: homebrewSubclasses } = useHomebrew('subclass');

  const levels = advancementData.character_advancement.levels;
  const currentLevel = character.level;
  const nextLevel = Math.min(currentLevel + 1, 20);
  const currentLevelData = levels.find(l => l.level === currentLevel);
  const nextLevelData = levels.find(l => l.level === nextLevel);

  const xpForNext = nextLevelData?.xp_required || 0;
  const canLevelUp = (character.experience >= xpForNext || currentLevel < 20) && currentLevel < 20;
  
  // Check if next level grants a feat/ability score improvement
  const grantsFeat = FEAT_LEVELS.includes(nextLevel);

  // Check if next level unlocks subclass selection
  const subclassLevel = SUBCLASS_LEVELS[character.class] || 3;
  const classDataForSubclass = CLASSES.find(c => c.name === character.class);
  
  const characterFeatures = (character.features as any[]) || [];
  const hasExistingSubclass = useMemo(() => {
    return characterFeatures.some(f => f.source === 'Subclasse');
  }, [characterFeatures]);

  const showSubclassSelection = nextLevel === subclassLevel && !hasExistingSubclass;

  const availableSubclasses = useMemo(() => {
    const srdSubs = (classDataForSubclass?.subclasses as any[] || []).map((sc: any) => ({
      id: sc.id,
      name: sc.name,
      description: sc.description || '',
      features: sc.features || [],
      isSRD: true,
    }));
    
    const homebrewSubs = homebrewSubclasses
      .filter(sub => {
        const subData = sub.data as any;
        const parentClass = subData?.parent_class?.toLowerCase();
        const classId = classDataForSubclass?.id?.toLowerCase();
        const className = character.class.toLowerCase();
        return parentClass === className ||
               parentClass === classId ||
               subData?.parentClassId === classDataForSubclass?.id;
      })
      .map(sub => ({
        id: sub.id,
        name: sub.name,
        description: sub.description || '',
        features: (sub.data as any)?.features || [],
        isSRD: false,
      }));
    
    return [...srdSubs, ...homebrewSubs];
  }, [classDataForSubclass, homebrewSubclasses, character.class]);

  // Get class features for the next level (auto-granted + features with options)
  const classLevelFeatures = useMemo(() => {
    const classInfo = CLASSES.find(c => c.name === character.class) as any;
    if (!classInfo) return { autoFeatures: [] as any[], optionFeatures: [] as any[] };
    
    const levelData = (classInfo.levels || []).find((l: any) => l.level === nextLevel);
    if (!levelData) return { autoFeatures: [] as any[], optionFeatures: [] as any[] };
    
    const featureIds: string[] = levelData.features || [];
    const allFeatureDefs = classInfo.features || [];
    
    // Known subclass marker IDs that should not be auto-added
    const subclassMarkers = new Set([
      'martial_archetype', 'primal_path', 'arcane_tradition', 'bard_college',
      'divine_domain', 'druid_circle', 'monastic_tradition', 'sacred_oath',
      'ranger_archetype', 'roguish_archetype', 'sorcerous_origin', 'otherworldly_patron',
    ]);
    
    const autoFeatures: any[] = [];
    const optionFeatures: any[] = [];
    
    featureIds.forEach((fId: string) => {
      if (fId === 'ability_score_improvement') return;
      if (subclassMarkers.has(fId)) return;
      // Skip subclass feature markers (e.g., martial_archetype_feature)
      if (fId.endsWith('_feature') && Array.from(subclassMarkers).some(m => fId.startsWith(m.replace(/_/g, '_')))) return;
      // More general: skip any ID ending in _feature that references a subclass marker prefix
      const isSubclassFeatureMarker = Array.from(subclassMarkers).some(marker => {
        const prefix = marker.replace(/^(.*?)$/, '$1');
        return fId === `${prefix}_feature`;
      });
      if (isSubclassFeatureMarker) return;
      
      const featureDef = allFeatureDefs.find((f: any) => f.id === fId);
      if (!featureDef) return;
      
      if (featureDef.options && Array.isArray(featureDef.options) && featureDef.options.length > 0) {
        optionFeatures.push(featureDef);
      } else {
        autoFeatures.push(featureDef);
      }
    });
    
    return { autoFeatures, optionFeatures };
  }, [character.class, nextLevel]);

  // Get higher-level subclass features (when character already has a subclass)
  const higherLevelSubclassFeatures = useMemo(() => {
    if (showSubclassSelection) return []; // Don't add during initial subclass selection
    if (!hasExistingSubclass) return [];
    
    const subclassFeature = characterFeatures.find(f => f.source === 'Subclasse');
    if (!subclassFeature?.subclass_id) return [];
    
    const subclassId = subclassFeature.subclass_id;
    const subclassName = subclassFeature.subclass_name || '';
    
    // Check SRD subclasses
    const classInfo = CLASSES.find(c => c.name === character.class) as any;
    if (!classInfo) return [];
    
    const srdSubclass = (classInfo.subclasses || []).find((sc: any) => sc.id === subclassId);
    let features: any[] = [];
    
    if (srdSubclass) {
      features = (srdSubclass.features || []).filter((f: any) => f.level === nextLevel);
    } else {
      // Check homebrew subclasses
      const hwSub = homebrewSubclasses.find(s => s.id === subclassId);
      if (hwSub) {
        const subData = hwSub.data as any;
        features = (subData?.features || []).filter((f: any) => f.level === nextLevel);
      }
    }
    
    return features.map((f: any) => ({
      ...f,
      subclass_id: subclassId,
      subclass_name: subclassName || srdSubclass?.name || '',
    }));
  }, [showSubclassSelection, hasExistingSubclass, characterFeatures, character.class, nextLevel, homebrewSubclasses]);

  // Get bonus proficiencies from subclass for this level
  const subclassBonusProficiencies = useMemo(() => {
    // Check if the selected or existing subclass has bonus proficiencies for this level
    let subclassData: any = null;

    if (showSubclassSelection && selectedSubclass) {
      // Check from newly selected subclass
      const hwSub = homebrewSubclasses.find(s => s.id === selectedSubclass);
      if (hwSub) {
        subclassData = hwSub.data as any;
      }
      // SRD subclasses don't have bonus_proficiencies in data
    } else if (hasExistingSubclass) {
      const subclassFeature = characterFeatures.find(f => f.source === 'Subclasse');
      if (subclassFeature?.subclass_id) {
        const hwSub = homebrewSubclasses.find(s => s.id === subclassFeature.subclass_id);
        if (hwSub) {
          subclassData = hwSub.data as any;
        }
      }
    }

    if (!subclassData?.bonus_proficiencies) return null;
    const bp = (subclassData.bonus_proficiencies as any[]).find((bp: any) => bp.level === nextLevel);
    if (!bp || !bp.from?.length || !bp.choose) return null;

    // Filter out skills the character already has
    const existingSkills = (character.skills as any[]) || [];
    const existingSkillNames = existingSkills
      .filter((s: any) => s.proficient)
      .map((s: any) => s.name);
    const availableSkills = (bp.from as string[]).filter(s => !existingSkillNames.includes(s));

    return { choose: bp.choose, from: availableSkills };
  }, [showSubclassSelection, selectedSubclass, hasExistingSubclass, characterFeatures, homebrewSubclasses, nextLevel, character.skills]);
  
  // Filter feats by search
  const filteredFeats = useMemo(() => {
    const allFeats = [
      ...homebrewFeats.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description || '',
        isHomebrew: true,
        icon: f.icon,
        effects: (f.data as any)?.effects || {},
      })),
      ...STANDARD_FEATS.map(f => ({ ...f, isHomebrew: false })),
    ];
    
    if (!featSearch) return allFeats;
    return allFeats.filter(f => 
      f.name.toLowerCase().includes(featSearch.toLowerCase())
    );
  }, [homebrewFeats, featSearch]);

  // Get the currently selected feat's data
  const selectedFeatData = useMemo(() => {
    if (!selectedFeat) return null;
    return filteredFeats.find(f => f.name === selectedFeat) || null;
  }, [selectedFeat, filteredFeats]);

  // Check if selected feat requires attribute choice
  const featRequiresAttributeChoice = useMemo(() => {
    if (!selectedFeatData?.effects) return false;
    const effects = selectedFeatData.effects as any;
    return effects.attribute_choice && Array.isArray(effects.attribute_choice) && effects.attribute_choice.length > 0;
  }, [selectedFeatData]);

  // Get attribute choices for selected feat
  const featAttributeChoices = useMemo(() => {
    if (!selectedFeatData?.effects) return [];
    const effects = selectedFeatData.effects as any;
    return effects.attribute_choice || [];
  }, [selectedFeatData]);

  // Get attribute bonus for selected feat
  const featAttributeBonus = useMemo(() => {
    if (!selectedFeatData?.effects) return 0;
    const effects = selectedFeatData.effects as any;
    return effects.attribute_bonus || 0;
  }, [selectedFeatData]);

  // Reset attribute selection when feat changes
  useEffect(() => {
    setSelectedFeatAttribute(null);
  }, [selectedFeat]);

  const classData = CLASS_HIT_DICE[character.class] || { dice: "d8", avg: 5 };
  const conMod = Math.floor((((character.attributes as any)?.constitution || 10) - 10) / 2);

  // Calculate HP bonus from race (e.g., Hill Dwarf)
  const raceHpBonus = useMemo(() => {
    const race = RACES.find(r => r.name === character.race);
    if (!race) return 0;
    
    // Check subrace for HP bonus
    if (character.subrace && race.subraces) {
      const subrace = race.subraces.find(s => s.name === character.subrace);
      if (subrace?.traits) {
        const hpTrait = subrace.traits.find(t => (t.mechanical as any)?.hp_bonus_per_level);
        if (hpTrait) {
          return (hpTrait.mechanical as any).hp_bonus_per_level || 0;
        }
      }
    }
    return 0;
  }, [character.race, character.subrace]);

  // Calculate HP bonus from feats (e.g., Tough)
  const featHpBonus = useMemo(() => {
    const features = (character.features as any[]) || [];
    let bonus = 0;
    features.forEach(f => {
      const feat = STANDARD_FEATS.find(sf => sf.name === f.name);
      if (feat?.effects?.hp_per_level) {
        bonus += feat.effects.hp_per_level;
      }
    });
    return bonus;
  }, [character.features]);

  const rollHitDie = () => {
    if (hasRolledHp) return; // Prevent re-rolling
    const diceValue = parseInt(classData.dice.replace("d", ""));
    const roll = Math.floor(Math.random() * diceValue) + 1;
    setHpRoll(roll);
    setHasRolledHp(true);
    setUseAverage(false);
  };

  const selectAverage = () => {
    setHpRoll(classData.avg);
    setUseAverage(true);
    setHasRolledHp(true);
  };

  const calculateHpGain = () => {
    if (hpRoll === null) return 0;
    // Base HP + CON mod + race bonus + feat bonus
    return Math.max(1, hpRoll + conMod + raceHpBonus + featHpBonus);
  };

  const handleAttributeChange = (attr: string, delta: number) => {
    const currentBonus = attributePoints[attr] || 0;
    const currentAttrValue = ((character.attributes as any)?.[attr] || 10) + currentBonus;
    
    if (delta > 0) {
      // Adding a point
      if (pointsRemaining <= 0) return;
      if (currentAttrValue >= 20) return; // Can't go above 20
      if (currentBonus >= 2) return; // Max 2 points in one attribute
      
      setAttributePoints(prev => ({ ...prev, [attr]: currentBonus + 1 }));
      setPointsRemaining(prev => prev - 1);
    } else {
      // Removing a point
      if (currentBonus <= 0) return;
      
      setAttributePoints(prev => ({ ...prev, [attr]: currentBonus - 1 }));
      setPointsRemaining(prev => prev + 1);
    }
  };

  const handleLevelUp = async () => {
    if (hpRoll === null) {
      toast.error('Escolha como calcular o HP primeiro');
      return;
    }
    
    if (showSubclassSelection && !selectedSubclass) {
      toast.error('Selecione uma subclasse');
      return;
    }

    // Validate features with options (e.g., fighting style)
    const unselectedOptions = classLevelFeatures.optionFeatures.filter(
      f => !selectedFeatureOptions[f.id]
    );
    if (unselectedOptions.length > 0) {
      toast.error(`Selecione uma opção para: ${unselectedOptions.map(f => f.name).join(', ')}`);
      return;
    }

    // Validate bonus proficiency selections
    if (subclassBonusProficiencies && selectedBonusSkills.length < subclassBonusProficiencies.choose) {
      toast.error(`Selecione ${subclassBonusProficiencies.choose} perícia(s) bônus da subclasse`);
      return;

    }
    if (grantsFeat) {
      if (improvementChoice === 'feat' && !selectedFeat) {
        toast.error('Selecione um talento');
        return;
      }
      if (improvementChoice === 'feat' && featRequiresAttributeChoice && !selectedFeatAttribute) {
        toast.error('Selecione o atributo para o bônus do talento');
        return;
      }
      if (improvementChoice === 'attributes' && pointsRemaining > 0) {
        toast.error('Distribua todos os pontos de atributo');
        return;
      }
    }

    const hpGain = calculateHpGain();
    const newProficiencyBonus = nextLevelData?.proficiency_bonus || character.proficiency_bonus;
    
    // Get existing features and add the selected feat
    const existingFeatures = (character.features as any[]) || [];
    let updatedFeatures = [...existingFeatures];

    // Add subclass features for this level
    if (showSubclassSelection && selectedSubclass) {
      const chosenSubclass = availableSubclasses.find(sc => sc.id === selectedSubclass);
      if (chosenSubclass) {
        const levelFeatures = chosenSubclass.features.filter((f: any) => f.level === nextLevel);
        levelFeatures.forEach((f: any) => {
          updatedFeatures.push({
            name: f.name,
            source: 'Subclasse',
            subclass_id: selectedSubclass,
            subclass_name: chosenSubclass.name,
            level: f.level,
            description: f.description_markdown || f.description || '',
          });
        });
      }
    }

    // Auto-add class features for this level
    classLevelFeatures.autoFeatures.forEach((f: any) => {
      updatedFeatures.push({
        id: f.id,
        name: f.name,
        source: character.class,
        level: nextLevel,
        description: f.description_markdown || '',
        mechanical: f.mechanical || {},
      });
    });

    // Add features with selected options (e.g., fighting style)
    classLevelFeatures.optionFeatures.forEach((f: any) => {
      const selectedOptionId = selectedFeatureOptions[f.id];
      if (selectedOptionId) {
        const selectedOption = f.options.find((o: any) => o.id === selectedOptionId);
        if (selectedOption) {
          updatedFeatures.push({
            id: f.id,
            name: `${f.name}: ${selectedOption.name}`,
            source: character.class,
            level: nextLevel,
            description: selectedOption.description_markdown || '',
            mechanical: selectedOption.mechanical || {},
            selected_option: selectedOptionId,
          });
        }
      }
    });

    // Add higher-level subclass features
    higherLevelSubclassFeatures.forEach((f: any) => {
      updatedFeatures.push({
        name: f.name,
        source: 'Subclasse',
        subclass_id: f.subclass_id,
        subclass_name: f.subclass_name,
        level: nextLevel,
        description: f.description_markdown || f.description || '',
        mechanical: f.mechanical || {},
      });
    });
    
    if (grantsFeat && improvementChoice === 'feat' && selectedFeat) {
      updatedFeatures.push({ 
        name: selectedFeat, 
        source: 'Talento', 
        level: nextLevel,
        description: STANDARD_FEATS.find(f => f.name === selectedFeat)?.description || 
                     homebrewFeats.find(f => f.name === selectedFeat)?.description || ''
      });
    }

    // Calculate new attributes
    let newAttributes = { ...(character.attributes as any) };
    
    if (grantsFeat && improvementChoice === 'attributes') {
      Object.entries(attributePoints).forEach(([attr, bonus]) => {
        if (bonus > 0) {
          newAttributes[attr] = Math.min(20, (newAttributes[attr] || 10) + bonus);
        }
      });
    }

    // Apply feat effects
    if (grantsFeat && improvementChoice === 'feat' && selectedFeat) {
      const feat = STANDARD_FEATS.find(f => f.name === selectedFeat);
      if (feat?.effects) {
        // Apply direct attribute bonuses (e.g., Ator +1 CAR, Durão +1 CON)
        ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(attr => {
          if ((feat.effects as any)[attr]) {
            newAttributes[attr] = Math.min(20, (newAttributes[attr] || 10) + (feat.effects as any)[attr]);
          }
        });
        
        // Apply chosen attribute bonus (e.g., Atleta: escolhe FOR ou DES)
        if (selectedFeatAttribute && (feat.effects as any).attribute_bonus) {
          const bonus = (feat.effects as any).attribute_bonus;
          newAttributes[selectedFeatAttribute] = Math.min(20, (newAttributes[selectedFeatAttribute] || 10) + bonus);
        }
      }
    }

    // Calculate new max HP including Tough feat bonus
    let totalHpGain = hpGain;
    if (grantsFeat && improvementChoice === 'feat' && selectedFeat === 'Robusto') {
      // Tough gives +2 HP per level, so we add retroactive HP for all previous levels
      totalHpGain += 2 * currentLevel; // Previous levels
    }

    // Recalculate CON modifier if constitution changed
    const newConMod = Math.floor((newAttributes.constitution - 10) / 2);
    const conModDiff = newConMod - conMod;
    const retroactiveHpFromCon = conModDiff * currentLevel;

    // Apply bonus proficiency skills from subclass
    let updatedSkills = [...((character.skills as any[]) || [])];
    if (subclassBonusProficiencies && selectedBonusSkills.length > 0) {
      selectedBonusSkills.forEach(skillName => {
        const existingIdx = updatedSkills.findIndex((s: any) => s.name === skillName);
        if (existingIdx >= 0) {
          updatedSkills[existingIdx] = { ...updatedSkills[existingIdx], proficient: true };
        } else {
          updatedSkills.push({ name: skillName, proficient: true, bonus: 0 });
        }
      });
    }

    await updateCharacter.mutateAsync({
      id: character.id,
      level: nextLevel,
      max_hp: character.max_hp + totalHpGain + retroactiveHpFromCon,
      current_hp: character.current_hp + totalHpGain + retroactiveHpFromCon,
      proficiency_bonus: newProficiencyBonus,
      features: updatedFeatures,
      attributes: newAttributes,
      skills: updatedSkills,
      initiative: Math.floor((newAttributes.dexterity - 10) / 2),
      hit_dice: {
        ...(character.hit_dice as any),
        total: nextLevel,
        current: ((character.hit_dice as any)?.current || currentLevel) + 1,
      },
    });

    // Reset state
    setHpRoll(null);
    setHasRolledHp(false);
    setSelectedFeat(null);
    setSelectedFeatAttribute(null);
    setSelectedSubclass(null);
    setImprovementChoice('feat');
    setAttributePoints({});
    setPointsRemaining(2);
    setSelectedBonusSkills([]);
    toast.success(`Subiu para o nível ${nextLevel}!`);
    onOpenChange(false);
  };

  // Reset state when opening
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setHpRoll(null);
      setHasRolledHp(false);
      setSelectedFeat(null);
      setSelectedFeatAttribute(null);
      setSelectedSubclass(null);
      setImprovementChoice('feat');
      setAttributePoints({});
      setPointsRemaining(2);
      setSelectedFeatureOptions({});
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] bg-darker">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Subir de Nível
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-full py-4">
          <div className="space-y-6 pb-24">
            {/* Current Status */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nível Atual</p>
                  <p className="text-3xl font-bold">{currentLevel}</p>
                </div>
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-yellow-500">→ Nível {nextLevel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Experiência</p>
                  <p className="text-xl font-semibold">{character.experience} XP</p>
                </div>
              </div>
            </div>

            {currentLevel >= 20 ? (
              <div className="glass rounded-xl p-8 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                <p className="text-lg font-semibold">Nível Máximo!</p>
                <p className="text-sm text-muted-foreground">
                  Você alcançou o nível 20, o máximo possível.
                </p>
              </div>
            ) : (
              <>
                {/* Level Up Preview */}
                <div className="glass rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Nível {nextLevel}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Bônus de Proficiência</p>
                      <p className="text-xl font-bold text-primary">+{nextLevelData?.proficiency_bonus}</p>
                      {nextLevelData?.proficiency_bonus !== currentLevelData?.proficiency_bonus && (
                        <Badge className="mt-1 bg-green-500/20 text-green-400 text-xs">Aumentou!</Badge>
                      )}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Dados de Vida</p>
                      <p className="text-xl font-bold">{nextLevel}{classData.dice}</p>
                    </div>
                  </div>
                </div>

                {/* HP Roll */}
                <div className="glass rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Pontos de Vida Adicionais
                  </h3>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className={cn("flex-1", hasRolledHp && !useAverage && "border-primary bg-primary/10")}
                        onClick={rollHitDie}
                        disabled={hasRolledHp}
                      >
                        <Dices className="w-4 h-4 mr-2" />
                        {hasRolledHp && !useAverage ? `Rolou: ${hpRoll}` : `Rolar ${classData.dice}`}
                      </Button>
                      <Button
                        variant="outline"
                        className={cn("flex-1", useAverage && "border-primary bg-primary/10")}
                        onClick={selectAverage}
                        disabled={hasRolledHp && !useAverage}
                      >
                        Usar Média ({classData.avg})
                      </Button>
                    </div>

                    {hpRoll !== null && (
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">
                          {useAverage ? "Valor Médio" : "Resultado da Rolagem"}
                        </p>
                        <p className="text-3xl font-bold text-primary">{hpRoll}</p>
                        <div className="text-sm text-muted-foreground mt-2 space-y-1">
                          <p>
                            + {conMod >= 0 ? conMod : conMod} (CON)
                            {raceHpBonus > 0 && <span> + {raceHpBonus} ({character.subrace})</span>}
                            {featHpBonus > 0 && <span> + {featHpBonus} (Talentos)</span>}
                          </p>
                          <p className="text-foreground font-bold text-lg">
                            = +{calculateHpGain()} HP
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Class Features for this Level */}
                {(classLevelFeatures.autoFeatures.length > 0 || classLevelFeatures.optionFeatures.length > 0 || higherLevelSubclassFeatures.length > 0) && (
                  <div className="glass rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Swords className="w-4 h-4 text-primary" />
                      Novas Habilidades — Nível {nextLevel}
                    </h3>
                    
                    <div className="space-y-3">
                      {/* Auto-granted features */}
                      {classLevelFeatures.autoFeatures.map((f: any) => (
                        <div key={f.id} className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-semibold">{f.name}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              Auto
                            </Badge>
                          </div>
                          {f.description_markdown && (
                            <p className="text-xs text-muted-foreground ml-6 line-clamp-3">
                              {f.description_markdown.replace(/\*\*/g, '')}
                            </p>
                          )}
                        </div>
                      ))}

                      {/* Higher-level subclass features */}
                      {higherLevelSubclassFeatures.map((f: any, idx: number) => (
                        <div key={`sub-${idx}`} className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Check className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-semibold">{f.name}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/50 text-amber-500">
                              {f.subclass_name || 'Subclasse'}
                            </Badge>
                          </div>
                          {(f.description_markdown || f.description) && (
                            <p className="text-xs text-muted-foreground ml-6 line-clamp-3">
                              {(f.description_markdown || f.description || '').replace(/\*\*/g, '')}
                            </p>
                          )}
                        </div>
                      ))}

                      {/* Features with options (e.g., Fighting Style) */}
                      {classLevelFeatures.optionFeatures.map((f: any) => (
                        <div key={f.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">{f.name}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/50 text-primary">
                              Escolha
                            </Badge>
                          </div>
                          {f.description_markdown && (
                            <p className="text-xs text-muted-foreground ml-6">
                              {f.description_markdown.replace(/\*\*/g, '')}
                            </p>
                          )}
                          <div className="space-y-2 ml-2">
                            {(f.options || []).map((option: any) => (
                              <button
                                key={option.id}
                                onClick={() => setSelectedFeatureOptions(prev => ({ ...prev, [f.id]: option.id }))}
                                className={cn(
                                  "w-full p-3 rounded-lg border text-left transition-all",
                                  selectedFeatureOptions[f.id] === option.id
                                    ? "border-primary bg-primary/10"
                                    : "bg-muted/50 hover:bg-muted border-transparent"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                    selectedFeatureOptions[f.id] === option.id
                                      ? "border-primary bg-primary"
                                      : "border-muted-foreground"
                                  )}>
                                    {selectedFeatureOptions[f.id] === option.id && (
                                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium">{option.name}</span>
                                </div>
                                {option.description_markdown && (
                                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                                    {option.description_markdown.replace(/\*\*/g, '')}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feat / Ability Score Improvement - Only show if level grants one */}
                {grantsFeat && (
                  <div className="glass rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      Melhoria de Nível {nextLevel}
                    </h3>

                    {/* Choice between Feat or Attribute Points */}
                    <RadioGroup
                      value={improvementChoice}
                      onValueChange={(value) => {
                        setImprovementChoice(value as 'feat' | 'attributes');
                        setSelectedFeat(null);
                        setAttributePoints({});
                        setPointsRemaining(2);
                      }}
                      className="mb-4"
                    >
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="feat" id="feat" />
                          <Label htmlFor="feat" className="cursor-pointer">Escolher Talento</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="attributes" id="attributes" />
                          <Label htmlFor="attributes" className="cursor-pointer">+2 Pontos de Atributo</Label>
                        </div>
                      </div>
                    </RadioGroup>

                    {improvementChoice === 'feat' ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar talento..."
                            value={featSearch}
                            onChange={(e) => setFeatSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>

                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2">
                            {filteredFeats.map((feat) => (
                              <button
                                key={feat.id}
                                onClick={() => setSelectedFeat(feat.name)}
                                className={cn(
                                  "w-full p-3 rounded-lg text-left transition-all flex items-start gap-3",
                                  selectedFeat === feat.name
                                    ? feat.isHomebrew 
                                      ? "bg-amber-500/20 border border-amber-500/50"
                                      : "bg-primary/20 border border-primary/50"
                                    : "bg-muted/50 hover:bg-muted"
                                )}
                              >
                                <div className={cn(
                                  "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                                  selectedFeat === feat.name
                                    ? feat.isHomebrew 
                                      ? "border-amber-500 bg-amber-500"
                                      : "border-primary bg-primary"
                                    : "border-muted-foreground"
                                )}>
                                  {selectedFeat === feat.name && (
                                    <Check className="w-3 h-3 text-primary-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {feat.isHomebrew && (
                                      <Gem className="w-3 h-3 text-amber-500" />
                                    )}
                                    <span className="text-sm font-medium">{feat.name}</span>
                                    {feat.isHomebrew && (
                                      <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500">
                                        Homebrew
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {feat.description}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>

                        {selectedFeat && (
                          <div className="space-y-3">
                            <div className="bg-primary/10 rounded-lg p-3 border border-primary/30">
                              <p className="text-sm">
                                <span className="text-muted-foreground">Talento selecionado: </span>
                                <span className="font-semibold text-primary">{selectedFeat}</span>
                              </p>
                            </div>
                            
                            {/* Attribute choice for feats that require it */}
                            {featRequiresAttributeChoice && (
                              <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
                                <Label className="text-sm text-amber-400 mb-2 block">
                                  Escolha o atributo para +{featAttributeBonus}:
                                </Label>
                                <Select
                                  value={selectedFeatAttribute || ""}
                                  onValueChange={setSelectedFeatAttribute}
                                >
                                  <SelectTrigger className="bg-background/50">
                                    <SelectValue placeholder="Selecione um atributo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {featAttributeChoices.map((attr: string) => (
                                      <SelectItem key={attr} value={attr}>
                                        {getAttributeName(attr)} ({((character.attributes as any)?.[attr] || 10)} → {Math.min(20, ((character.attributes as any)?.[attr] || 10) + featAttributeBonus)})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {selectedFeatAttribute && (
                                  <p className="text-xs text-green-400 mt-2">
                                    +{featAttributeBonus} {getAttributeName(selectedFeatAttribute)} será aplicado
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center mb-4">
                          <Badge variant={pointsRemaining === 0 ? "default" : "secondary"} className="text-sm">
                            Pontos restantes: {pointsRemaining}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {ATTRIBUTES.map((attr) => {
                            const currentValue = ((character.attributes as any)?.[attr] || 10) + (attributePoints[attr] || 0);
                            const bonus = attributePoints[attr] || 0;
                            
                            return (
                              <div key={attr} className="bg-muted/50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium">{getAttributeName(attr)}</span>
                                  <span className={cn(
                                    "text-lg font-bold",
                                    bonus > 0 && "text-green-500"
                                  )}>
                                    {currentValue}
                                    {bonus > 0 && <span className="text-xs ml-1">(+{bonus})</span>}
                                  </span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleAttributeChange(attr, -1)}
                                    disabled={bonus <= 0}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleAttributeChange(attr, 1)}
                                    disabled={pointsRemaining <= 0 || currentValue >= 20 || bonus >= 2}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {Object.entries(attributePoints).filter(([_, v]) => v > 0).length > 0 && (
                          <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                            <p className="text-sm text-green-400">
                              <span className="font-medium">Aumentos: </span>
                              {Object.entries(attributePoints)
                                .filter(([_, v]) => v > 0)
                                .map(([attr, v]) => `${getAttributeName(attr)} +${v}`)
                                .join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Subclass Selection */}
                {showSubclassSelection && availableSubclasses.length > 0 && (
                  <div className="glass rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      Escolha de Subclasse — Nível {nextLevel}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      No nível {subclassLevel}, você deve escolher uma especialização para seu {character.class}.
                    </p>
                    <div className="space-y-2">
                      {availableSubclasses.map((subclass) => {
                        const levelFeatures = subclass.features.filter((f: any) => f.level === nextLevel);
                        return (
                          <button
                            key={subclass.id}
                            onClick={() => setSelectedSubclass(subclass.id)}
                            className={cn(
                              "w-full p-3 rounded-lg border text-left transition-all",
                              selectedSubclass === subclass.id
                                ? subclass.isSRD
                                  ? "border-primary bg-primary/10"
                                  : "border-amber-500 bg-amber-500/10"
                                : "bg-muted/50 hover:bg-muted border-transparent"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
                                selectedSubclass === subclass.id
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground"
                              )}>
                                {selectedSubclass === subclass.id && (
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                )}
                              </div>
                              <span className="text-sm font-semibold">{subclass.name}</span>
                              {!subclass.isSRD && (
                                <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500">
                                  Homebrew
                                </Badge>
                              )}
                            </div>
                            {subclass.description && (
                              <p className="text-xs text-muted-foreground mt-1 ml-7 line-clamp-2">
                                {subclass.description}
                              </p>
                            )}
                            {selectedSubclass === subclass.id && levelFeatures.length > 0 && (
                              <div className="mt-2 ml-7 space-y-1">
                                <p className="text-xs font-medium text-primary">Habilidades no nível {nextLevel}:</p>
                                {levelFeatures.map((f: any, idx: number) => (
                                  <div key={idx} className="text-xs text-muted-foreground bg-background/50 rounded p-2">
                                    <span className="font-medium text-foreground">{f.name}</span>
                                    {f.description_markdown && (
                                      <p className="mt-0.5 line-clamp-3">{f.description_markdown.replace(/\*\*/g, '')}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Confirm */}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={
                    hpRoll === null || 
                    updateCharacter.isPending || 
                    (showSubclassSelection && !selectedSubclass) ||
                    (grantsFeat && improvementChoice === 'feat' && !selectedFeat) ||
                    (grantsFeat && improvementChoice === 'feat' && featRequiresAttributeChoice && !selectedFeatAttribute) ||
                    (grantsFeat && improvementChoice === 'attributes' && pointsRemaining > 0) ||
                    classLevelFeatures.optionFeatures.some(f => !selectedFeatureOptions[f.id])
                  }
                  onClick={handleLevelUp}
                >
                  {updateCharacter.isPending ? "Subindo de nível..." : `Confirmar Level Up para Nível ${nextLevel}`}
                </Button>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
