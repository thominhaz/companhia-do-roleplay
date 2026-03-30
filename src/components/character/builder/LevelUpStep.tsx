import { useState, useMemo, useEffect, useCallback } from 'react';
import { TrendingUp, Sparkles, Heart, Dices, Award, Check, Search, Gem, Plus, Minus, Swords, Shield, Layers, GitBranch, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useHomebrew } from '@/hooks/useHomebrew';
import { getModifier, getAttributeName, CLASSES, RACES } from '@/data/srd';
import advancementData from '@/data/rules/avanco-personagem.json';
import { cn } from '@/lib/utils';
import { useBuilderContext } from './BuilderContext';
import type { LevelChoice } from '@/hooks/useCharacters';
import {
  checkMulticlassPrerequisites,
  getMulticlassProficiencies,
  getClassNamePt,
  getClassLevelCount,
  getDistinctClasses,
  getSubclassLevelForClass,
} from '@/lib/multiclassUtils';

interface LevelUpStepProps {
  level: number;
}

const CLASS_HIT_DICE: Record<string, { dice: string; avg: number; die: number }> = {
  barbaro: { dice: 'd12', avg: 7, die: 12 },
  bardo: { dice: 'd8', avg: 5, die: 8 },
  bruxo: { dice: 'd8', avg: 5, die: 8 },
  clerigo: { dice: 'd8', avg: 5, die: 8 },
  druida: { dice: 'd8', avg: 5, die: 8 },
  feiticeiro: { dice: 'd6', avg: 4, die: 6 },
  guerreiro: { dice: 'd10', avg: 6, die: 10 },
  ladino: { dice: 'd8', avg: 5, die: 8 },
  mago: { dice: 'd6', avg: 4, die: 6 },
  monge: { dice: 'd8', avg: 5, die: 8 },
  paladino: { dice: 'd10', avg: 6, die: 10 },
  patrulheiro: { dice: 'd10', avg: 6, die: 10 },
};

// Also map Portuguese class names for legacy data
const CLASS_HIT_DICE_PT: Record<string, { dice: string; avg: number; die: number }> = {
  'Bárbaro': { dice: 'd12', avg: 7, die: 12 },
  'Guerreiro': { dice: 'd10', avg: 6, die: 10 },
  'Paladino': { dice: 'd10', avg: 6, die: 10 },
  'Patrulheiro': { dice: 'd10', avg: 6, die: 10 },
  'Bardo': { dice: 'd8', avg: 5, die: 8 },
  'Clérigo': { dice: 'd8', avg: 5, die: 8 },
  'Druida': { dice: 'd8', avg: 5, die: 8 },
  'Monge': { dice: 'd8', avg: 5, die: 8 },
  'Ladino': { dice: 'd8', avg: 5, die: 8 },
  'Bruxo': { dice: 'd8', avg: 5, die: 8 },
  'Feiticeiro': { dice: 'd6', avg: 4, die: 6 },
  'Mago': { dice: 'd6', avg: 4, die: 6 },
};

const FEAT_LEVELS = [4, 8, 12, 16, 19];

const SUBCLASS_LEVELS: Record<string, number> = {
  clerigo: 1, feiticeiro: 1, bruxo: 1,
  druida: 2, mago: 2,
  barbaro: 3, bardo: 3, guerreiro: 3, ladino: 3,
  monge: 3, paladino: 3, patrulheiro: 3,
};

const ATTRIBUTES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;

const ATTRIBUTE_NAMES: Record<string, string> = {
  strength: 'Força', dexterity: 'Destreza', constitution: 'Constituição',
  intelligence: 'Inteligência', wisdom: 'Sabedoria', charisma: 'Carisma',
};

