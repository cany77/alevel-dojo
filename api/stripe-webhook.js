import crypto from "node:crypto";
import { createSupabaseAdmin, getRequiredEnv, supabaseHost } from "./_lib/supabaseAdmin.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const SEASON_PASS_EXPIRES_AT = "2026-06-30T23:59:59Z";

function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

function rawBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function parseStripeSignature(header = "") {
  return Object.fromEntries(
    String(header)
      .split(",")
      .map((part) => part.split("="))
      .filter(([key, value]) => key && value)
  );
}

function verifyStripeSignature(payload, signatureHeader) {
  const webhookSecret = getRequiredEnv("STRIPE_WEBHOOK_SECRET");
  const signature = parseStripeSignature(signatureHeader);
  const timestamp = signature.t;
  const expected = signature.v1;
  if (!timestamp || !expected) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const digest = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(expected));
}

function normalizePlan(plan) {
  if (plan === "dojo_plus") return "plus";
  if (plan === "exam_season_pass") return "season_pass";
  return plan;
}

function normalizeStatus(status) {
  if (status === "paid") return "active";
  return status || "active";
}

function unixToIso(value) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function stripeApiHeaders() {
  return {
    Authorization: `Bearer ${getRequiredEnv("STRIPE_SECRET_KEY")}`,
  };
}

async function fetchStripeSubscription(subscriptionId) {
  if (!subscriptionId) return null;
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: stripeApiHeaders(),
  });
  const payload = await response.json();
  if (!response.ok) {
    console.error("Could not fetch Stripe subscription:", payload);
    return null;
  }
  return payload;
}

async function ensureSubscriptionsTable(admin) {
  const { data, error } = await admin.client.from("subscriptions").select("id").limit(1);

  if (error) {
    console.error("Supabase subscriptions table check failed:", {
      supabaseHost: supabaseHost(admin.url),
      table: "subscriptions",
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    const tableError = new Error("Supabase subscriptions table check failed");
    tableError.code = "SUBSCRIPTIONS_TABLE_CHECK_FAILED";
    tableError.details = error;
    throw tableError;
  }

  return data;
}

async function upsertSubscription(admin, row) {
  await ensureSubscriptionsTable(admin);

  const payload = {
    ...row,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin.client
    .from("subscriptions")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    console.error("Supabase subscription upsert failed:", {
      supabaseHost: supabaseHost(admin.url),
      table: "subscriptions",
      payload: {
        ...payload,
        stripe_customer_id: payload.stripe_customer_id ? "[present]" : null,
        stripe_subscription_id: payload.stripe_subscription_id ? "[present]" : null,
        stripe_checkout_session_id: payload.stripe_checkout_session_id ? "[present]" : null,
      },
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Supabase subscription upsert failed: ${JSON.stringify(error)}`);
  }

  return data;
}

async function updateSubscriptionByStripeId(admin, stripeSubscriptionId, patch) {
  if (!stripeSubscriptionId) return null;
  await ensureSubscriptionsTable(admin);

  const { data, error } = await admin.client
    .from("subscriptions")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Supabase subscription update failed:", {
      supabaseHost: supabaseHost(admin.url),
      table: "subscriptions",
      stripeSubscriptionId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Supabase subscription update failed: ${JSON.stringify(error)}`);
  }

  return data;
}

async function handleCheckoutCompleted(admin, session) {
  const userId = session.metadata?.user_id || session.client_reference_id;
  const plan = normalizePlan(session.metadata?.plan);

  if (!userId || !plan) {
    console.error("checkout.session.completed missing metadata:", {
      sessionId: session.id,
      hasUserId: Boolean(userId),
      plan,
      metadata: session.metadata || null,
    });
    const error = new Error("Missing checkout metadata");
    error.statusCode = 400;
    throw error;
  }

  if (plan === "plus") {
    const stripeSubscription =
      typeof session.subscription === "string"
        ? await fetchStripeSubscription(session.subscription)
        : null;

    return upsertSubscription(admin, {
      user_id: userId,
      plan: "plus",
      status: "active",
      stripe_customer_id: session.customer || null,
      stripe_subscription_id: session.subscription || null,
      stripe_checkout_session_id: session.id,
      current_period_end: unixToIso(stripeSubscription?.current_period_end),
      season_expires_at: null,
    });
  }

  if (plan === "season_pass") {
    return upsertSubscription(admin, {
      user_id: userId,
      plan: "season_pass",
      status: "active",
      stripe_customer_id: session.customer || null,
      stripe_subscription_id: null,
      stripe_checkout_session_id: session.id,
      current_period_end: null,
      season_expires_at: SEASON_PASS_EXPIRES_AT,
    });
  }

  const error = new Error(`Unknown checkout plan: ${plan}`);
  error.statusCode = 400;
  throw error;
}

async function handleSubscriptionUpdated(admin, subscription) {
  const userId = subscription.metadata?.user_id;
  const plan = normalizePlan(subscription.metadata?.plan || "plus");
  const row = {
    plan,
    status: normalizeStatus(subscription.status),
    stripe_customer_id: subscription.customer || null,
    stripe_subscription_id: subscription.id,
    current_period_end: unixToIso(subscription.current_period_end),
    season_expires_at: null,
  };

  if (userId) {
    return upsertSubscription(admin, {
      user_id: userId,
      ...row,
    });
  }

  return updateSubscriptionByStripeId(admin, subscription.id, row);
}

async function handleSubscriptionDeleted(admin, subscription) {
  return updateSubscriptionByStripeId(admin, subscription.id, {
    status: "canceled",
    current_period_end: unixToIso(subscription.current_period_end),
  });
}

async function handleInvoiceEvent(event) {
  const invoice = event.data.object;
  console.log("Stripe invoice event received:", {
    type: event.type,
    invoiceId: invoice.id,
    subscription: invoice.subscription || null,
    customer: invoice.customer || null,
    status: invoice.status || null,
  });
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  let admin;
  try {
    getRequiredEnv("STRIPE_WEBHOOK_SECRET");
    getRequiredEnv("STRIPE_SECRET_KEY");
    admin = createSupabaseAdmin();
  } catch (error) {
    console.error("Stripe webhook missing configuration:", {
      missing: error.missing,
      message: error.message,
    });
    return sendJson(response, 500, {
      error: "Missing environment variable",
      missing: error.missing || error.message,
    });
  }

  const payload = await rawBody(request);
  const signatureHeader = request.headers["stripe-signature"];

  try {
    if (!verifyStripeSignature(payload, signatureHeader)) {
      return sendJson(response, 400, { error: "Invalid signature." });
    }
  } catch (error) {
    console.error("Stripe webhook signature check failed:", error);
    return sendJson(response, 400, {
      error: "Invalid webhook configuration",
      message: error.message,
    });
  }

  const event = JSON.parse(payload);

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(admin, event.data.object);
    } else if (event.type === "customer.subscription.updated") {
      await handleSubscriptionUpdated(admin, event.data.object);
    } else if (event.type === "customer.subscription.deleted") {
      await handleSubscriptionDeleted(admin, event.data.object);
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      await handleInvoiceEvent(event);
    }

    return sendJson(response, 200, { received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    if (error.code === "SUBSCRIPTIONS_TABLE_CHECK_FAILED") {
      return sendJson(response, 500, {
        error: "Supabase subscriptions table check failed",
        details: error.details,
      });
    }

    return sendJson(response, error.statusCode || 500, {
      error: "Webhook handling failed",
      message: error.message,
    });
  }
}
