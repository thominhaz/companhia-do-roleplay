import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cr, treasure_type, party_level, party_size } = await req.json();

    const ENDPOINT = Deno.env.get("DIGITALOCEAN_AI_ENDPOINT");
    const API_KEY = Deno.env.get("DIGITALOCEAN_AI_API_KEY");
    const MODEL = Deno.env.get("DIGITALOCEAN_AI_MODEL");

    if (!ENDPOINT || !API_KEY || !MODEL) {
      throw new Error("Digital Ocean AI credentials not configured");
    }

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

    const response = await fetch(ENDPOINT, {
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
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const treasure = JSON.parse(jsonStr);

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
