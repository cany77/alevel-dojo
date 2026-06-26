export const SEASON_PASS_EXPIRES_AT = "2026-06-30T23:59:59.999Z";

function normalizedPlan(subscription = null) {
  if (!subscription?.plan) return "";
  if (subscription.plan === "dojo_plus") return "plus";
  if (subscription.plan === "exam_season_pass") return "season_pass";
  return subscription.plan;
}

export function hasActiveDojoPlus(subscription = null) {
  if (!subscription) return false;
  const plan = normalizedPlan(subscription);
  return (
    plan === "plus" &&
    ["active", "trialing"].includes(subscription.status)
  );
}

export function hasActiveSeasonPass(subscription = null, now = new Date()) {
  if (!subscription || normalizedPlan(subscription) !== "season_pass") return false;
  if (!["active", "paid"].includes(subscription.status)) return false;
  const expiresAt = subscription.season_expires_at || SEASON_PASS_EXPIRES_AT;
  return new Date(expiresAt).getTime() > now.getTime();
}

export function hasPaidAccess(subscription = null, now = new Date()) {
  return hasActiveDojoPlus(subscription) || hasActiveSeasonPass(subscription, now);
}

export function subscriptionLabel(subscription = null) {
  if (hasActiveDojoPlus(subscription)) return "Dojo Plus";
  if (hasActiveSeasonPass(subscription)) return "Exam Season Pass";
  return "Free";
}
