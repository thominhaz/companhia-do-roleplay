import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!;
const DISCORD_GUILD_ID = '1452751308212801742';

// Role IDs for each subscription tier
const ROLE_IDS = {
  mestre: '1453170024071168092',
  heroi: '1453170091398267003',
  aldeao: '1453170210545860800',
};

// All managed roles (to remove when switching tiers)
const ALL_ROLE_IDS = Object.values(ROLE_IDS);

async function addDiscordRole(discordUserId: string, roleId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to add role ${roleId}:`, error);
      return false;
    }
    
    console.log(`Added role ${roleId} to user ${discordUserId}`);
    return true;
  } catch (error) {
    console.error('Error adding Discord role:', error);
    return false;
  }
}

async function removeDiscordRole(discordUserId: string, roleId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      console.error(`Failed to remove role ${roleId}:`, error);
      return false;
    }
    
    console.log(`Removed role ${roleId} from user ${discordUserId}`);
    return true;
  } catch (error) {
    console.error('Error removing Discord role:', error);
    return false;
  }
}

async function syncUserRole(discordUserId: string, tier: string): Promise<boolean> {
  console.log(`Syncing Discord roles for user ${discordUserId} with tier: ${tier}`);
  
  // Determine which role to add based on tier
  let roleToAdd: string | null = null;
  
  if (tier === 'mestre' || tier === 'premium') {
    roleToAdd = ROLE_IDS.mestre;
  } else if (tier === 'heroi') {
    roleToAdd = ROLE_IDS.heroi;
  } else {
    // Default to aldeao for free/aldeao tier
    roleToAdd = ROLE_IDS.aldeao;
  }
  
  // Remove all managed roles first
  for (const roleId of ALL_ROLE_IDS) {
    if (roleId !== roleToAdd) {
      await removeDiscordRole(discordUserId, roleId);
    }
  }
  
  // Add the appropriate role
  if (roleToAdd) {
    return await addDiscordRole(discordUserId, roleToAdd);
  }
  
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, discordUserId } = await req.json();

    if (action === 'link') {
      // Link Discord account to profile
      if (!discordUserId) {
        return new Response(JSON.stringify({ error: 'Discord user ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update profile with discord_user_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ discord_user_id: discordUserId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to link Discord account' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get user's subscription tier
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single();

      const tier = subscription?.status || 'aldeao';

      // Sync Discord role
      const success = await syncUserRole(discordUserId, tier);

      return new Response(JSON.stringify({ 
        success, 
        message: success ? 'Discord vinculado e cargo sincronizado!' : 'Discord vinculado, mas houve erro ao sincronizar cargo'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'sync') {
      // Sync role for already linked account
      const { data: profile } = await supabase
        .from('profiles')
        .select('discord_user_id')
        .eq('id', user.id)
        .single();

      if (!profile?.discord_user_id) {
        return new Response(JSON.stringify({ error: 'Discord não vinculado' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get user's subscription tier
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single();

      const tier = subscription?.status || 'aldeao';

      // Sync Discord role
      const success = await syncUserRole(profile.discord_user_id, tier);

      return new Response(JSON.stringify({ 
        success,
        message: success ? 'Cargo sincronizado com sucesso!' : 'Erro ao sincronizar cargo'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'unlink') {
      // Remove roles and unlink Discord
      const { data: profile } = await supabase
        .from('profiles')
        .select('discord_user_id')
        .eq('id', user.id)
        .single();

      if (profile?.discord_user_id) {
        // Remove all managed roles
        for (const roleId of ALL_ROLE_IDS) {
          await removeDiscordRole(profile.discord_user_id, roleId);
        }
      }

      // Remove discord_user_id from profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ discord_user_id: null })
        .eq('id', user.id);

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to unlink Discord' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Discord desvinculado!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in sync-discord-role:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
