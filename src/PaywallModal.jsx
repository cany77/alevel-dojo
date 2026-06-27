import React, { useState } from "react";
import { Check, Loader2, Lock, Sparkles, X } from "lucide-react";
import { supabase } from "./supabaseClient";

const paidPlans = [
  {
    id: "plus",
    name: "Dojo Plus",
    price: "$7.99",
    cadence: "per month",
    cta: "Get Dojo Plus",
    accent: "from-cyan-300 to-violet-500",
    text: "Unlimited downloads, topic tests, PDF export, calendar, mistakes tracker, grade boundaries, and AI Tutor.",
  },
  {
    id: "season_pass",
    name: "Exam Season Pass",
    price: "$32.99",
    cadence: "one-time, until 30 June 2026",
    cta: "Get Season Pass",
    accent: "from-rose-400 to-violet-500",
    text: "Premium access for the exam season without a monthly renewal.",
  },
];

export default function PaywallModal({
  open,
  onClose,
  onOpenAuth = () => {},
  user = null,
  title = "Upgrade to continue",
  message = "This feature is included with Dojo Plus and Exam Season Pass.",
  usageText = "",
}) {
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

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
        body: JSON.stringify({
          plan: planId,
          user_id: user.id,
          email: user.email,
        }),
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

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center overflow-y-auto bg-black/72 px-4 py-6 text-white backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-[#0b1020] shadow-2xl shadow-black/45">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              <Lock size={14} /> Free plan limit
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight">{title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">{message}</p>
            {usageText && (
              <p className="mt-3 rounded-2xl border border-violet-300/20 bg-violet-300/10 px-4 py-3 text-sm font-bold text-violet-100">
                {usageText}
              </p>
            )}
            {error && (
              <p className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100">
                {error}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/55 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.08]"
            aria-label="Close paywall"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          {paidPlans.map((plan) => {
            const loading = loadingPlan === plan.id;
            return (
              <article key={plan.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-black">{plan.name}</p>
                    <p className="mt-1 text-sm leading-6 text-white/50">{plan.text}</p>
                  </div>
                  <Sparkles className="shrink-0 text-cyan-200" size={20} />
                </div>
                <div className="mt-5">
                  <p className="text-3xl font-black">{plan.price}</p>
                  <p className="mt-1 text-xs font-bold text-white/42">{plan.cadence}</p>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-white/62">
                  {["Unlimited weekly usage", "Premium revision tools", "Secure Stripe checkout"].map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 shrink-0 text-cyan-200" size={15} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => startCheckout(plan.id)}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${plan.accent} px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/15 transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70`}
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  {loading ? "Opening Stripe..." : plan.cta}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