const STANDARD_FEATS = [
  { id: 'alert', name: 'Alerta', description: 'Bônus +5 na iniciativa e não pode ser surpreendido', effects: { initiative_bonus: 5 } },
  { id: 'athlete', name: 'Atleta', description: 'Aumenta FOR ou DES em 1 e vantagens em acrobacias', effects: { attribute_choice: ['strength', 'dexterity'], attribute_bonus: 1 } },
  { id: 'actor', name: 'Ator', description: 'Aumenta CAR em 1 e vantagem em disfarces', effects: { charisma: 1 } },
  { id: 'charger', name: 'Investidor', description: 'Após Disparada, pode fazer ataque bônus', effects: {} },
  { id: 'crossbow_expert', name: 'Especialista em Besta', description: 'Ignora recarga e penalidades de combate próximo', effects: {} },
  { id: 'defensive_duelist', name: 'Duelista Defensivo', description: 'Reação para aumentar CA com arma de acuidade', effects: {} },
  { id: 'dual_wielder', name: 'Combatente com Duas Armas', description: '+1 CA e armas não-leves em ambas as mãos', effects: { ac_bonus: 1 } },
  { id: 'dungeon_delver', name: 'Explorador de Masmorras', description: 'Vantagem em armadilhas e passagens secretas', effects: {} },
  { id: 'durable', name: 'Durão', description: 'Aumenta CON em 1 e recupera mais HP em descansos', effects: { constitution: 1 } },
  { id: 'grappler', name: 'Lutador', description: 'Vantagem em agarrar e pode restringir criaturas', effects: {} },
  { id: 'great_weapon_master', name: 'Mestre em Armas Grandes', description: '-5 ataque/+10 dano e ataque bônus ao derrubar', effects: {} },
  { id: 'healer', name: 'Curandeiro', description: 'Kit de cura restaura 1d6+4+nível HP', effects: {} },
  { id: 'heavily_armored', name: 'Armadura Pesada', description: 'Proficiência em armaduras pesadas e +1 FOR', effects: { strength: 1 } },
  { id: 'inspiring_leader', name: 'Líder Inspirador', description: 'Concede HP temporário aos aliados', effects: {} },
  { id: 'lucky', name: 'Sortudo', description: '3 pontos de sorte para re-rolar d20s', effects: {} },
  { id: 'mage_slayer', name: 'Matador de Magos', description: 'Reações contra conjuradores adjacentes', effects: {} },
  { id: 'mobile', name: 'Mobilidade', description: '+3m de deslocamento e esquiva após ataques', effects: { speed_bonus: 3 } },
  { id: 'observant', name: 'Observador', description: '+5 em percepção e investigação passivas, +1 INT ou SAB', effects: { passive_bonus: 5, attribute_choice: ['intelligence', 'wisdom'], attribute_bonus: 1 } },
  { id: 'resilient', name: 'Resiliente', description: '+1 em atributo e proficiência na salvaguarda', effects: { attribute_choice: ATTRIBUTES as unknown as string[], attribute_bonus: 1, saving_throw_proficiency: true } },
  { id: 'sentinel', name: 'Sentinela', description: 'Reações de oportunidade param inimigos', effects: {} },
  { id: 'sharpshooter', name: 'Atirador Aguçado', description: '-5 ataque/+10 dano à distância', effects: {} },
  { id: 'shield_master', name: 'Mestre dos Escudos', description: 'Empurrar com escudo e bônus em salvaguardas', effects: {} },
  { id: 'skilled', name: 'Habilidoso', description: 'Proficiência em 3 perícias ou ferramentas', effects: {} },
  { id: 'skulker', name: 'Furtivo', description: 'Pode se esconder com pouca obscuridade', effects: {} },
  { id: 'spell_sniper', name: 'Atirador Mágico', description: 'Dobra alcance de ataques mágicos', effects: {} },
  { id: 'tavern_brawler', name: 'Brigão de Taverna', description: 'Armas improvisadas e agarrar como bônus, +1 FOR ou CON', effects: { attribute_choice: ['strength', 'constitution'], attribute_bonus: 1 } },
  { id: 'tough', name: 'Robusto', description: '+2 HP por nível', effects: { hp_per_level: 2 } },
  { id: 'war_caster', name: 'Conjurador de Guerra', description: 'Vantagem em concentração e magias como reação', effects: {} },
];

