import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de preços por plano e período
const PRICE_IDS: Record<string, Record<string, string>> = {
  heroi: {
    mensal: "price_1SgQwiQPJCHLjWYJdheLim2i",
    trimestral: "price_1ShEezQPJCHLjWYJypHN0lwu",
    anual: "price_1SgQyCQPJCHLjWYJXhoCJ3d4",
  },
  mestre: {
    mensal: "price_1SgR0lQPJCHLjWYJjv3gTsOE",
    trimestral: "price_1ShEfiQPJCHLjWYJe1QLo6VV",
    anual: "price_1SgR17QPJCHLjWYJKJwM9AhZ",
  },
};

const PLAN_NAMES: Record<string, string> = {
  heroi: "Herói",
  mestre: "Mestre",
};

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const DISCORD_GUILD_ID = '1452751308212801742';
const DISCORD_ROLE_IDS: Record<string, string> = {
  mestre: '1453170024071168092',
  heroi: '1453170091398267003',
  aldeao: '1453170210545860800',
};

async function syncDiscordRole(discordUserId: string, tier: string): Promise<void> {
  if (!DISCORD_BOT_TOKEN) {
    console.log('[UPGRADE-SUBSCRIPTION] Discord bot token not configured, skipping role sync');
    return;
  }

  console.log(`[UPGRADE-SUBSCRIPTION] Syncing Discord role for user ${discordUserId} to tier ${tier}`);

  let roleToAdd = DISCORD_ROLE_IDS.aldeao;
  if (tier === 'mestre' || tier === 'premium') {
    roleToAdd = DISCORD_ROLE_IDS.mestre;
  } else if (tier === 'heroi') {
    roleToAdd = DISCORD_ROLE_IDS.heroi;
  }

  // Remove other roles first
  for (const [tierName, roleId] of Object.entries(DISCORD_ROLE_IDS)) {
    if (roleId !== roleToAdd) {
      try {
        await fetch(
          `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` },
          }
        );
      } catch (e) {
        console.log(`[UPGRADE-SUBSCRIPTION] Failed to remove role ${tierName}:`, e);
      }
    }
  }

  // Add the new role
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleToAdd}`,
      {
        method: 'PUT',
        headers: { 
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
      }
    );
    
    if (response.ok) {
      console.log(`[UPGRADE-SUBSCRIPTION] Successfully added role ${tier} to Discord user ${discordUserId}`);
    } else {
      console.log(`[UPGRADE-SUBSCRIPTION] Failed to add role: ${await response.text()}`);
    }
  } catch (e) {
    console.log(`[UPGRADE-SUBSCRIPTION] Error adding Discord role:`, e);
  }
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[UPGRADE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { newPlan, period } = await req.json();
    logStep("Request params", { newPlan, period });

    if (!newPlan || !period) {
      throw new Error("newPlan and period are required");
    }

    const newPriceId = PRICE_IDS[newPlan]?.[period];
    if (!newPriceId) {
      throw new Error(`Invalid plan (${newPlan}) or period (${period})`);
    }
    logStep("New price ID found", { newPriceId });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found. Please subscribe first.");
    }
    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found. Please subscribe first.");
    }

    const subscription = subscriptions.data[0];
    const subscriptionItemId = subscription.items.data[0].id;
    const currentPriceId = subscription.items.data[0].price.id;
    logStep("Found active subscription", { 
      subscriptionId: subscription.id, 
      subscriptionItemId,
      currentPriceId 
    });

    // Check if already on the same plan
    if (currentPriceId === newPriceId) {
      throw new Error("Você já está neste plano.");
    }

    // Determine current and new plan names
    let currentPlanName = "Desconhecido";
    let isDowngrade = false;
    const currentTierOrder = { heroi: 1, mestre: 2 };
    let currentTier = "";
    let newTier = "";

    for (const [plan, prices] of Object.entries(PRICE_IDS)) {
      if (Object.values(prices).includes(currentPriceId)) {
        currentPlanName = PLAN_NAMES[plan] || plan;
        currentTier = plan;
        break;
      }
    }
    
    newTier = newPlan;
    isDowngrade = (currentTierOrder[currentTier as keyof typeof currentTierOrder] || 0) > 
                  (currentTierOrder[newTier as keyof typeof currentTierOrder] || 0);

    logStep("Plan change detected", { currentPlanName, newPlanName: PLAN_NAMES[newPlan], isDowngrade });

    // Preview the proration to show user what they'll pay
    const previewInvoice = await stripe.invoices.createPreview({
      customer: customerId,
      subscription: subscription.id,
      subscription_details: {
        items: [
          {
            id: subscriptionItemId,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations",
      },
    });

    const prorationAmount = previewInvoice.total / 100; // Convert from cents to BRL
    logStep("Proration preview", { 
      prorationAmount, 
      total: previewInvoice.total,
      currency: previewInvoice.currency 
    });

    // Update the subscription with proration
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: "always_invoice", // Immediately charge the difference
    });

    logStep("Subscription updated successfully", { 
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status,
      currentPeriodEnd: updatedSubscription.current_period_end
    });

    // Calculate expires_at safely
    let expiresAt: string | null = null;
    const periodEnd = updatedSubscription.current_period_end;
    
    if (typeof periodEnd === "number" && Number.isFinite(periodEnd) && periodEnd > 0) {
      const expiresDate = new Date(periodEnd * 1000);
      if (!Number.isNaN(expiresDate.getTime())) {
        expiresAt = expiresDate.toISOString();
      }
    }
    
    logStep("Calculated expires_at", { periodEnd, expiresAt });

    // Update the subscription status in Supabase
    const updateData: Record<string, unknown> = {
      status: newTier,
      updated_at: new Date().toISOString(),
    };
    
    if (expiresAt) {
      updateData.expires_at = expiresAt;
    }

    const { error: updateError } = await supabaseClient
      .from("subscriptions")
      .update(updateData)
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Warning: Failed to update subscription in database", { error: updateError.message });
    } else {
      logStep("Database updated successfully", { newTier, expiresAt });
    }

    // Sync Discord role if user has Discord linked
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("discord_user_id")
      .eq("id", user.id)
      .single();

    if (profile?.discord_user_id) {
      await syncDiscordRole(profile.discord_user_id, newTier);
    } else {
      logStep("User has no Discord linked, skipping role sync");
    }

    // Prepare success message
    const actionType = isDowngrade ? "Downgrade" : "Upgrade";
    const chargeMessage = prorationAmount > 0 
      ? `Você foi cobrado R$ ${prorationAmount.toFixed(2).replace('.', ',')} (valor proporcional).`
      : prorationAmount < 0
        ? `Você receberá um crédito de R$ ${Math.abs(prorationAmount).toFixed(2).replace('.', ',')} na próxima fatura.`
        : "";

    return new Response(
      JSON.stringify({
        success: true,
        message: `${actionType} para ${PLAN_NAMES[newPlan]} realizado com sucesso! ${chargeMessage}`.trim(),
        prorationAmount,
        newTier,
        isDowngrade,
        subscriptionId: updatedSubscription.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
