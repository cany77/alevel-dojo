import { getUserFromAccessToken } from "./_lib/supabaseAdmin.js";

function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

function siteUrl() {
  return (process.env.VITE_SITE_URL || "https://aleveldojo.com").replace(/\/$/, "");
}

function stripeForm(data) {
  const body = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) body.append(key, String(value));
  });
  return body;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return sendJson(response, 500, {
      error: "Missing environment variable",
      missing: "STRIPE_SECRET_KEY",
    });
  }

  const authHeader = request.headers.authorization || "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!accessToken) return sendJson(response, 401, { error: "You must be signed in to upgrade." });

  let user;
  try {
    user = await getUserFromAccessToken(accessToken);
  } catch (error) {
    if (error.code === "MISSING_ENV") {
      return sendJson(response, 500, {
        error: "Missing environment variable",
        missing: error.missing,
      });
    }
    console.error("Checkout auth lookup failed:", error);
    return sendJson(response, 500, { error: "Could not verify your session." });
  }
  if (!user?.id || !user?.email) return sendJson(response, 401, { error: "You must be signed in to upgrade." });

  const plan = String(request.body?.plan || "").trim();
  const isPlus = plan === "plus";
  const isSeasonPass = plan === "season_pass";
  if (!isPlus && !isSeasonPass) return sendJson(response, 400, { error: "Unknown plan." });

  const priceId = isPlus
    ? process.env.STRIPE_PLUS_PRICE_ID
    : process.env.STRIPE_SEASON_PASS_PRICE_ID;
  if (!priceId) {
    return sendJson(response, 500, {
      error: "Missing environment variable",
      missing: isPlus ? "STRIPE_PLUS_PRICE_ID" : "STRIPE_SEASON_PASS_PRICE_ID",
    });
  }

  const checkoutMode = isPlus ? "subscription" : "payment";
  const appUrl = siteUrl();
  const successUrl = `${appUrl}/?checkout=success&plan=${encodeURIComponent(plan)}`;
  const cancelUrl = `${appUrl}/?checkout=cancelled`;

  const checkoutPayload = {
    mode: checkoutMode,
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: user.id,
    customer_email: user.email,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": 1,
    "metadata[user_id]": user.id,
    "metadata[plan]": isPlus ? "plus" : "season_pass",
    "metadata[season_expires_at]": isSeasonPass ? "2026-06-30T23:59:59.999Z" : "",
    "subscription_data[metadata][user_id]": isPlus ? user.id : undefined,
    "subscription_data[metadata][plan]": isPlus ? "plus" : undefined,
  };

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: stripeForm(checkoutPayload),
  });

  const session = await stripeResponse.json();
  if (!stripeResponse.ok) {
    console.error("Stripe checkout session failed:", session);
    return sendJson(response, 500, { error: "Could not start Stripe Checkout." });
  }

  return sendJson(response, 200, { url: session.url });
}
