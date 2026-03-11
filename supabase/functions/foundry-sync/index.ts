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

// Authenticate via x-api-key header → returns campaign row
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

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop(); // last segment after /foundry-sync/

  // ─── GET: Foundry polls combat state ───
  if (req.method === "GET") {
    // Get active encounter
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

    // Get combatants
    const { data: combatants } = await supabase
      .from("combatants")
      .select("id, name, initiative, current_hp, max_hp, armor_class, conditions, is_player, character_id, notes, sort_order")
      .eq("encounter_id", encounter.id)
      .order("initiative", { ascending: false });

    return json({
      active: true,
      encounter: {
        id: encounter.id,
        name: encounter.name,
        round: encounter.round,
        current_turn: encounter.current_turn,
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

    // --- Update combatant HP/AC/conditions ---
    if (action === "update_combatant") {
      const { combatant_id, current_hp, max_hp, armor_class, conditions } = body;
      if (!combatant_id) return err("combatant_id required");

      // Verify combatant belongs to this campaign
      const { data: combatant } = await supabase
        .from("combatants")
        .select("id, encounter_id, character_id")
        .eq("id", combatant_id)
        .maybeSingle();

      if (!combatant) return err("Combatant not found", 404);

      // Verify encounter belongs to campaign
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
        .eq("id", combatant_id);

      if (updateErr) return err(updateErr.message, 500);

      // Sync to linked character if applicable
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

    // --- Batch update multiple combatants (e.g. initiative sync) ---
    if (action === "batch_update") {
      const { updates } = body; // Array of { combatant_id, ...fields }
      if (!Array.isArray(updates)) return err("updates must be an array");

      const results = [];
      for (const upd of updates) {
        const { combatant_id, ...fields } = upd;
        if (!combatant_id) continue;

        const { error: e } = await supabase
          .from("combatants")
          .update(fields)
          .eq("id", combatant_id);

        results.push({ combatant_id, success: !e, error: e?.message });
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

    return err("Unknown action: " + action);
  }

  return err("Method not allowed", 405);
});
