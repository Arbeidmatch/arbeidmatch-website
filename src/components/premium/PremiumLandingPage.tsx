"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import ExitIntentDiscount from "@/components/premium/ExitIntentDiscount";
import pm from "@/components/premium/premiumMarketing.module.css";

const NAVY = "#0f1923";
const GOLD = "#C9A84C";

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 12a9 9 0 0 1-9 9 3.5 3.5 0 0 1-1-.1" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M3 12a9 9 0 0 1 9-9 3.5 3.5 0 0 1 1 .1" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M8 12H3M21 12h-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5} />
      <path d="M3 12h18M12 3a16 16 0 0 0 0 18M12 3a16 16 0 0 1 0 18" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconFileText({ className }: { className?: string }) {
  return (
    <svg className={className} width={28} height={28} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M8 13h8M8 17h6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} width={28} height={28} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.5} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} width={28} height={28} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7" stroke="currentColor" strokeWidth={1.5} />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke={GOLD} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function StarRow() {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={16} height={16} viewBox="0 0 24 24" fill={GOLD} className="text-[#C9A84C]">
          <path d="M12 2l2.9 7.4H22l-6 4.6 2.3 7L12 16.9 5.7 21 8 14.6 2 9.4h7.1z" />
        </svg>
      ))}
    </div>
  );
}

