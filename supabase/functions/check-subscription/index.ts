import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de produtos para tiers
const PRODUCT_TO_TIER: Record<string, "heroi" | "mestre"> = {
  // Herói
  "prod_TdiN9NWNCIi6vw": "heroi", // Mensal
  "prod_TeXkiXGH229g27": "heroi", // Trimestral
  "prod_TdiPRHZITnDDKN": "heroi", // Anual
  // Mestre
  "prod_TdiRsbEz0Su6TO": "mestre", // Mensal
  "prod_TeXlaBW7tzRppL": "mestre", // Trimestral
  "prod_TdiSEVb36aMFh5": "mestre", // Anual
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      
      // Atualiza o status no Supabase para aldeao
      await supabaseClient
        .from("subscriptions")
        .upsert({ 
          user_id: user.id, 
          status: "aldeao",
          expires_at: null,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ 
        subscribed: false, 
        tier: "aldeao",
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let tier: "aldeao" | "heroi" | "mestre" = "aldeao";
    let subscriptionEnd: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      
      // Verifica se current_period_end existe e é válido
      const periodEnd = subscription.current_period_end;
      logStep("Subscription period end raw", { periodEnd, type: typeof periodEnd });
      
      if (periodEnd && typeof periodEnd === 'number' && periodEnd > 0) {
        subscriptionEnd = new Date(periodEnd * 1000).toISOString();
      } else {
        // Fallback: usa 30 dias a partir de agora
        subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });

      // Obtém o product ID - pode ser string ou objeto
      const priceProduct = subscription.items.data[0]?.price?.product;
      const productId = typeof priceProduct === 'string' ? priceProduct : priceProduct?.id || '';
      
      logStep("Product info", { priceProduct, productId, priceProductType: typeof priceProduct });
      
      tier = PRODUCT_TO_TIER[productId] || "aldeao";
      logStep("Determined subscription tier", { productId, tier, mappedTiers: Object.keys(PRODUCT_TO_TIER) });

      // Atualiza o status no Supabase
      const { error: upsertError } = await supabaseClient
        .from("subscriptions")
        .upsert({ 
          user_id: user.id, 
          status: tier,
          expires_at: subscriptionEnd,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

      if (upsertError) {
        logStep("Error upserting subscription", { error: upsertError.message });
      } else {
        logStep("Updated subscription in Supabase", { tier, expires_at: subscriptionEnd });
      }
    } else {
      logStep("No active subscription found");
      
      // Atualiza o status no Supabase para aldeao
      await supabaseClient
        .from("subscriptions")
        .upsert({ 
          user_id: user.id, 
          status: "aldeao",
          expires_at: null,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
