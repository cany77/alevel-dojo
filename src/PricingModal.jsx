import React from "react";
import { Check, Sparkles, X } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "£0",
    badge: "Start here",
    text: "Explore A-Level Dojo and build your revision base.",
    features: [
      "Browse subjects",
      "Limited paper previews",
      "Save selected subjects",
      "Basic dashboard",
      "Basic progress tracking",
    ],
    cta: "Create account",
    highlight: false,
  },
  {
    name: "Dojo Plus",
    price: "Coming soon",
    badge: "Best for revision",
    text: "Everything serious students need for paper practice.",
    features: [
      "Unlimited paper previews/downloads",
      "PDF editor",
      "Topic tests",
      "Save papers",
      "Mark complete",
      "Mistakes tracker",
      "Exam calendar",
      "Grade boundary insights",
    ],
    cta: "Join waitlist",
    highlight: true,
  },
  {
    name: "Dojo Pro",
    price: "Coming soon",
    badge: "AI powered",
    text: "Personalized revision with deeper analytics and AI support.",
    features: [
      "Everything in Plus",
      "AI tutor",
      "Personalized AI profile",
      "Weak-topic recommendations",
      "Topic-test generator from past papers",
      "Advanced analytics",
      "Priority new resources",
    ],
    cta: "Join waitlist",
    highlight: false,
  },
];

export default function PricingModal({
  open,
  onClose,
  onOpenAuth = () => {},
  user = null,
}) {
  if (!open) return null;

  function handleFree() {
    if (!user) onOpenAuth();
    onClose();
  }

  function handleWaitlist(planName) {
    window.alert(`${planName} is coming soon. You are on the early-access list.`);
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
              Pick the revision setup that gets used.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
              Start free, then upgrade when you want unlimited papers, smarter tracking, and AI revision tools.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/55 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.08]"
            aria-label="Close pricing"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
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
                  {plan.badge}
                </span>
              </div>

              <p className="mt-6 text-3xl font-black text-white">{plan.price}</p>

              <ul className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6 text-white/62">
                    <Check className="mt-0.5 shrink-0 text-cyan-200" size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => (plan.name === "Free" ? handleFree() : handleWaitlist(plan.name))}
                className={`mt-6 w-full rounded-2xl px-5 py-3 text-sm font-black transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                  plan.highlight
                    ? "bg-gradient-to-r from-rose-400 to-violet-500 text-white shadow-lg shadow-violet-500/20"
                    : "border border-white/10 bg-white/[0.05] text-white/75 hover:bg-white/[0.08]"
                }`}
              >
                {plan.cta}
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
