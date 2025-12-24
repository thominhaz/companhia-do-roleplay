import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

interface NotificationPayload {
  campaignId: string;
  type: 'dice_roll' | 'session_reminder' | 'combat_start' | 'combat_end' | 'custom';
  data: {
    username?: string;
    characterName?: string;
    diceType?: string;
    diceCount?: number;
    modifier?: number;
    results?: number[];
    total?: number;
    isCritical?: boolean;
    isCriticalFail?: boolean;
    sessionTitle?: string;
    sessionDate?: string;
    combatName?: string;
    customMessage?: string;
    customTitle?: string;
  };
}

// ==========================================
// INPUT SANITIZATION: Prevent Discord markdown injection
// ==========================================

/**
 * Sanitizes a string by removing markdown special characters and limiting length
 * Prevents injection of fake links, impersonation, and visual manipulation
 */
const sanitizeString = (str: string | undefined | null, maxLength: number = 100): string => {
  if (!str || typeof str !== 'string') return '';
  // Remove markdown link syntax brackets/parentheses and limit length
  return str.slice(0, maxLength).replace(/[\[\]()]/g, '');
};

/**
 * Escapes Discord markdown formatting characters
 * Prevents bold, italic, code, strikethrough, and spoiler injection
 */
const escapeMarkdown = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/([*_`~|\\])/g, '\\$1');
};

/**
 * Combines sanitization and markdown escaping for user-supplied content
 */
const sanitizeUserInput = (str: string | undefined | null, maxLength: number = 100): string => {
  return escapeMarkdown(sanitizeString(str, maxLength));
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // ==========================================
    // AUTHENTICATION: Validate JWT token
    // ==========================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create client with anon key to validate user token
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    const { campaignId, type, data } = payload;

    console.log(`Processing Discord notification for campaign ${campaignId}, type: ${type}, user: ${user.id}`);

    // ==========================================
    // AUTHORIZATION: Verify campaign membership
    // ==========================================
    
    // Get campaign details including master_id
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('discord_webhook_url, name, master_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign not found:', campaignError);
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is campaign master
    const isMaster = campaign.master_id === user.id;

    // Check if user is campaign member
    const { data: membership, error: membershipError } = await supabase
      .from('campaign_players')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!isMaster && !membership) {
      console.error(`User ${user.id} is not a member of campaign ${campaignId}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden: You are not a member of this campaign' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} authorized (master: ${isMaster}, member: ${!!membership})`);

    // ==========================================
    // MAIN LOGIC: Send Discord notification
    // ==========================================

    if (!campaign.discord_webhook_url) {
      console.log('No Discord webhook configured for this campaign');
      return new Response(
        JSON.stringify({ success: false, message: 'No Discord webhook configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build Discord embed based on notification type
    let embed: DiscordEmbed;
    let content = '';

    switch (type) {
      case 'dice_roll':
        const diceEmoji = data.isCritical ? '🎉' : data.isCriticalFail ? '💀' : '🎲';
        const color = data.isCritical ? 0xFFD700 : data.isCriticalFail ? 0xFF0000 : 0x7C3AED;
        const playerName = sanitizeUserInput(data.characterName || data.username, 50);
        
        embed = {
          title: `${diceEmoji} Rolagem de Dados`,
          description: `**${playerName}** rolou ${data.diceCount}${data.diceType}${data.modifier && data.modifier !== 0 ? (data.modifier > 0 ? `+${data.modifier}` : data.modifier) : ''}`,
          color,
          fields: [
            {
              name: 'Resultado',
              value: `**${data.total}**`,
              inline: true,
            },
            {
              name: 'Dados',
              value: `[${data.results?.join(', ')}]`,
              inline: true,
            },
          ],
          footer: { text: sanitizeUserInput(campaign.name, 50) },
          timestamp: new Date().toISOString(),
        };

        if (data.isCritical) {
          embed.fields?.push({ name: '⚡', value: '**CRÍTICO!**', inline: true });
        } else if (data.isCriticalFail) {
          embed.fields?.push({ name: '💥', value: '**FALHA CRÍTICA!**', inline: true });
        }
        break;

      case 'session_reminder':
        const sessionTitle = sanitizeUserInput(data.sessionTitle, 100);
        embed = {
          title: '📅 Lembrete de Sessão',
          description: `A sessão **${sessionTitle}** está chegando!`,
          color: 0x22C55E,
          fields: [
            {
              name: 'Data',
              value: sanitizeUserInput(data.sessionDate, 50) || 'A definir',
              inline: true,
            },
          ],
          footer: { text: sanitizeUserInput(campaign.name, 50) },
          timestamp: new Date().toISOString(),
        };
        content = '@here';
        break;

      case 'combat_start':
        const combatStartName = sanitizeUserInput(data.combatName, 100);
        embed = {
          title: '⚔️ Combate Iniciado!',
          description: combatStartName ? `**${combatStartName}**` : 'Um novo combate começou!',
          color: 0xEF4444,
          footer: { text: sanitizeUserInput(campaign.name, 50) },
          timestamp: new Date().toISOString(),
        };
        break;

      case 'combat_end':
        const combatEndName = sanitizeUserInput(data.combatName, 100);
        embed = {
          title: '🏆 Combate Encerrado',
          description: combatEndName ? `**${combatEndName}** terminou!` : 'O combate terminou!',
          color: 0x22C55E,
          footer: { text: sanitizeUserInput(campaign.name, 50) },
          timestamp: new Date().toISOString(),
        };
        break;

      case 'custom':
        embed = {
          title: sanitizeUserInput(data.customTitle, 100) || '📢 Notificação',
          description: sanitizeUserInput(data.customMessage, 500) || '',
          color: 0x7C3AED,
          footer: { text: sanitizeUserInput(campaign.name, 50) },
          timestamp: new Date().toISOString(),
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid notification type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Send to Discord webhook
    const discordPayload = {
      content: content || undefined,
      embeds: [embed],
      username: 'Companheiro de RPG',
      avatar_url: 'https://i.imgur.com/8vYvqMx.png',
    };

    console.log('Sending to Discord:', JSON.stringify(discordPayload));

    const discordResponse = await fetch(campaign.discord_webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Discord API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send Discord notification', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Discord notification sent successfully by user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-discord-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
