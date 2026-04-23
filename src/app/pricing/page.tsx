"use client";

import { useMemo, useState } from "react";

type Plan = "growth" | "scale";

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const annualFactor = billing === "annual" ? 0.8 : 1;

  const growthPrice = useMemo(() => Math.round(1499 * annualFactor), [annualFactor]);
  const scalePrice = useMemo(() => Math.round(3999 * annualFactor), [annualFactor]);

  const startCheckout = async (plan: Plan) => {
    setLoadingPlan(plan);
    try {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employer_email: email,
          company_name: companyName,
          payment_method_id: paymentMethodId,
          plan,
          billing_cycle: billing,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        alert(data.error || "Could not create subscription.");
        return;
      }
      alert("Subscription created successfully.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main className="bg-[#0D1B2A] text-white">
      <section className="container-site section-y-tight">
        <h1 className="text-center text-4xl font-semibold md:text-5xl">Simple, transparent pricing</h1>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`rounded-full border px-4 py-2 text-sm ${billing === "monthly" ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-white/20 text-white/70"}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={`rounded-full border px-4 py-2 text-sm ${billing === "annual" ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-white/20 text-white/70"}`}
          >
            Annual
          </button>
          <span className="rounded-full bg-[#C9A84C]/20 px-3 py-1 text-xs font-semibold text-[#C9A84C]">Save 20%</span>
        </div>
      </section>

      <section className="container-site pb-12">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/15 bg-white/[0.03] p-6">
            <span className="rounded-full border border-[#C9A84C]/40 px-3 py-1 text-xs text-[#C9A84C]">Start Free</span>
            <h2 className="mt-4 text-2xl font-semibold">Trial</h2>
            <p className="mt-1 text-white/70">7 zile gratuit</p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>1 cerere candidați</li>
              <li>Preview candidați anonimi</li>
              <li>Fără date contact</li>
            </ul>
            <a href="/become-a-partner#trial" className="mt-6 inline-flex rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold">
              Start Free Trial
            </a>
          </article>

          <article className="rounded-2xl border border-[#C9A84C]/40 bg-white/[0.04] p-6">
            <span className="rounded-full bg-[#C9A84C] px-3 py-1 text-xs font-semibold text-[#0D1B2A]">Most Popular</span>
            <h2 className="mt-4 text-2xl font-semibold">Growth</h2>
            <p className="mt-1 text-white/70">{growthPrice.toLocaleString("nb-NO")} NOK / month</p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>5 cereri/lună</li>
              <li>Date contact incluse</li>
              <li>2 job posts active</li>
              <li>Quick Match 3x/lună</li>
            </ul>
            <button
              type="button"
              onClick={() => void startCheckout("growth")}
              className="mt-6 rounded-xl bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A]"
            >
              {loadingPlan === "growth" ? "Processing..." : "Get Started"}
            </button>
          </article>

          <article className="rounded-2xl border border-white/15 bg-white/[0.03] p-6">
            <h2 className="mt-4 text-2xl font-semibold">Scale</h2>
            <p className="mt-1 text-white/70">{scalePrice.toLocaleString("nb-NO")} NOK / month</p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>Cereri nelimitate</li>
              <li>Date contact nelimitate</li>
              <li>Job posts nelimitate</li>
              <li>Quick Match nelimitat</li>
              <li>Priority processing</li>
            </ul>
            <button
              type="button"
              onClick={() => void startCheckout("scale")}
              className="mt-6 rounded-xl bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A]"
            >
              {loadingPlan === "scale" ? "Processing..." : "Get Started"}
            </button>
          </article>
        </div>

        <div className="mt-5 rounded-2xl border border-[#C9A84C]/35 bg-gradient-to-r from-[#C9A84C]/20 to-[#C9A84C]/5 p-6">
          <h3 className="text-2xl font-semibold">Enterprise</h3>
          <p className="mt-2 text-white/80">Custom pricing. Dedicated ATS. Contract-based.</p>
          <a href="/contact" className="mt-4 inline-flex rounded-xl bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A]">
            Contact Us
          </a>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-lg font-semibold">Checkout details</h3>
          <p className="mt-1 text-sm text-white/60">
            Enter billing fields used by Stripe subscription API (`payment_method_id` from Stripe Elements/SetupIntent).
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Work email"
              className="rounded-xl border border-white/20 bg-[#0D1B2A] px-3 py-2 text-sm"
            />
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name"
              className="rounded-xl border border-white/20 bg-[#0D1B2A] px-3 py-2 text-sm"
            />
            <input
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              placeholder="pm_..."
              className="rounded-xl border border-white/20 bg-[#0D1B2A] px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="container-site pb-16">
        <h3 className="text-2xl font-semibold">FAQ</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <FaqItem q="Can I switch plans later?" a="Yes. You can upgrade from Growth to Scale any time from the subscription dashboard." />
          <FaqItem q="What happens when Growth limit is reached?" a="After 5 monthly requests, new requests are blocked until renewal or upgrade." />
          <FaqItem q="Is there a contract?" a="Growth and Scale are monthly subscriptions. Enterprise can be contract-based." />
          <FaqItem q="Do you provide invoices?" a="Yes. Stripe generates invoices for each paid period." />
        </div>
      </section>
    </main>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h4 className="text-base font-semibold">{q}</h4>
      <p className="mt-1 text-sm text-white/70">{a}</p>
    </article>
  );
}
