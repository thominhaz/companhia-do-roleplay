import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(msg: string, status = 400) {
  return json({ error: msg }, status);
}

async function authenticate(req: Request, supabase: ReturnType<typeof createClient>) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return null;

  const { data } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("foundry_api_key", apiKey)
    .maybeSingle();

  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const campaign = await authenticate(req, supabase);
  if (!campaign) return err("Invalid or missing API key", 401);

  // ─── GET: Foundry polls combat state or fetches characters ───
  if (req.method === "GET") {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    // --- GET ?type=characters: Return campaign characters for Actor import ---
    if (type === "characters") {
      // Get all players in the campaign with their linked characters
      const { data: players } = await supabase
        .from("campaign_players")
        .select("user_id, character_id, role")
        .eq("campaign_id", campaign.id);

      if (!players || players.length === 0) {
        return json({ characters: [] });
      }

      const characterIds = players
        .map((p: any) => p.character_id)
        .filter(Boolean);

      if (characterIds.length === 0) {
        return json({ characters: [] });
      }

      const { data: characters } = await supabase
        .from("characters")
        .select(
          "id, name, race, subrace, class, level, experience, background, alignment, " +
          "max_hp, current_hp, temporary_hp, armor_class, initiative, speed, proficiency_bonus, " +
          "attributes, saving_throws, skills, hit_dice, death_saves, " +
          "conditions, languages, proficiencies, features, " +
          "spellcasting, spells, equipment, currency, inventory, " +
          "personality_traits, ideals, bonds, flaws, image_url"
        )
        .in("id", characterIds);

      // Map to a Foundry-friendly format
      const foundryCharacters = (characters || []).map((c: any) => {
        const attrs = c.attributes || {};
        const saves = c.saving_throws || {};
        const skills = c.skills || {};

        // Map abilities with score + save_proficient (format expected by importer)
        const mapAbility = (key: string, ptKey: string) => ({
          score: attrs[ptKey] || attrs[key] || 10,
          save_proficient: saves[ptKey] || saves[key] || false,
        });

        // Map skills with proficient/expertise flags
        const mappedSkills: Record<string, { proficient: boolean; expertise: boolean }> = {};
        for (const [skillName, skillVal] of Object.entries(skills)) {
          if (typeof skillVal === 'object' && skillVal !== null) {
            const sv = skillVal as any;
            mappedSkills[skillName] = {
              proficient: sv.proficient ?? sv.trained ?? false,
              expertise: sv.expertise ?? false,
            };
          } else if (typeof skillVal === 'boolean') {
            mappedSkills[skillName] = { proficient: skillVal, expertise: false };
          }
        }

        // Map equipment with type hints
        const mappedEquipment = (c.equipment || []).map((item: any) => ({
          name: item.name || item.nome || '',
          type: item.type || item.tipo || 'gear',
          equipped: item.equipped ?? item.equipado ?? false,
          quantity: item.quantity ?? item.quantidade ?? 1,
          damage: item.damage || item.dano || null,
          damage_type: item.damage_type || item.tipo_dano || null,
          properties: item.properties || item.propriedades || [],
          ac: item.ac || item.ca || null,
          ac_type: item.ac_type || item.tipo_armadura || null,
          weight: item.weight || item.peso || null,
          description: item.description || item.descricao || null,
        }));

        // Map spells
        const mappedSpells = (c.spells || []).map((spell: any) => ({
          name: spell.name || spell.nome || '',
          level: spell.level ?? spell.nivel ?? 0,
          school: spell.school || spell.escola || '',
          casting_time: spell.casting_time || spell.tempo_conjuracao || '',
          range: spell.range || spell.alcance || '',
          components: spell.components || spell.componentes || '',
          duration: spell.duration || spell.duracao || '',
          description: spell.description || spell.descricao || '',
          damage: spell.damage || spell.dano || null,
          save: spell.save || spell.salvaguarda || null,
          prepared: spell.prepared ?? spell.preparada ?? false,
        }));

        // Map features
        const mappedFeatures = (c.features || []).map((feat: any) => ({
          name: feat.name || feat.nome || '',
          description: feat.description || feat.descricao || '',
          source: feat.source || feat.fonte || '',
          uses: feat.uses || feat.usos || null,
          recharge: feat.recharge || feat.recarga || null,
        }));

        // Spell slots from spellcasting data
        const spellcasting = c.spellcasting || {};
        const spellSlots: Record<string, { value: number; max: number }> = {};
        if (spellcasting.spell_slots) {
          for (const [lvl, slot] of Object.entries(spellcasting.spell_slots)) {
            const s = slot as any;
            spellSlots[lvl] = {
              value: s.remaining ?? s.value ?? s.current ?? 0,
              max: s.max ?? s.total ?? 0,
            };
          }
        }

        return {
          id: c.id,
          name: c.name,
          avatar: c.image_url || null,
          race: c.race,
          subrace: c.subrace,
          class: c.class,
          level: c.level,
          xp: c.experience,
          background: c.background,
          alignment: c.alignment,

          // Abilities in { score, save_proficient } format
          abilities: {
            str: mapAbility('strength', 'strength'),
            dex: mapAbility('dexterity', 'dexterity'),
            con: mapAbility('constitution', 'constitution'),
            int: mapAbility('intelligence', 'intelligence'),
            wis: mapAbility('wisdom', 'wisdom'),
            cha: mapAbility('charisma', 'charisma'),
          },

          // Skills with proficient/expertise
          skills: mappedSkills,

          // HP in { current, max, temp } format
          hp: {
            current: c.current_hp,
            max: c.max_hp,
            temp: c.temporary_hp,
          },
          ac: c.armor_class,
          initiative: c.initiative,
          speed: c.speed,
          proficiency_bonus: c.proficiency_bonus,

          hit_dice: c.hit_dice,
          death_saves: c.death_saves,
          conditions: c.conditions || [],

          // Spellcasting
          spellcasting_ability: spellcasting.ability || null,
          spell_slots: spellSlots,
          spells: mappedSpells,

          // Equipment & inventory
          equipment: mappedEquipment,
          inventory: c.inventory,
          currency: c.currency,

          // Features
          features: mappedFeatures,

          // Traits
          languages: c.languages,
          proficiencies: c.proficiencies,

          // Biography
          backstory: c.backstory,
          personality_traits: c.personality_traits,
          ideals: c.ideals,
          bonds: c.bonds,
          flaws: c.flaws,
        };
      });

      return json({ characters: foundryCharacters });
    }

    // --- Default GET: Poll combat state ---
    const { data: encounter } = await supabase
      .from("combat_encounters")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!encounter) {
      return json({ active: false, encounter: null, combatants: [] });
    }

    const { data: combatants } = await supabase
      .from("combatants")
      .select("id, name, initiative, current_hp, max_hp, armor_class, conditions, is_player, character_id, notes, sort_order, foundry_id")
      .eq("encounter_id", encounter.id)
      .order("sort_order", { ascending: true });

    return json({
      active: true,
      encounter: {
        id: encounter.id,
        name: encounter.name,
        round: encounter.round,
        current_turn: encounter.current_turn,
        status: encounter.status,
      },
      combatants: combatants || [],
    });
  }

  // ─── POST: Foundry pushes updates ───
  if (req.method === "POST") {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON body");
    }

    const { action } = body;

    // --- Ping/health check ---
    if (action === "ping") {
      return json({ success: true, campaign: campaign.name, timestamp: new Date().toISOString() });
    }

    // --- Update combatant HP/AC/conditions ---
    if (action === "update_combatant") {
      const { combatant_id, foundry_id, current_hp, max_hp, armor_class, conditions } = body;
      
      // Find by combatant_id or foundry_id
      let targetId = combatant_id;
      if (!targetId && foundry_id) {
        const { data: found } = await supabase
          .from("combatants")
          .select("id, encounter_id")
          .eq("foundry_id", foundry_id)
          .limit(1)
          .maybeSingle();
        if (found) targetId = found.id;
      }
      
      if (!targetId) return err("combatant_id or foundry_id required");

      const { data: combatant } = await supabase
        .from("combatants")
        .select("id, encounter_id, character_id")
        .eq("id", targetId)
        .maybeSingle();

      if (!combatant) return err("Combatant not found", 404);

      const { data: enc } = await supabase
        .from("combat_encounters")
        .select("campaign_id")
        .eq("id", combatant.encounter_id)
        .single();

      if (enc?.campaign_id !== campaign.id) return err("Combatant not in this campaign", 403);

      const updates: Record<string, any> = {};
      if (current_hp !== undefined) updates.current_hp = current_hp;
      if (max_hp !== undefined) updates.max_hp = max_hp;
      if (armor_class !== undefined) updates.armor_class = armor_class;
      if (conditions !== undefined) updates.conditions = conditions;

      const { error: updateErr } = await supabase
        .from("combatants")
        .update(updates)
        .eq("id", targetId);

      if (updateErr) return err(updateErr.message, 500);

      // Sync to linked character
      if (combatant.character_id) {
        const charUpdates: Record<string, any> = {};
        if (current_hp !== undefined) charUpdates.current_hp = current_hp;
        if (armor_class !== undefined) charUpdates.armor_class = armor_class;
        if (conditions !== undefined) charUpdates.conditions = conditions;

        if (Object.keys(charUpdates).length > 0) {
          await supabase
            .from("characters")
            .update(charUpdates)
            .eq("id", combatant.character_id);
        }
      }

      return json({ success: true });
    }

    // --- Batch update multiple combatants ---
    if (action === "batch_update") {
      const { updates } = body;
      if (!Array.isArray(updates)) return err("updates must be an array");

      const results = [];
      for (const upd of updates) {
        const { combatant_id, foundry_id, ...fields } = upd;
        let targetId = combatant_id;
        
        if (!targetId && foundry_id) {
          const { data: found } = await supabase
            .from("combatants")
            .select("id")
            .eq("foundry_id", foundry_id)
            .limit(1)
            .maybeSingle();
          if (found) targetId = found.id;
        }
        
        if (!targetId) {
          results.push({ combatant_id, foundry_id, success: false, error: "not found" });
          continue;
        }

        const { error: e } = await supabase
          .from("combatants")
          .update(fields)
          .eq("id", targetId);

        results.push({ combatant_id: targetId, success: !e, error: e?.message });
      }

      return json({ success: true, results });
    }

    // --- Update encounter state (round, turn) ---
    if (action === "update_encounter") {
      const { encounter_id, round, current_turn } = body;
      if (!encounter_id) return err("encounter_id required");

      const updates: Record<string, any> = {};
      if (round !== undefined) updates.round = round;
      if (current_turn !== undefined) updates.current_turn = current_turn;

      const { error: e } = await supabase
        .from("combat_encounters")
        .update(updates)
        .eq("id", encounter_id)
        .eq("campaign_id", campaign.id);

      if (e) return err(e.message, 500);
      return json({ success: true });
    }

    // --- Link foundry IDs to existing combatants (matching) ---
    if (action === "link_combatants") {
      const { encounter_id, links } = body;
      // links: Array of { combatant_id, foundry_id }
      if (!encounter_id || !Array.isArray(links)) return err("encounter_id and links[] required");

      // Verify encounter belongs to campaign
      const { data: enc } = await supabase
        .from("combat_encounters")
        .select("campaign_id")
        .eq("id", encounter_id)
        .single();

      if (enc?.campaign_id !== campaign.id) return err("Encounter not in this campaign", 403);

      const results = [];
      for (const link of links) {
        const { error: e } = await supabase
          .from("combatants")
          .update({ foundry_id: link.foundry_id })
          .eq("id", link.combatant_id)
          .eq("encounter_id", encounter_id);
        results.push({ combatant_id: link.combatant_id, success: !e });
      }

      return json({ success: true, results });
    }

    // --- Sync HP from Foundry for a specific combatant by foundry_id ---
    if (action === "foundry_hp_update") {
      const { foundry_id, current_hp, max_hp, temp_hp } = body;
      if (!foundry_id) return err("foundry_id required");

      const { data: combatant } = await supabase
        .from("combatants")
        .select("id, encounter_id, character_id")
        .eq("foundry_id", foundry_id)
        .limit(1)
        .maybeSingle();

      if (!combatant) return err("No combatant linked to this foundry_id", 404);

      const updates: Record<string, any> = {};
      if (current_hp !== undefined) updates.current_hp = current_hp;
      if (max_hp !== undefined) updates.max_hp = max_hp;

      await supabase.from("combatants").update(updates).eq("id", combatant.id);

      // Also sync to character sheet
      if (combatant.character_id) {
        const charUpdates: Record<string, any> = {};
        if (current_hp !== undefined) charUpdates.current_hp = current_hp;
        if (temp_hp !== undefined) charUpdates.temporary_hp = temp_hp;
        if (Object.keys(charUpdates).length > 0) {
          await supabase.from("characters").update(charUpdates).eq("id", combatant.character_id);
        }
      }

      return json({ success: true });
    }

    return err("Unknown action: " + action);
  }

  return err("Method not allowed", 405);
});
