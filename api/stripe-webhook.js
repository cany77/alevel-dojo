import crypto from "node:crypto";
import { upsertSubscription } from "./_lib/supabaseAdmin.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("Missing STRIPE_WEBHOOK_SECRET.");

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

function unixToIso(value) {
  return value ? new Date(value * 1000).toISOString() : null;
}

async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.user_id || session.client_reference_id;
  const plan = session.metadata?.plan;
  if (!userId || !plan) return;

  if (plan === "dojo_plus") {
    await upsertSubscription({
      user_id: userId,
      plan: "dojo_plus",
      status: "active",
      stripe_customer_id: session.customer || null,
      stripe_subscription_id: session.subscription || null,
      stripe_checkout_session_id: session.id,
      current_period_end: null,
      season_expires_at: null,
    });
    return;
  }

  if (plan === "exam_season_pass") {
    await upsertSubscription({
      user_id: userId,
      plan: "exam_season_pass",
      status: "active",
      stripe_customer_id: session.customer || null,
      stripe_subscription_id: null,
      stripe_checkout_session_id: session.id,
      current_period_end: null,
      season_expires_at: session.metadata?.season_expires_at || "2026-06-30T23:59:59.999Z",
    });
  }
}

async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  await upsertSubscription({
    user_id: userId,
    plan: subscription.metadata?.plan || "dojo_plus",
    status: subscription.status,
    stripe_customer_id: subscription.customer || null,
    stripe_subscription_id: subscription.id,
    current_period_end: unixToIso(subscription.current_period_end),
    season_expires_at: null,
  });
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const payload = await rawBody(request);
  const signatureHeader = request.headers["stripe-signature"];

  try {
    if (!verifyStripeSignature(payload, signatureHeader)) {
      return sendJson(response, 400, { error: "Invalid signature." });
    }
  } catch (error) {
    console.error("Stripe webhook signature check failed:", error);
    return sendJson(response, 400, { error: "Invalid webhook configuration." });
  }

  const event = JSON.parse(payload);

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object);
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await handleSubscriptionUpdated(event.data.object);
    }

    return sendJson(response, 200, { received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    return sendJson(response, 500, { error: "Webhook handling failed." });
  }
}