export default function PremiumLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [footerEmail, setFooterEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  const locked = searchParams.get("locked") === "true";
  const checkoutFailed = searchParams.get("checkout") === "failed";

  useEffect(() => {
    if (locked) setMsg("Sign in with your email to continue reading Premium guides.");
  }, [locked]);

  useEffect(() => {
    if (checkoutFailed) setMsg("Checkout could not be confirmed. Please try again or contact support.");
  }, [checkoutFailed]);

  const submit = useCallback(
    async (rawEmail: string) => {
      const e = rawEmail.trim().toLowerCase();
      if (!e || !e.includes("@")) {
        setMsg("Please enter a valid work email.");
        return;
      }
      setBusy(true);
      setMsg(null);
      try {
        const check = await fetch("/api/premium/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: e }),
        });
        const c = (await check.json()) as {
          isNew?: boolean;
          hasAccess?: boolean;
          error?: string;
        };
        if (!check.ok) throw new Error(c.error || "Could not verify email.");

        if (c.hasAccess) {
          router.push("/premium/browse");
          return;
        }

        if (c.isNew) {
          const start = await fetch("/api/premium/start-trial", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: e }),
          });
          const s = (await start.json()) as { requiresPayment?: boolean; error?: string };
          if (!start.ok) throw new Error(s.error || "Could not start trial.");
          if (s.requiresPayment) {
            setMsg("Your free trial has ended. Choose a plan to continue.");
            setShowPricing(true);
            return;
          }
          router.push("/premium/browse");
          return;
        }

        const start = await fetch("/api/premium/start-trial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: e }),
        });
        const s = (await start.json()) as { requiresPayment?: boolean; hasAccess?: boolean; error?: string };
        if (!start.ok) throw new Error(s.error || "Could not continue.");
        if (s.hasAccess) {
          router.push("/premium/browse");
          return;
        }
        if (s.requiresPayment) {
          setMsg("Your free trial has ended. Choose a plan to continue.");
          setShowPricing(true);
          return;
        }
        router.push("/premium/browse");
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  const startCheckout = useCallback(
    async (plan: "monthly" | "annual") => {
      const e = email.trim() || footerEmail.trim();
      if (!e) {
        setMsg("Enter your email above before choosing a plan.");
        setShowPricing(true);
        return;
      }
      setBusy(true);
      try {
        const res = await fetch("/api/premium/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: e, plan, withDiscount: false }),
        });
        const data = (await res.json()) as { checkoutUrl?: string; error?: string };
        if (!res.ok || !data.checkoutUrl) throw new Error(data.error || "Checkout unavailable.");
        window.location.href = data.checkoutUrl;
      } catch (er) {
        setMsg(er instanceof Error ? er.message : "Checkout failed.");
      } finally {
        setBusy(false);
      }
    },
    [email, footerEmail],
  );

  const features = useMemo(
    () => [
      {
        icon: <IconFileText className="text-[#C9A84C]" />,
        title: "In-Depth Legal Guides",
        body: "Step-by-step guides on DSB approvals, employment contracts, worker rights, tax registration, and more. Not summaries. Complete, actionable information.",
      },
      {
        icon: <IconRefresh className="text-[#C9A84C]" />,
        title: "Always Up to Date",
        body: "Our guides are reviewed and updated when Norwegian regulations change. Publication date and last updated date are shown on every article.",
      },
      {
        icon: <IconShield className="text-[#C9A84C]" />,
        title: "Official Sources Only",
        body: "Every claim is sourced from DSB, Arbeidstilsynet, Skatteetaten, NAV, Lovdata, or other official Norwegian authorities. No guesswork, no invented information.",
      },
      {
        icon: <IconUsers className="text-[#C9A84C]" />,
        title: "For Workers and Employers",
        body: "Separate tracks for EU/EEA candidates looking for work in Norway, and for Norwegian employers hiring internationally. Find what is relevant to you.",
      },
      {
        icon: <IconGlobe className="text-[#C9A84C]" />,
        title: "Plain English",
        body: "Norwegian labor law is complex. We translate it into clear, practical English that anyone can understand regardless of their background or nationality.",
      },
      {
        icon: <IconBell className="text-[#C9A84C]" />,
        title: "Early Access to New Guides",
        body: "Premium subscribers receive new guides before they are made publicly available. Stay ahead of regulatory changes that affect your work or your business.",
      },
    ],
    [],
  );

  return (
    <div className="bg-[#0f1923] text-white" style={{ backgroundColor: NAVY }}>
      <ExitIntentDiscount email={email || footerEmail} />

      <section className="px-6 pb-12 pt-16 md:px-10 md:pb-20 md:pt-[100px]">
        <div className="mx-auto max-w-[1100px]">
          <div
            className={`${pm.heroBadge} inline-flex rounded-full border px-5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em]`}
            style={{ backgroundColor: "rgba(201,168,76,0.1)", borderColor: "rgba(201,168,76,0.3)", color: GOLD }}
          >
            ArbeidMatch Premium. Knowledge that works for you.
          </div>
          <h1
            className={`${pm.fadeUp} mt-6 max-w-[920px] font-extrabold tracking-[-0.02em] text-white`}
            style={{
              fontSize: "clamp(36px,5vw,64px)",
              lineHeight: 1.1,
              animationDelay: "100ms",
            }}
          >
            Everything EU/EEA Workers and Employers Need to Know About Working in Norway.
          </h1>
          <p
            className={`${pm.fadeUp} mt-6 max-w-[620px] text-lg leading-[1.7] text-white/65`}
            style={{ animationDelay: "200ms" }}
          >
            Accurate, updated guides on Norwegian labor law, DSB approvals, workers rights, employment contracts, tax,
            and more. Written in plain English. Sourced from official Norwegian authorities.
          </p>

          <form
            className={`${pm.fadeUp} mt-10 flex max-w-[720px] flex-col gap-3 md:flex-row md:items-start`}
            style={{ animationDelay: "300ms" }}
            onSubmit={(ev) => {
              ev.preventDefault();
              void submit(email);
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              className="w-full max-w-[380px] rounded-[10px] border border-white/12 bg-white/[0.06] px-5 py-3.5 text-[15px] text-white placeholder:text-white/35"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-[10px] bg-[#C9A84C] px-7 py-3.5 text-[15px] font-bold text-[#0f1923] transition-opacity disabled:opacity-60"
            >
              {busy ? "Please wait…" : "Start Free 24h Trial"}
            </button>
          </form>
          <p className="mt-2.5 text-[12px] text-white/40">No credit card required for trial. Cancel anytime.</p>
          {msg ? <p className="mt-4 max-w-xl text-sm text-amber-200/90">{msg}</p> : null}

          <div
            className={`${pm.fadeUp} mt-14 flex flex-wrap items-center justify-center gap-8 md:gap-10`}
            style={{ animationDelay: "400ms" }}
          >
            {[
              { icon: <IconShield className="text-[#C9A84C]" />, t: "Official Norwegian sources only" },
              { icon: <IconRefresh className="text-[#C9A84C]" />, t: "Updated regularly" },
              { icon: <IconGlobe className="text-[#C9A84C]" />, t: "Written in English" },
              { icon: <IconLock className="text-[#C9A84C]" />, t: "Cancel anytime" },
            ].map((x) => (
              <div key={x.t} className="flex items-center gap-2">
                {x.icon}
                <span className="text-[13px] text-white/50">{x.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.02] px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#C9A84C]">What you get with Premium</p>
          <h2 className="mt-3 text-4xl font-bold text-white">The most complete English-language resource for working in Norway.</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`${pm.staggerCard} rounded-[14px] border-[0.5px] border-white/[0.08] bg-white/[0.04] p-6 transition-[border-color,transform] duration-200 md:hover:-translate-y-0.5 md:hover:border-[rgba(201,168,76,0.35)]`}
                style={{ animationDelay: `${100 + i * 100}ms` }}
              >
                {f.icon}
                <p className="mt-4 text-lg font-semibold text-white">{f.title}</p>
                <p className="mt-2 text-[13px] leading-[1.7] text-white/65">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#C9A84C]">Simple pricing</p>
          <h2 className="mt-3 text-4xl font-bold text-white">Start free. Stay informed.</h2>
        </div>
        <div
          className={`mx-auto mt-12 grid max-w-[760px] grid-cols-1 gap-5 md:grid-cols-2 ${showPricing || locked ? "" : "opacity-100"}`}
        >
          <div className="rounded-[14px] border-[0.5px] border-white/[0.08] bg-white/[0.04] p-7">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-white/50">Monthly</p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white">EUR 10</span>
              <span className="text-base text-white/50">/month</span>
            </p>
            <ul className="mt-6 space-y-2.5 text-left text-sm text-white">
              {[
                "Access to all premium articles and guides",
                "New guides as they are published",
                "Cancel anytime, no commitment",
                "24-hour free trial for new accounts",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <IconCheck className="mt-0.5 shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void startCheckout("monthly")}
              disabled={busy}
              className="mt-8 w-full rounded-[10px] bg-[#C9A84C] py-4 text-[15px] font-bold text-[#0f1923] disabled:opacity-60"
            >
              Start Free Trial
            </button>
            <p className="mt-3 text-center text-[11px] text-white/40">No credit card required to start trial</p>
          </div>

          <div className="relative rounded-[14px] border-2 border-[#C9A84C] bg-white/[0.04] p-7">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-[20px] bg-[#C9A84C] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0f1923]">
              Best Value. Save EUR 40/year.
            </div>
            <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-white/50">Annual</p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white">EUR 80</span>
              <span className="text-base text-white/50">/year</span>
            </p>
            <p className="mt-2 text-[13px] text-white/50">Equivalent to EUR 6.67 per month</p>
            <ul className="mt-6 space-y-2.5 text-left text-sm text-white">
              {[
                "Everything in Monthly",
                "Priority access to new content",
                "Locked-in price guarantee for 12 months",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <IconCheck className="mt-0.5 shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void startCheckout("annual")}
              disabled={busy}
              className="mt-8 w-full rounded-[10px] bg-[#C9A84C] py-4 text-[15px] font-bold text-[#0f1923] disabled:opacity-60"
            >
              Start Free Trial
            </button>
            <p className="mt-3 text-center text-[11px] text-white/40">No credit card required to start trial</p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              quote:
                "The DSB approval guide alone saved me weeks of confusion. Everything is explained clearly and sourced from official pages. Worth every euro.",
              who: "Electrician, Poland. Working in Bergen since 2024.",
            },
            {
              quote:
                "As an employer, I finally understand what I can legally ask candidates to provide. The employment contract guide is exactly what I needed.",
              who: "Construction company owner, Trondheim.",
            },
            {
              quote:
                "I found the tax registration guide before my first week of work. Avoided mistakes that could have cost me money. Highly recommend.",
              who: "Logistics worker, Romania. Based in Stavanger.",
            },
          ].map((t) => (
            <div key={t.who} className="rounded-[14px] bg-white/[0.04] p-7">
              <StarRow />
              <p className="mt-4 text-[15px] leading-relaxed text-white/85">{t.quote}</p>
              <p className="mt-4 text-[13px] text-white/45">{t.who}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-20" style={{ backgroundColor: NAVY }}>
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="text-4xl font-bold text-white">The information is there. Now it is organized for you.</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-white/60">
            Join workers and employers who use ArbeidMatch Premium to navigate Norwegian work life with confidence.
          </p>
          <form
            className="mt-10 flex flex-col items-center gap-3 md:flex-row md:justify-center"
            onSubmit={(e) => {
              e.preventDefault();
              void submit(footerEmail);
            }}
          >
            <input
              type="email"
              value={footerEmail}
              onChange={(e) => setFooterEmail(e.target.value)}
              placeholder="Enter your work email"
              className="w-full max-w-[380px] rounded-[10px] border border-white/12 bg-white/[0.06] px-5 py-3.5 text-[15px] text-white placeholder:text-white/35"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full max-w-[240px] rounded-[10px] bg-[#C9A84C] px-7 py-3.5 text-[15px] font-bold text-[#0f1923] disabled:opacity-60 md:w-auto"
            >
              Start Free 24h Trial
            </button>
          </form>
          <p className="mt-4 text-[12px] text-white/40">
            By starting a trial you agree to our{" "}
            <Link href="/terms" className="text-[#C9A84C] underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#C9A84C] underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
