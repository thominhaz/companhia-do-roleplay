/**
 * Hook to compile BuilderContext state into a character save operation.
 * 
 * CRITICAL: When editing, only structural/builder fields are updated.
 * Gameplay state (HP atual, inventário, moedas, slots usados, condições, etc.)
 * é preservado intacto para não destruir dados de jogo.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBuilderContext } from './BuilderContext';
import { useCreateCharacter, useUpdateCharacter } from '@/hooks/useCharacters';
import { RACES, CLASSES, BACKGROUNDS, getModifier } from '@/data/srd';
import { toast } from 'sonner';

export function useBuilderSave() {
  const ctx = useBuilderContext();
  const createCharacter = useCreateCharacter();
  const updateCharacter = useUpdateCharacter();
  const navigate = useNavigate();

  const save = useCallback(async () => {
    const bd = ctx.builderData;

    // Validation
    if (!bd.race_id) { toast.error('Selecione uma raça'); return; }
    if (!bd.class_id) { toast.error('Selecione uma classe'); return; }
    if (!ctx.name.trim()) { toast.error('Digite um nome'); return; }

    const race = RACES.find(r => r.id === bd.race_id);
    const cls = CLASSES.find(c => c.id === bd.class_id);
    if (!cls) { toast.error('Classe inválida'); return; }

    const attrs = ctx.getComputedAttributes();
    const typedAttrs = {
      strength: attrs.strength || 10,
      dexterity: attrs.dexterity || 10,
      constitution: attrs.constitution || 10,
      intelligence: attrs.intelligence || 10,
      wisdom: attrs.wisdom || 10,
      charisma: attrs.charisma || 10,
    };
    const dexMod = getModifier(typedAttrs.dexterity);
    const totalHP = ctx.getComputedHP();
    const level = ctx.currentLevel;

    // Proficiency bonus from advancement table
    const profBonus = level >= 17 ? 6 : level >= 13 ? 5 : level >= 9 ? 4 : level >= 5 ? 3 : 2;

    // Build features from level choices
    const features: any[] = [];
    ctx.levelChoices.forEach(lc => {
      if (lc.selected_feat) {
        features.push({ name: lc.selected_feat, source: 'Talento', level: lc.level });
      }
      if (lc.subclass_id) {
        features.push({ name: 'Subclasse', source: 'Subclasse', subclass_id: lc.subclass_id, level: lc.level });
      }
    });

    // Build skills from level 1 choices
    const selectedSkills = ctx.levelChoices[0]?.selected_skills || [];
    const skillsObj: Record<string, any> = {};
    selectedSkills.forEach(s => { skillsObj[s] = { proficient: true, bonus: 0 }; });

    // Saving throws
    const savingThrows: Record<string, any> = {};
    cls.saving_throw_proficiencies.forEach(st => {
      savingThrows[st] = { proficient: true };
    });

    const background = BACKGROUNDS.find(b => b.id === bd.background_id);

    try {
      if (ctx.mode === 'edit' && ctx.characterId) {
        // =====================================================
        // EDIT MODE: Only update structural/builder fields.
        // Gameplay state is PRESERVED (current_hp, equipment,
        // inventory, currency, spellcasting, spells, conditions,
        // death_saves, temporary_hp, hit_dice used slots, etc.)
        // =====================================================
        const editData = {
          id: ctx.characterId,
          name: ctx.name,
          race: race?.name || bd.race_id || '',
          subrace: bd.subrace_id || null,
          class: cls.name,
          level,
          max_hp: totalHP,
          armor_class: 10 + dexMod,
          initiative: dexMod,
          speed: race?.speed || 30,
          proficiency_bonus: profBonus,
          attributes: typedAttrs,
          saving_throws: savingThrows,
          skills: skillsObj,
          hit_dice: { total: level, current: level, diceType: `d${cls.hit_die}` },
          background: background?.name || bd.background_id || null,
          alignment: bd.alignment || null,
          personality_traits: ctx.personalityTraits || null,
          ideals: ctx.ideals || null,
          bonds: ctx.bonds || null,
          flaws: ctx.flaws || null,
          backstory: ctx.backstory || null,
          features,
          languages: race?.languages || [],
          image_url: ctx.imageUrl || null,
          age: ctx.age || null,
          height: ctx.height || null,
          weight: ctx.weight || null,
          eyes: ctx.eyes || null,
          hair: ctx.hair || null,
          skin: ctx.skin || null,
          distinctive_features: ctx.distinctiveFeatures || null,
          goals: ctx.goals || null,
          allies_organizations: ctx.alliesOrganizations || null,
          builder_data: ctx.builderData,
          level_choices: ctx.levelChoices,
        };
        await updateCharacter.mutateAsync(editData);
        navigate(`/character/${ctx.characterId}`);
      } else {
        // =====================================================
        // CREATE MODE: Full character data including defaults
        // for all gameplay fields.
        // =====================================================
        const createData = {
          name: ctx.name,
          race: race?.name || bd.race_id || '',
          subrace: bd.subrace_id || null,
          class: cls.name,
          level,
          experience: 0,
          max_hp: totalHP,
          current_hp: totalHP,
          temporary_hp: 0,
          armor_class: 10 + dexMod,
          initiative: dexMod,
          speed: race?.speed || 30,
          proficiency_bonus: profBonus,
          attributes: typedAttrs,
          saving_throws: savingThrows,
          skills: skillsObj,
          hit_dice: { total: level, current: level, diceType: `d${cls.hit_die}` },
          death_saves: { successes: 0, failures: 0 },
          equipment: [],
          inventory: [],
          currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
          spellcasting: null,
          spells: [],
          background: background?.name || bd.background_id || null,
          alignment: bd.alignment || null,
          personality_traits: ctx.personalityTraits || null,
          ideals: ctx.ideals || null,
          bonds: ctx.bonds || null,
          flaws: ctx.flaws || null,
          backstory: ctx.backstory || null,
          features,
          proficiencies: [],
          languages: race?.languages || [],
          image_url: ctx.imageUrl || null,
          conditions: [],
          age: ctx.age || null,
          height: ctx.height || null,
          weight: ctx.weight || null,
          eyes: ctx.eyes || null,
          hair: ctx.hair || null,
          skin: ctx.skin || null,
          distinctive_features: ctx.distinctiveFeatures || null,
          goals: ctx.goals || null,
          allies_organizations: ctx.alliesOrganizations || null,
          builder_data: ctx.builderData,
          level_choices: ctx.levelChoices,
        };
        const created = await createCharacter.mutateAsync(createData);
        navigate(`/character/${created.id}`);
      }
    } catch (err) {
      // Error toasts handled by mutation hooks
    }
  }, [ctx, createCharacter, updateCharacter, navigate]);

  const isSaving = createCharacter.isPending || updateCharacter.isPending;

  return { save, isSaving };
}
