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
      throw new Error("You are already on this plan.");
    }

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
      status: updatedSubscription.status 
    });

    // Determine the new tier based on the price
    let newTier = "aldeao";
    for (const [tier, prices] of Object.entries(PRICE_IDS)) {
      if (Object.values(prices).includes(newPriceId)) {
        newTier = tier;
        break;
      }
    }

    // Update the subscription status in Supabase
    const { error: updateError } = await supabaseClient
      .from("subscriptions")
      .update({
        status: newTier,
        expires_at: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Warning: Failed to update subscription in database", { error: updateError.message });
    } else {
      logStep("Database updated successfully", { newTier });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Upgrade realizado com sucesso! Você foi cobrado R$ ${prorationAmount.toFixed(2)} (valor proporcional).`,
        prorationAmount,
        newTier,
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
