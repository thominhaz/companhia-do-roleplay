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

// Preços em centavos
const PRICE_AMOUNTS: Record<string, number> = {
  "price_1SgQwiQPJCHLjWYJdheLim2i": 890,  // Herói mensal
  "price_1ShEezQPJCHLjWYJypHN0lwu": 2290, // Herói trimestral
  "price_1SgQyCQPJCHLjWYJXhoCJ3d4": 7990, // Herói anual
  "price_1SgR0lQPJCHLjWYJjv3gTsOE": 1890, // Mestre mensal
  "price_1ShEfiQPJCHLjWYJe1QLo6VV": 4990, // Mestre trimestral
  "price_1SgR17QPJCHLjWYJKJwM9AhZ": 17990, // Mestre anual
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

    logStep("Current subscription", { 
      subscriptionId: subscription.id, 
      currentPriceId,
      newPriceId
    });

    // Determine current plan name
    let currentPlanName = "Desconhecido";
    let currentPeriod = "mensal";
    for (const [plan, prices] of Object.entries(PRICE_IDS)) {
      for (const [periodKey, priceId] of Object.entries(prices)) {
        if (priceId === currentPriceId) {
          currentPlanName = PLAN_NAMES[plan] || plan;
          currentPeriod = periodKey;
          break;
        }
      }
    }
    
    logStep("Plan details", { currentPlanName, currentPeriod, newPlanName: PLAN_NAMES[newPlan], newPeriod: period });

    // Use Stripe's preview to get accurate proration
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

    logStep("Stripe preview invoice", {
      total: previewInvoice.total,
      subtotal: previewInvoice.subtotal,
      linesCount: previewInvoice.lines.data.length,
    });

    // Analyze invoice lines for credit and charge breakdown
    const lines = previewInvoice.lines.data as Array<{ amount: number; description?: string; type?: string }>;
    
    let creditAmount = 0;
    let chargeAmount = 0;
    
    for (const line of lines) {
      logStep("Invoice line", { amount: line.amount, description: line.description });
      if (line.amount < 0) {
        creditAmount += Math.abs(line.amount);
      } else {
        chargeAmount += line.amount;
      }
    }

    // Convert from cents to BRL
    const creditAmountBRL = creditAmount / 100;
    const chargeAmountBRL = chargeAmount / 100;
    const prorationAmountBRL = previewInvoice.total / 100;

    // Next billing date / remaining days
    const currentPeriodEnd = subscription.current_period_end;

    let nextBillingDateIso: string | null = null;
    let daysRemaining: number | null = null;

    if (typeof currentPeriodEnd === "number" && Number.isFinite(currentPeriodEnd) && currentPeriodEnd > 0) {
      const periodEndMs = currentPeriodEnd * 1000;
      const nextBillingDate = new Date(periodEndMs);
      if (!Number.isNaN(nextBillingDate.getTime())) {
        nextBillingDateIso = nextBillingDate.toISOString();
        daysRemaining = Math.max(0, Math.ceil((periodEndMs - Date.now()) / (1000 * 60 * 60 * 24)));
      }
    }

    logStep("Preview calculated", {
      prorationAmountBRL,
      creditAmountBRL,
      chargeAmountBRL,
      currentPeriodEnd,
      daysRemaining,
      nextBillingDateIso,
    });

    return new Response(
      JSON.stringify({
        success: true,
        currentPlan: currentPlanName,
        currentPeriod,
        newPlan: PLAN_NAMES[newPlan] || newPlan,
        newPeriod: period,
        prorationAmount: prorationAmountBRL,
        creditAmount: creditAmountBRL,
        chargeAmount: chargeAmountBRL,
        currency: "BRL",
        nextBillingDate: nextBillingDateIso,
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
