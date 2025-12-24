import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DISCORD_CLIENT_ID = '1453471765010579506';
const DISCORD_CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // Contains user's Supabase token
    
    if (!code) {
      return new Response('Authorization code not found', { status: 400 });
    }

    if (!state) {
      return new Response('State parameter not found', { status: 400 });
    }

    // Get the redirect URI from the request
    const projectId = Deno.env.get('SUPABASE_URL')?.match(/https:\/\/([^.]+)/)?.[1];
    const redirectUri = `https://${projectId}.supabase.co/functions/v1/discord-oauth-callback`;

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange error:', error);
      return new Response(`Failed to exchange code: ${error}`, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');

    // Get Discord user info
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const error = await userResponse.text();
      console.error('User info error:', error);
      return new Response(`Failed to get user info: ${error}`, { status: 400 });
    }

    const discordUser = await userResponse.json();
    console.log('Got Discord user:', discordUser.id, discordUser.username);

    // Create Supabase client and verify user token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the state token is valid
    const { data: { user }, error: userError } = await supabase.auth.getUser(state);
    
    if (userError || !user) {
      console.error('Invalid state token:', userError);
      return new Response('Invalid session', { status: 401 });
    }

    // Update profile with Discord user ID
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ discord_user_id: discordUser.id })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return new Response(`Failed to link account: ${updateError.message}`, { status: 500 });
    }

    // Get user subscription tier
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single();

    const tier = subscription?.status || 'aldeao';

    // Sync Discord role via the sync function
    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!;
    const DISCORD_GUILD_ID = '1452751308212801742';
    
    const ROLE_IDS: Record<string, string> = {
      mestre: '1453170024071168092',
      heroi: '1453170091398267003',
      aldeao: '1453170210545860800',
    };

    let roleToAdd = ROLE_IDS.aldeao;
    if (tier === 'mestre' || tier === 'premium') {
      roleToAdd = ROLE_IDS.mestre;
    } else if (tier === 'heroi') {
      roleToAdd = ROLE_IDS.heroi;
    }

    // Remove other roles and add the correct one
    for (const [tierName, roleId] of Object.entries(ROLE_IDS)) {
      if (roleId !== roleToAdd) {
        await fetch(
          `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUser.id}/roles/${roleId}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` },
          }
        );
      }
    }

    await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUser.id}/roles/${roleToAdd}`,
      {
        method: 'PUT',
        headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
      }
    );

    console.log(`Synced role ${roleToAdd} for Discord user ${discordUser.id}`);

    // Redirect back to the app with success message
    const appUrl = Deno.env.get('SITE_URL') || 'https://go20.lovable.app';
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${appUrl}/menu?discord=linked`,
      },
    });

  } catch (error: unknown) {
    console.error('Error in discord-oauth-callback:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${message}`, { status: 500 });
  }
});
