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

type Tier = "aldeao" | "heroi" | "mestre";

const tierRank: Record<Tier, number> = { aldeao: 0, heroi: 1, mestre: 2 };

const normalizeTier = (status: string | null, expiresAt: string | null): Tier => {
  if (!status) return "aldeao";
  if (expiresAt && new Date(expiresAt) < new Date()) return "aldeao";
  if (status === "mestre" || status === "premium") return "mestre";
  if (status === "heroi") return "heroi";
  return "aldeao";
};

const maxTier = (a: Tier, b: Tier): Tier => (tierRank[a] >= tierRank[b] ? a : b);

// expiresAt === null means lifetime
const mergeExpiry = (a: string | null, b: string | null): string | null => {
  if (a === null || b === null) return null;
  if (!a) return b;
  if (!b) return a;
  return new Date(a) > new Date(b) ? a : b;
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

    // Load current subscription from DB first.
    // IMPORTANT: this function must NOT downgrade promo-code tiers just because Stripe has no active subscription.
    const { data: currentSub, error: currentSubError } = await supabaseClient
      .from("subscriptions")
      .select("status, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (currentSubError) {
      logStep("Error loading current subscription", { error: currentSubError.message });
    }

    const currentTier = normalizeTier(currentSub?.status ?? null, currentSub?.expires_at ?? null);
    const currentExpiresAt: string | null =
      currentTier === "aldeao" ? null : (currentSub?.expires_at ?? null);

    logStep("Current subscription from DB", {
      currentTier,
      currentStatus: currentSub?.status ?? null,
      currentExpiresAt,
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found", { currentTier, currentExpiresAt });

      // Only ensure aldeao in DB if user doesn't already have an active tier.
      if (currentTier === "aldeao") {
        await supabaseClient
          .from("subscriptions")
          .upsert(
            {
              user_id: user.id,
              status: "aldeao",
              expires_at: null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
      }

      return new Response(
        JSON.stringify({
          subscribed: false,
          tier: currentTier,
          subscription_end: currentExpiresAt,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;

    let stripeTier: Tier = "aldeao";
    let stripeEnd: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];

      // Verifica se current_period_end existe e é válido
      const periodEnd = subscription.current_period_end;
      logStep("Subscription period end raw", { periodEnd, type: typeof periodEnd });

      if (periodEnd && typeof periodEnd === "number" && periodEnd > 0) {
        stripeEnd = new Date(periodEnd * 1000).toISOString();
      } else {
        // Fallback: usa 30 dias a partir de agora
        stripeEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      logStep("Active subscription found", {
        subscriptionId: subscription.id,
        endDate: stripeEnd,
      });

      // Obtém o product ID - pode ser string ou objeto
      const priceProduct = subscription.items.data[0]?.price?.product;
      const productId = typeof priceProduct === "string" ? priceProduct : priceProduct?.id || "";

      logStep("Product info", {
        priceProduct,
        productId,
        priceProductType: typeof priceProduct,
      });

      stripeTier = PRODUCT_TO_TIER[productId] || "aldeao";
      logStep("Determined Stripe subscription tier", {
        productId,
        stripeTier,
        mappedTiers: Object.keys(PRODUCT_TO_TIER),
      });
    } else {
      logStep("No active Stripe subscription found", { currentTier, currentExpiresAt });
    }

    // Final tier is the max between current DB tier (promo/manual) and Stripe tier.
    const finalTier = maxTier(currentTier, stripeTier);

    const finalSubscriptionEnd: string | null =
      finalTier === "aldeao"
        ? null
        : tierRank[stripeTier] > tierRank[currentTier]
          ? stripeEnd
          : tierRank[stripeTier] < tierRank[currentTier]
            ? currentExpiresAt
            : mergeExpiry(currentExpiresAt, stripeEnd);

    // Only write aldeao when the user is already aldeao.
    // This prevents promo-code tiers from being downgraded just because Stripe has no subscription.
    const shouldWrite = hasActiveSub || (currentTier === "aldeao" && finalTier === "aldeao");

    if (shouldWrite) {
      const { error: upsertError } = await supabaseClient
        .from("subscriptions")
        .upsert(
          {
            user_id: user.id,
            status: finalTier,
            expires_at: finalSubscriptionEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (upsertError) {
        logStep("Error upserting subscription", { error: upsertError.message });
      } else {
        logStep("Synced subscription in DB", {
          hasActiveSub,
          currentTier,
          stripeTier,
          finalTier,
          expires_at: finalSubscriptionEnd,
        });
      }
    } else {
      logStep("Keeping existing subscription (no Stripe downgrade)", {
        currentTier,
        currentExpiresAt,
        stripeTier,
      });
    }

    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        tier: finalTier,
        subscription_end: finalSubscriptionEnd,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
