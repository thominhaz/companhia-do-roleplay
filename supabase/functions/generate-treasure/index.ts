import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractJSON(text: string): string {
  let s = text.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "");
  }
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  s = s.replace(/,\s*([\]}])/g, "$1");
  s = s.replace(/[\x00-\x1F\x7F]/g, (c) => c === "\n" || c === "\r" || c === "\t" ? c : "");
  return s;
}

function ensureEndpoint(url: string): string {
  const u = url.replace(/\/+$/, "");
  if (u.endsWith("/chat/completions")) return u;
  if (u.endsWith("/v1")) return u + "/chat/completions";
  return u + "/api/v1/chat/completions";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { cr, treasure_type, party_level, party_size } = await req.json();

    const ENDPOINT = Deno.env.get("DIGITALOCEAN_AI_ENDPOINT");
    const API_KEY = Deno.env.get("DIGITALOCEAN_AI_API_KEY");
    const MODEL = Deno.env.get("DIGITALOCEAN_AI_MODEL");

    if (!ENDPOINT || !API_KEY || !MODEL) {
      throw new Error("Digital Ocean AI credentials not configured");
    }

    const finalEndpoint = ensureEndpoint(ENDPOINT);
    console.log("Using endpoint:", finalEndpoint);

    const systemPrompt = `You are a D&D 5e Treasure Generator. You generate loot tables based on the parameters provided.

ALWAYS respond with valid JSON in this exact format:
{
  "coins": { "cp": 0, "sp": 0, "ep": 0, "gp": 0, "pp": 0 },
  "gems": [{ "name": "string", "value_gp": 0, "description": "string" }],
  "art_objects": [{ "name": "string", "value_gp": 0, "description": "string" }],
  "magic_items": [{ "name": "string", "rarity": "common|uncommon|rare|very_rare|legendary", "type": "string", "description": "string", "requires_attunement": false }],
  "total_value_gp": 0
}

Rules:
- Use official D&D 5e SRD treasure tables as reference (DMG Chapter 7)
- Scale loot based on CR (Challenge Rating) and party level provided
- Respect the treasure_type parameter: "individual" (carried by creature) or "hoard" (accumulated treasure)
- For hoards, include a mix of coins, gems/art, and magic items appropriate to the CR
- For individual treasure, keep it simple (mostly coins, rarely items)
- All item names and descriptions must be in Brazilian Portuguese (pt-BR)
- Coin amounts should follow DMG probability distributions
- Magic item rarity must match the CR range:
  - CR 0-4: common/uncommon
  - CR 5-10: uncommon/rare
  - CR 11-16: rare/very_rare
  - CR 17+: very_rare/legendary
- NEVER include items above the appropriate rarity for the CR
- Keep descriptions concise (max 2 sentences)
- If gems or art_objects or magic_items arrays would be empty, return empty arrays []
- total_value_gp should be the estimated total monetary value
- Consider party_size to slightly scale coin amounts

NEVER add explanations outside the JSON. Return ONLY the JSON object.`;

    const userPrompt = `Generate treasure with these parameters:
- Challenge Rating (CR): ${cr}
- Treasure Type: ${treasure_type}
- Party Level: ${party_level}
- Party Size: ${party_size}`;

    const response = await fetch(finalEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Digital Ocean AI error:", response.status, errorText);
      console.error("Endpoint used:", finalEndpoint);
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Full AI response:", JSON.stringify(data));
      throw new Error("No content in AI response");
    }

    const jsonStr = extractJSON(content);
    let treasure;
    try {
      treasure = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("JSON parse failed. Raw content:", content);
      console.error("Extracted JSON:", jsonStr);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Auto-calculate total_value_gp if missing or zero
    if (!treasure.total_value_gp) {
      let total = 0;
      if (treasure.coins) {
        total += (treasure.coins.cp || 0) / 100;
        total += (treasure.coins.sp || 0) / 10;
        total += (treasure.coins.ep || 0) / 2;
        total += (treasure.coins.gp || 0);
        total += (treasure.coins.pp || 0) * 10;
      }
      if (treasure.gems) treasure.gems.forEach((g: any) => { total += g.value_gp || 0; });
      if (treasure.art_objects) treasure.art_objects.forEach((a: any) => { total += a.value_gp || 0; });
      treasure.total_value_gp = Math.round(total);
    }

    // Ensure arrays exist
    treasure.gems = treasure.gems || [];
    treasure.art_objects = treasure.art_objects || [];
    treasure.magic_items = treasure.magic_items || [];
    treasure.coins = treasure.coins || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };

    return new Response(JSON.stringify(treasure), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-treasure error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao gerar tesouro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