export function LevelUpStep({ level }: LevelUpStepProps) {
  const { builderData, levelChoices, updateLevelChoice, getComputedAttributes } = useBuilderContext();
  const { homebrewContent: homebrewFeats } = useHomebrew('feat');
  const { homebrewContent: homebrewSubclasses } = useHomebrew('subclass');

  // Determine the class for THIS level (multiclass support)
  const levelChoice = levelChoices.find(lc => lc.level === level);
  const selectedClassForLevel = levelChoice?.class_id || builderData.class_id || '';

  const classData = CLASS_HIT_DICE[selectedClassForLevel] || CLASS_HIT_DICE_PT[selectedClassForLevel] || { dice: 'd8', avg: 5, die: 8 };
  const classInfo = CLASSES.find(c => c.id === selectedClassForLevel || c.name === selectedClassForLevel);
  const className = classInfo?.name || getClassNamePt(selectedClassForLevel) || selectedClassForLevel;

  // Multiclass: available classes for this level
  const primaryClassId = builderData.class_id || '';
  const attrs = getComputedAttributes();

  const [showClassSelector, setShowClassSelector] = useState(false);

  const availableClassesForMulticlass = useMemo(() => {
    if (level <= 1) return [];
    return CLASSES.map(cls => {
      const prereq = checkMulticlassPrerequisites(
        cls.id,
        getDistinctClasses(levelChoices.filter(lc => lc.level < level)),
        attrs
      );
      return {
        id: cls.id,
        name: cls.name,
        hitDie: cls.hit_die,
        prerequisitesMet: prereq.met,
        missingPrerequisites: prereq.missing,
        proficienciesGained: getMulticlassProficiencies(cls.id),
        isCurrentPrimary: cls.id === primaryClassId,
        currentLevels: getClassLevelCount(levelChoices.filter(lc => lc.level < level), cls.id),
      };
    });
  }, [level, levelChoices, attrs, primaryClassId]);

  const isMulticlassing = selectedClassForLevel !== primaryClassId && level > 1;

  // Subclass: needs to check class-level for the selected class, not total level
  const classLevelInSelectedClass = useMemo(() => {
    const previousLevels = levelChoices.filter(lc => lc.level < level && lc.class_id === selectedClassForLevel).length;
    return previousLevels + 1; // +1 for this level
  }, [levelChoices, level, selectedClassForLevel]);

  const subclassLevel = getSubclassLevelForClass(selectedClassForLevel);
  const showSubclassSelection = classLevelInSelectedClass === subclassLevel && (level > 1 || subclassLevel === 1);
  const [selectedSubclass, setSelectedSubclass] = useState<string | null>(levelChoice?.subclass_id || null);

  // Check if subclass was already chosen for this class in a previous level
  const existingSubclassForClass = useMemo(() => {
    return levelChoices.find(
      lc => lc.class_id === selectedClassForLevel && lc.subclass_id && lc.level < level
    )?.subclass_id;
  }, [levelChoices, selectedClassForLevel, level]);

  const levels = advancementData.character_advancement.levels;
  const levelData = levels.find(l => l.level === level);
  const prevLevelData = levels.find(l => l.level === level - 1);

  // Computed attributes for CON modifier
  const conMod = getModifier(attrs.constitution || 10);

  // HP state
  const [hasRolledHp, setHasRolledHp] = useState(!!levelChoice?.hp_roll && level > 1);

  // Feat/ASI: based on CLASS level in that class, not total level
  const grantsFeat = FEAT_LEVELS.includes(classLevelInSelectedClass);
  const [improvementChoice, setImprovementChoice] = useState<'feat' | 'attributes'>(
    levelChoice?.improvement_choice || 'feat'
  );
  const [attributePoints, setAttributePoints] = useState<Record<string, number>>(
    levelChoice?.attribute_improvements || {}
  );
  const [pointsRemaining, setPointsRemaining] = useState(() => {
    const used = Object.values(levelChoice?.attribute_improvements || {}).reduce((a, b) => a + b, 0);
    return 2 - used;
  });
  const [selectedFeat, setSelectedFeat] = useState<string | null>(levelChoice?.selected_feat || null);
  const [selectedFeatAttribute, setSelectedFeatAttribute] = useState<string | null>(levelChoice?.feat_attribute || null);
  const [featSearch, setFeatSearch] = useState('');

  // Feature options (e.g. fighting style)
  const [selectedFeatureOptions, setSelectedFeatureOptions] = useState<Record<string, string>>(
    levelChoice?.feature_options || {}
  );

  // Available subclasses for the selected class
  const availableSubclasses = useMemo(() => {
    if (!showSubclassSelection || !classInfo) return [];
    const srdSubs = ((classInfo as any).subclasses || []).map((sc: any) => ({
      id: sc.id, name: sc.name, description: sc.description || '',
      features: sc.features || [], isSRD: true,
    }));
    const hwSubs = homebrewSubclasses
      .filter(sub => {
        const subData = sub.data as any;
        const parentClass = subData?.parent_class?.toLowerCase();
        return parentClass === selectedClassForLevel.toLowerCase() ||
               parentClass === className.toLowerCase() ||
               subData?.parentClassId === selectedClassForLevel;
      })
      .map(sub => ({
        id: sub.id, name: sub.name, description: sub.description || '',
        features: (sub.data as any)?.features || [], isSRD: false,
      }));
    return [...srdSubs, ...hwSubs];
  }, [showSubclassSelection, classInfo, selectedClassForLevel, className, homebrewSubclasses]);

  // Class features for this CLASS level (not total level)
  const classLevelFeatures = useMemo(() => {
    if (!classInfo) return { autoFeatures: [] as any[], optionFeatures: [] as any[] };
    const cInfo = classInfo as any;
    // Use classLevelInSelectedClass for multiclass — features are based on class level, not total level
    const ld = (cInfo.levels || []).find((l: any) => l.level === classLevelInSelectedClass);
    if (!ld) return { autoFeatures: [] as any[], optionFeatures: [] as any[] };

    const featureIds: string[] = ld.features || [];
    const allFeatureDefs = cInfo.features || [];
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
      const isSubMarker = Array.from(subclassMarkers).some(m => fId === `${m}_feature`);
      if (isSubMarker) return;

      const featureDef = allFeatureDefs.find((f: any) => f.id === fId);
      if (!featureDef) return;

      if (featureDef.options?.length > 0) {
        optionFeatures.push(featureDef);
      } else {
        autoFeatures.push(featureDef);
      }
    });

    return { autoFeatures, optionFeatures };
  }, [classInfo, classLevelInSelectedClass]);

  // Subclass features for higher levels
  const higherLevelSubclassFeatures = useMemo(() => {
    if (showSubclassSelection) return [];
    // Find existing subclass for THIS class from earlier level choices
    const existingSub = levelChoices.find(
      lc => lc.subclass_id && lc.class_id === selectedClassForLevel && lc.level < level
    );
    if (!existingSub?.subclass_id) return [];

    const cInfo = classInfo as any;
    const srdSub = (cInfo?.subclasses || []).find((sc: any) => sc.id === existingSub.subclass_id);
    let features: any[] = [];

    if (srdSub) {
      features = (srdSub.features || []).filter((f: any) => f.level === classLevelInSelectedClass);
    } else {
      const hwSub = homebrewSubclasses.find(s => s.id === existingSub.subclass_id);
      if (hwSub) {
        features = ((hwSub.data as any)?.features || []).filter((f: any) => f.level === classLevelInSelectedClass);
      }
    }
    return features;
  }, [showSubclassSelection, levelChoices, level, selectedClassForLevel, classLevelInSelectedClass, classInfo, homebrewSubclasses]);

  // Feats list
  const filteredFeats = useMemo(() => {
    const all = [
      ...homebrewFeats.map(f => ({
        id: f.id, name: f.name, description: f.description || '',
        isHomebrew: true, effects: (f.data as any)?.effects || {},
      })),
      ...STANDARD_FEATS.map(f => ({ ...f, isHomebrew: false })),
    ];
    if (!featSearch) return all;
    return all.filter(f => f.name.toLowerCase().includes(featSearch.toLowerCase()));
  }, [homebrewFeats, featSearch]);

  const selectedFeatData = useMemo(() => {
    if (!selectedFeat) return null;
    return filteredFeats.find(f => f.name === selectedFeat) || null;
  }, [selectedFeat, filteredFeats]);

  const featRequiresAttributeChoice = useMemo(() => {
    if (!selectedFeatData?.effects) return false;
    const e = selectedFeatData.effects as any;
    return e.attribute_choice?.length > 0;
  }, [selectedFeatData]);

  const featAttributeChoices = useMemo(() => {
    return (selectedFeatData?.effects as any)?.attribute_choice || [];
  }, [selectedFeatData]);

  const featAttributeBonus = useMemo(() => {
    return (selectedFeatData?.effects as any)?.attribute_bonus || 0;
  }, [selectedFeatData]);

  // Sync local state → BuilderContext
  const syncToContext = useCallback(() => {
    const updates: Partial<LevelChoice> = {
      class_id: selectedClassForLevel,
    };

    if (grantsFeat) {
      updates.improvement_choice = improvementChoice;
      if (improvementChoice === 'feat') {
        updates.selected_feat = selectedFeat || undefined;
        updates.feat_attribute = selectedFeatAttribute || undefined;
        updates.attribute_improvements = undefined;
      } else {
        updates.attribute_improvements = attributePoints;
        updates.selected_feat = undefined;
        updates.feat_attribute = undefined;
      }
    }

    if (showSubclassSelection && selectedSubclass) {
      updates.subclass_id = selectedSubclass;
    }

    if (Object.keys(selectedFeatureOptions).length > 0) {
      updates.feature_options = selectedFeatureOptions;
    }

    // Multiclass proficiencies
    if (isMulticlassing && classLevelInSelectedClass === 1) {
      updates.multiclass_proficiencies = [getMulticlassProficiencies(selectedClassForLevel)];
    }

    updateLevelChoice(level, updates);
  }, [level, selectedClassForLevel, grantsFeat, improvementChoice, selectedFeat, selectedFeatAttribute,
      attributePoints, showSubclassSelection, selectedSubclass, selectedFeatureOptions,
      isMulticlassing, classLevelInSelectedClass, updateLevelChoice]);

  // Auto-sync on changes
  useEffect(() => {
    syncToContext();
  }, [syncToContext]);

  // HP handlers
  const rollHitDie = () => {
    if (hasRolledHp) return;
    const roll = Math.floor(Math.random() * classData.die) + 1;
    updateLevelChoice(level, { hp_roll: roll, used_average: false });
    setHasRolledHp(true);
  };

  const selectAverage = () => {
    updateLevelChoice(level, { hp_roll: classData.avg, used_average: true });
    setHasRolledHp(true);
  };

  const hpRoll = levelChoice?.hp_roll || 0;
  const hpGain = level === 1 ? classData.die + conMod : Math.max(1, hpRoll + conMod);

  const handleAttributeChange = (attr: string, delta: number) => {
    const currentBonus = attributePoints[attr] || 0;
    const currentAttrValue = (attrs[attr] || 10);

    if (delta > 0) {
      if (pointsRemaining <= 0) return;
      if (currentAttrValue + currentBonus >= 20) return;
      if (currentBonus >= 2) return;
      const newPoints = { ...attributePoints, [attr]: currentBonus + 1 };
      setAttributePoints(newPoints);
      setPointsRemaining(prev => prev - 1);
    } else {
      if (currentBonus <= 0) return;
      const newPoints = { ...attributePoints, [attr]: currentBonus - 1 };
      setAttributePoints(newPoints);
      setPointsRemaining(prev => prev + 1);
    }
  };

  // Is this the first level? Show different UI
  if (level === 1) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">1</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Nível 1 — {className}</h3>
            <p className="text-sm text-muted-foreground">
              HP máximo do dado de vida + modificador de CON
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-muted/30 border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">HP no Nível 1</p>
              <p className="text-2xl font-bold text-primary">{hpGain}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{classData.die} (dado máx) + {conMod} (CON)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-lg font-bold text-primary">{level}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Nível {level} — {className}</h3>
          <p className="text-sm text-muted-foreground">
            Bônus de Proficiência: +{levelData?.proficiency_bonus || 2}
            {levelData?.proficiency_bonus !== prevLevelData?.proficiency_bonus && (
              <Badge className="ml-2 bg-green-500/20 text-green-400 text-[10px]">Aumentou!</Badge>
            )}
          </p>
        </div>
      </div>

      {/* HP Roll */}
      <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-4">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          Pontos de Vida
        </h4>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className={cn('flex-1', hasRolledHp && !levelChoice?.used_average && 'border-primary bg-primary/10')}
            onClick={rollHitDie}
            disabled={hasRolledHp}
          >
            <Dices className="w-4 h-4 mr-2" />
            {hasRolledHp && !levelChoice?.used_average ? `Rolou: ${hpRoll}` : `Rolar ${classData.dice}`}
          </Button>
          <Button
            variant="outline"
            className={cn('flex-1', levelChoice?.used_average && 'border-primary bg-primary/10')}
            onClick={selectAverage}
            disabled={hasRolledHp && !levelChoice?.used_average}
          >
            Usar Média ({classData.avg})
          </Button>
        </div>

        {hasRolledHp && (
          <div className="bg-card rounded-lg p-4 text-center border border-border">
            <p className="text-xs text-muted-foreground mb-1">
              {levelChoice?.used_average ? 'Valor Médio' : 'Resultado da Rolagem'}
            </p>
            <p className="text-3xl font-bold text-primary">{hpRoll}</p>
            <p className="text-sm text-muted-foreground mt-2">
              + {conMod} (CON) = <span className="font-bold text-foreground">+{hpGain} HP</span>
            </p>
          </div>
        )}
      </div>

      {/* Class Features */}
      {(classLevelFeatures.autoFeatures.length > 0 || classLevelFeatures.optionFeatures.length > 0 || higherLevelSubclassFeatures.length > 0) && (
        <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" />
            Novas Habilidades
          </h4>

          {classLevelFeatures.autoFeatures.map((f: any) => (
            <div key={f.id} className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold">{f.name}</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">Auto</Badge>
              </div>
              {f.description_markdown && (
                <p className="text-xs text-muted-foreground ml-6 line-clamp-3">
                  {f.description_markdown.replace(/\*\*/g, '')}
                </p>
              )}
            </div>
          ))}

          {higherLevelSubclassFeatures.map((f: any, idx: number) => (
            <div key={`sub-${idx}`} className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold">{f.name}</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/50 text-amber-500">
                  Subclasse
                </Badge>
              </div>
              {(f.description_markdown || f.description) && (
                <p className="text-xs text-muted-foreground ml-6 line-clamp-3">
                  {(f.description_markdown || f.description || '').replace(/\*\*/g, '')}
                </p>
              )}
            </div>
          ))}

          {classLevelFeatures.optionFeatures.map((f: any) => (
            <div key={f.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{f.name}</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/50 text-primary">Escolha</Badge>
              </div>
              <div className="space-y-2 ml-2">
                {(f.options || []).map((option: any) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedFeatureOptions(prev => ({ ...prev, [f.id]: option.id }))}
                    className={cn(
                      'w-full p-3 rounded-lg border text-left transition-all',
                      selectedFeatureOptions[f.id] === option.id
                        ? 'border-primary bg-primary/10'
                        : 'bg-card hover:bg-muted border-border'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                        selectedFeatureOptions[f.id] === option.id
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
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
      )}

      {/* Subclass Selection */}
      {showSubclassSelection && availableSubclasses.length > 0 && (
        <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            Escolha de Subclasse
            {!selectedSubclass && (
              <Badge variant="outline" className="text-[9px] border-destructive text-destructive">Obrigatório</Badge>
            )}
          </h4>

          <div className="space-y-2">
            {availableSubclasses.map(sub => (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSubclass(sub.id);
                  updateLevelChoice(level, { subclass_id: sub.id });
                }}
                className={cn(
                  'w-full p-3 rounded-lg border text-left transition-all',
                  selectedSubclass === sub.id
                    ? sub.isSRD ? 'border-secondary bg-secondary/10' : 'border-amber-500 bg-amber-500/10'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{sub.name}</span>
                  <Badge variant="outline" className={cn(
                    'text-[9px] px-1.5 py-0',
                    sub.isSRD ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  )}>
                    {sub.isSRD ? 'SRD 5.1' : 'Homebrew'}
                  </Badge>
                  {selectedSubclass === sub.id && <Check className="w-4 h-4 text-primary" />}
                </div>
                {sub.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sub.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feat / ASI */}
      {grantsFeat && (
        <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" />
            Melhoria de Nível {level}
          </h4>

          <RadioGroup
            value={improvementChoice}
            onValueChange={(value) => {
              setImprovementChoice(value as 'feat' | 'attributes');
              setSelectedFeat(null);
              setAttributePoints({});
              setPointsRemaining(2);
            }}
          >
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feat" id={`feat-${level}`} />
                <Label htmlFor={`feat-${level}`} className="cursor-pointer">Escolher Talento</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="attributes" id={`attrs-${level}`} />
                <Label htmlFor={`attrs-${level}`} className="cursor-pointer">+2 Pontos de Atributo</Label>
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
                <div className="space-y-2 pr-3">
                  {filteredFeats.map(feat => (
                    <button
                      key={feat.id}
                      onClick={() => setSelectedFeat(feat.name)}
                      className={cn(
                        'w-full p-3 rounded-lg text-left transition-all flex items-start gap-3',
                        selectedFeat === feat.name
                          ? feat.isHomebrew
                            ? 'bg-amber-500/20 border border-amber-500/50'
                            : 'bg-primary/20 border border-primary/50'
                          : 'bg-card hover:bg-muted border border-border'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5',
                        selectedFeat === feat.name
                          ? feat.isHomebrew ? 'border-amber-500 bg-amber-500' : 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      )}>
                        {selectedFeat === feat.name && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {feat.isHomebrew && <Gem className="w-3 h-3 text-amber-500" />}
                          <span className="text-sm font-medium">{feat.name}</span>
                          {feat.isHomebrew && (
                            <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500">Homebrew</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feat.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {selectedFeat && featRequiresAttributeChoice && (
                <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
                  <Label className="text-sm text-amber-400 mb-2 block">
                    Escolha o atributo para +{featAttributeBonus}:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {featAttributeChoices.map((attr: string) => (
                      <button
                        key={attr}
                        onClick={() => setSelectedFeatAttribute(attr)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                          selectedFeatAttribute === attr
                            ? 'bg-amber-500 text-white'
                            : 'bg-muted hover:bg-muted/80'
                        )}
                      >
                        {ATTRIBUTE_NAMES[attr] || attr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <span className="text-sm text-muted-foreground">Pontos Restantes</span>
                <span className={cn('text-lg font-bold', pointsRemaining === 0 ? 'text-primary' : 'text-foreground')}>
                  {pointsRemaining}
                </span>
              </div>

              {ATTRIBUTES.map(attr => {
                const bonus = attributePoints[attr] || 0;
                const current = (attrs[attr] || 10);
                return (
                  <div key={attr} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ATTRIBUTE_NAMES[attr]}</p>
                      <p className="text-xs text-muted-foreground">Atual: {current}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAttributeChange(attr, -1)}
                        disabled={bonus <= 0}
                        className="w-7 h-7 rounded bg-muted flex items-center justify-center disabled:opacity-30"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-primary">
                        {bonus > 0 ? `+${bonus}` : '—'}
                      </span>
                      <button
                        onClick={() => handleAttributeChange(attr, 1)}
                        disabled={pointsRemaining <= 0 || bonus >= 2 || current + bonus >= 20}
                        className="w-7 h-7 rounded bg-muted flex items-center justify-center disabled:opacity-30"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {bonus > 0 && (
                      <span className="text-sm font-bold text-primary w-8 text-right">{current + bonus}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
