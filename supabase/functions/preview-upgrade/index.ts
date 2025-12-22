import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PREVIEW-UPGRADE] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found.");
    }
    const customerId = customers.data[0].id;

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found.");
    }

    const subscription = subscriptions.data[0];
    const subscriptionItemId = subscription.items.data[0].id;
    const currentPriceId = subscription.items.data[0].price.id;

    // Determine current plan name
    let currentPlanName = "Desconhecido";
    for (const [plan, prices] of Object.entries(PRICE_IDS)) {
      if (Object.values(prices).includes(currentPriceId)) {
        currentPlanName = PLAN_NAMES[plan] || plan;
        break;
      }
    }

    // Preview the proration
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

    const prorationAmount = previewInvoice.total / 100;
    const lines = previewInvoice.lines.data as Array<{ amount: number }>;
    const creditAmount = lines
      .filter((line: { amount: number }) => line.amount < 0)
      .reduce((sum: number, line: { amount: number }) => sum + Math.abs(line.amount), 0) / 100;
    const chargeAmount = lines
      .filter((line: { amount: number }) => line.amount > 0)
      .reduce((sum: number, line: { amount: number }) => sum + line.amount, 0) / 100;

    // Get next billing date
    const periodEndMs = subscription.current_period_end * 1000;
    const nextBillingDate = new Date(periodEndMs);
    const daysRemaining = Math.ceil((periodEndMs - Date.now()) / (1000 * 60 * 60 * 24));

    logStep("Preview calculated", { 
      prorationAmount, 
      creditAmount, 
      chargeAmount,
      linesCount: previewInvoice.lines.data.length,
      daysRemaining
    });

    return new Response(
      JSON.stringify({
        success: true,
        currentPlan: currentPlanName,
        newPlan: PLAN_NAMES[newPlan] || newPlan,
        prorationAmount,
        creditAmount,
        chargeAmount,
        currency: "BRL",
        nextBillingDate: nextBillingDate.toISOString(),
        daysRemaining,
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
