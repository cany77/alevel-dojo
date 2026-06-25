import React, { useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { supabase } from "./supabaseClient";
import { hasActiveDojoPlus, hasActiveSeasonPass, subscriptionLabel } from "./subscriptionAccess";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    badge: "Default",
    text: "Start your revision setup and keep your subjects organised.",
    features: [
      "Browse subjects",
      "Save selected subjects",
      "Basic dashboard",
      "Basic progress tracking",
      "Limited previews",
    ],
    cta: "Use Free",
    highlight: false,
  },
  {
    id: "plus",
    name: "Dojo Plus",
    price: "$7.99",
    cadence: "per month",
    badge: "Most flexible",
    text: "Unlock premium revision tools while you study through the year.",
    features: [
      "Unlimited paper previews/downloads",
      "PDF editor",
      "Topic tests",
      "Save papers and mark complete",
      "Mistakes tracker",
      "Exam calendar",
      "Grade boundary insights",
      "AI Tutor access",
    ],
    cta: "Start Dojo Plus",
    highlight: true,
  },
  {
    id: "season_pass",
    name: "Exam Season Pass",
    price: "$32.99",
    cadence: "one-time, expires 30 June 2026",
    badge: "Exam season",
    text: "One payment for premium access through this exam season.",
    features: [
      "Everything in Dojo Plus",
      "No monthly renewal",
      "Premium access until 30 June 2026",
      "Ideal for final exam preparation",
    ],
    cta: "Buy Season Pass",
    highlight: false,
  },
];

export default function PricingModal({
  open,
  onClose,
  onOpenAuth = () => {},
  user = null,
  subscription = null,
  onSubscriptionRefresh = () => {},
}) {
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const currentPlan = subscriptionLabel(subscription);

  function handleFree() {
    if (!user) onOpenAuth();
    onClose();
  }

  async function startCheckout(planId) {
    setError("");
    if (!user) {
      onOpenAuth();
      return;
    }

    setLoadingPlan(planId);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in again before upgrading.");

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planId }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Could not start Stripe Checkout.");
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(checkoutError.message || "Could not start Stripe Checkout.");
      setLoadingPlan("");
    }
  }

  function isCurrent(planId) {
    if (planId === "free") return currentPlan === "Free";
    if (planId === "plus") return hasActiveDojoPlus(subscription);
    if (planId === "season_pass") return hasActiveSeasonPass(subscription);
    return false;
  }

  return (
    <div className="fixed inset-0 z-[1200] overflow-y-auto bg-black/70 px-4 py-6 text-white backdrop-blur-sm">
      <div className="mx-auto w-full max-w-6xl rounded-[2rem] border border-white/10 bg-[#0b1020] shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              <Sparkles size={14} /> Pricing
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Unlock the full Dojo.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
              You are currently on <span className="font-black text-cyan-100">{currentPlan}</span>. Upgrade through Stripe Checkout when you want premium revision tools.
            </p>
            {error && (
              <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100">
                {error}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              onSubscriptionRefresh();
              onClose();
            }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/55 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.08]"
            aria-label="Close pricing"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const current = isCurrent(plan.id);
            const loading = loadingPlan === plan.id;
            const buttonLabel = current
              ? "Current plan"
              : loading
              ? "Opening Stripe..."
              : plan.cta;

            return (
              <article
                key={plan.id}
                className={`rounded-3xl border p-5 ${
                  plan.highlight
                    ? "border-violet-300/40 bg-[radial-gradient(circle_at_18%_0%,rgba(167,139,250,0.24),transparent_34%),rgba(255,255,255,0.055)] shadow-2xl shadow-violet-500/10"
                    : "border-white/10 bg-white/[0.035]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-black">{plan.name}</p>
                    <p className="mt-1 text-sm text-white/45">{plan.text}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/60">
                    {current ? "Active" : plan.badge}
                  </span>
                </div>

                <div className="mt-6">
                  <p className="text-3xl font-black text-white">{plan.price}</p>
                  <p className="mt-1 text-xs font-bold text-white/40">{plan.cadence}</p>
                </div>

                <ul className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm leading-6 text-white/62">
                      <Check className="mt-0.5 shrink-0 text-cyan-200" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={current || loading}
                  onClick={() => (plan.id === "free" ? handleFree() : startCheckout(plan.id))}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-rose-400 to-violet-500 text-white shadow-lg shadow-violet-500/20"
                      : "border border-white/10 bg-white/[0.05] text-white/75 hover:bg-white/[0.08]"
                  }`}
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  {buttonLabel}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
