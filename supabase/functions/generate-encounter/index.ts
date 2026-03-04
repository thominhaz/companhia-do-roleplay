import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    const { party_level, party_size, difficulty, terrain } = await req.json();

    const ENDPOINT = Deno.env.get("DIGITALOCEAN_AI_ENDPOINT");
    const API_KEY = Deno.env.get("DIGITALOCEAN_AI_API_KEY");
    const MODEL = Deno.env.get("DIGITALOCEAN_AI_MODEL");

    if (!ENDPOINT || !API_KEY || !MODEL) {
      throw new Error("Digital Ocean AI credentials not configured");
    }

    const systemPrompt = `You are a D&D 5e Encounter Generator. You create balanced combat encounters based on party composition.

ALWAYS respond with valid JSON in this exact format:
{
  "encounter_name": "string",
  "difficulty": "easy|medium|hard|deadly",
  "xp_threshold": { "easy": 0, "medium": 0, "hard": 0, "deadly": 0 },
  "total_xp": 0,
  "adjusted_xp": 0,
  "monsters": [
    {
      "name": "string",
      "cr": "string",
      "xp": 0,
      "quantity": 1,
      "hp": "string",
      "ac": 0,
      "key_abilities": ["string"],
      "tactics": "string"
    }
  ],
  "environment_suggestions": "string",
  "narrative_hook": "string",
  "tips": "string"
}

Rules:
- Use official D&D 5e SRD 5.1 XP thresholds per character level (DMG Chapter 3)
- XP thresholds per character level:
  Lv1: 25/50/75/100, Lv2: 50/100/150/200, Lv3: 75/150/225/400,
  Lv4: 125/250/375/500, Lv5: 250/500/750/1100, Lv6: 300/600/900/1400,
  Lv7: 350/750/1100/1700, Lv8: 450/900/1400/2100, Lv9: 550/1100/1600/2400,
  Lv10: 600/1200/1900/2800, Lv11: 800/1600/2400/3600, Lv12: 1000/2000/3000/4500,
  Lv13: 1100/2200/3400/5100, Lv14: 1250/2500/3800/5700, Lv15: 1400/2800/4300/6400,
  Lv16: 1600/3200/4800/7200, Lv17: 2000/3900/5900/8800, Lv18: 2100/4200/6300/9500,
  Lv19: 2400/4900/7300/10900, Lv20: 2800/5700/8500/12700
- Apply encounter multipliers for multiple monsters:
  1 monster: x1, 2: x1.5, 3-6: x2, 7-10: x2.5, 11-14: x3, 15+: x4
- Match the requested difficulty level
- ONLY use SRD 5.1 monsters
- All text must be in Brazilian Portuguese (pt-BR)
- key_abilities: list 2-3 most impactful abilities of the monster
- tactics: brief combat strategy suggestion for the DM (1-2 sentences)
- environment_suggestions: a fitting environment for this encounter (1 sentence)
- narrative_hook: a brief story hook to introduce the encounter (1-2 sentences)
- tips: DM tips for running this encounter effectively (1-2 sentences)
- Consider party_size for threshold calculation (sum thresholds of all members)
- If terrain is specified, choose monsters that fit that environment
- Vary monster types when possible (mix melee and ranged, add variety)

NEVER add explanations outside the JSON. Return ONLY the JSON object.`;

    const userPrompt = `Generate a combat encounter with these parameters:
- Party Level: ${party_level}
- Party Size: ${party_size}
- Desired Difficulty: ${difficulty}
${terrain ? `- Terrain/Environment: ${terrain}` : '- Terrain: any'}`;

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

    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const encounter = JSON.parse(jsonStr);

    return new Response(JSON.stringify(encounter), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-encounter error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao gerar encontro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
