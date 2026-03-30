/**
 * Adapter hook: bridges BuilderContext ↔ WizardData
 * 
 * This allows existing step components (RaceStep, ClassStep, etc.)
 * to work inside the new CharacterBuilder without rewriting them.
 * The adapter converts BuilderContext state into WizardData format
 * and routes updateData calls back into the context.
 */

import { useCallback, useMemo } from 'react';
import { useBuilderContext } from './BuilderContext';
import type { WizardData } from '../types';
import type { Attribute } from '@/data/srd';

export function useBuilderWizardAdapter() {
  const ctx = useBuilderContext();

  // Convert BuilderContext state → WizardData
  const data: WizardData = useMemo(() => {
    const bd = ctx.builderData;
    const baseAttrs = bd.base_attributes || {
      strength: 10, dexterity: 10, constitution: 10,
      intelligence: 10, wisdom: 10, charisma: 10,
    };

    return {
      race: bd.race_id || '',
      subrace: bd.subrace_id || null,
      class: bd.class_id || '',
      subclass: null, // Will be populated from level choices for level-1 subclass classes
      attributes: baseAttrs as Record<Attribute, number>,
      abilityBonusChoices: bd.ability_bonus_choices || [],
      background: bd.background_id || '',
      alignment: bd.alignment || '',
      name: ctx.name,
      personalityTraits: ctx.personalityTraits,
      ideals: ctx.ideals,
      bonds: ctx.bonds,
      flaws: ctx.flaws,
      equipmentChoices: bd.equipment_choices || {},
      equipmentCategorySelections: bd.equipment_category_selections || {},
      selectedSkills: ctx.levelChoices[0]?.selected_skills || [],
      extraLanguages: ctx.levelChoices[0]?.extra_languages || [],
      // Custom background
      customBackgroundSkills: bd.custom_background?.skills || [],
      customBackgroundProficiencies: bd.custom_background?.proficiencies || [],
      customBackgroundName: bd.custom_background?.name || '',
      customBackgroundFeature: bd.custom_background?.feature || '',
      // Backstory
      age: ctx.age,
      height: ctx.height,
      weight: ctx.weight,
      eyes: ctx.eyes,
      hair: ctx.hair,
      skin: ctx.skin,
      distinctiveFeatures: ctx.distinctiveFeatures,
      backstory: ctx.backstory,
      goals: ctx.goals,
      alliesOrganizations: ctx.alliesOrganizations,
      // Spells
      selectedCantrips: ctx.levelChoices[0]?.extra_cantrips || [],
      selectedSpells: ctx.levelChoices[0]?.extra_spells || [],
      // Variant Human
      variantHumanFeat: bd.variant_human_feat || '',
      variantHumanSkill: bd.variant_human_skill || '',
    };
  }, [ctx.builderData, ctx.name, ctx.personalityTraits, ctx.ideals, ctx.bonds, ctx.flaws,
      ctx.age, ctx.height, ctx.weight, ctx.eyes, ctx.hair, ctx.skin,
      ctx.distinctiveFeatures, ctx.backstory, ctx.goals, ctx.alliesOrganizations,
      ctx.levelChoices]);

  // Route WizardData updates → BuilderContext
  const updateData = useCallback((updates: Partial<WizardData>) => {
    // Builder data fields
    const builderUpdates: Record<string, any> = {};
    if ('race' in updates) builderUpdates.race_id = updates.race;
    if ('subrace' in updates) builderUpdates.subrace_id = updates.subrace || undefined;
    if ('class' in updates) builderUpdates.class_id = updates.class;
    if ('abilityBonusChoices' in updates) builderUpdates.ability_bonus_choices = updates.abilityBonusChoices;
    if ('background' in updates) builderUpdates.background_id = updates.background;
    if ('alignment' in updates) builderUpdates.alignment = updates.alignment;
    if ('equipmentChoices' in updates) builderUpdates.equipment_choices = updates.equipmentChoices;
    if ('equipmentCategorySelections' in updates) builderUpdates.equipment_category_selections = updates.equipmentCategorySelections;
    if ('variantHumanFeat' in updates) builderUpdates.variant_human_feat = updates.variantHumanFeat;
    if ('variantHumanSkill' in updates) builderUpdates.variant_human_skill = updates.variantHumanSkill;
    if ('attributes' in updates) builderUpdates.base_attributes = updates.attributes;

    // Custom background
    if ('customBackgroundName' in updates || 'customBackgroundSkills' in updates ||
        'customBackgroundProficiencies' in updates || 'customBackgroundFeature' in updates) {
      const current = ctx.builderData.custom_background || { name: '', skills: [], proficiencies: [], feature: '' };
      builderUpdates.custom_background = {
        ...current,
        ...('customBackgroundName' in updates ? { name: updates.customBackgroundName } : {}),
        ...('customBackgroundSkills' in updates ? { skills: updates.customBackgroundSkills } : {}),
        ...('customBackgroundProficiencies' in updates ? { proficiencies: updates.customBackgroundProficiencies } : {}),
        ...('customBackgroundFeature' in updates ? { feature: updates.customBackgroundFeature } : {}),
      };
    }

    if (Object.keys(builderUpdates).length > 0) {
      ctx.updateBuilderData(builderUpdates);
    }

    // Personal fields
    const personalUpdates: Record<string, any> = {};
    if ('name' in updates) personalUpdates.name = updates.name;
    if ('personalityTraits' in updates) personalUpdates.personalityTraits = updates.personalityTraits;
    if ('ideals' in updates) personalUpdates.ideals = updates.ideals;
    if ('bonds' in updates) personalUpdates.bonds = updates.bonds;
    if ('flaws' in updates) personalUpdates.flaws = updates.flaws;
    if ('age' in updates) personalUpdates.age = updates.age;
    if ('height' in updates) personalUpdates.height = updates.height;
    if ('weight' in updates) personalUpdates.weight = updates.weight;
    if ('eyes' in updates) personalUpdates.eyes = updates.eyes;
    if ('hair' in updates) personalUpdates.hair = updates.hair;
    if ('skin' in updates) personalUpdates.skin = updates.skin;
    if ('distinctiveFeatures' in updates) personalUpdates.distinctiveFeatures = updates.distinctiveFeatures;
    if ('backstory' in updates) personalUpdates.backstory = updates.backstory;
    if ('goals' in updates) personalUpdates.goals = updates.goals;
    if ('alliesOrganizations' in updates) personalUpdates.alliesOrganizations = updates.alliesOrganizations;

    if (Object.keys(personalUpdates).length > 0) {
      ctx.updatePersonal(personalUpdates);
    }

    // Level choice fields (skills, languages, spells go to level 1 choice)
    const levelUpdates: Record<string, any> = {};
    if ('selectedSkills' in updates) levelUpdates.selected_skills = updates.selectedSkills;
    if ('extraLanguages' in updates) levelUpdates.extra_languages = updates.extraLanguages;
    if ('selectedCantrips' in updates) levelUpdates.extra_cantrips = updates.selectedCantrips;
    if ('selectedSpells' in updates) levelUpdates.extra_spells = updates.selectedSpells;

    if (Object.keys(levelUpdates).length > 0) {
      ctx.updateLevelChoice(1, levelUpdates);
    }

    // Subclass goes to the appropriate level choice
    if ('subclass' in updates) {
      ctx.updateLevelChoice(1, { subclass_id: updates.subclass || undefined });
    }
  }, [ctx]);

  return { data, updateData };
}
