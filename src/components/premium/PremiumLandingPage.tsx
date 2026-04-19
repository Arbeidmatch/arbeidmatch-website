"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  const locked = searchParams.get("locked") === "true";
  const checkoutFailed = searchParams.get("checkout") === "failed";

  useEffect(() => {
    if (locked) setBannerMsg("Sign in with your email to continue reading Premium guides.");
  }, [locked]);

  useEffect(() => {
    if (checkoutFailed) setBannerMsg("Checkout could not be confirmed. Please try again or contact support.");
  }, [checkoutFailed]);

  const handleNotify = async () => {
    setError("");
    setSuccess(false);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!consent) {
      setError("Please accept to continue.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/feature-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, feature: "premium-launch", consent: true }),
      });
      const data = (await res.json()) as { success?: boolean };
      if (data.success) {
        setSuccess(true);
        setEmail("");
        setConsent(false);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      <section className="px-6 pb-12 pt-16 md:px-10 md:pb-20 md:pt-[100px]">
        <div className="mx-auto max-w-[1100px]">
          <div className="flex flex-col items-start gap-3">
            <span
              style={{
                display: "inline-block",
                background: "rgba(226,75,74,0.12)",
                color: "#E24B4A",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                borderRadius: 20,
                padding: "4px 12px",
              }}
            >
              Coming Soon
            </span>
            <div
              className={`${pm.heroBadge} inline-flex rounded-full border px-5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em]`}
              style={{ backgroundColor: "rgba(201,168,76,0.1)", borderColor: "rgba(201,168,76,0.3)", color: GOLD }}
            >
              ArbeidMatch Premium. Knowledge that works for you.
            </div>
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

          {bannerMsg ? <p className="mt-4 max-w-xl text-sm text-amber-200/90">{bannerMsg}</p> : null}

          <div
            id="notify-form"
            className={pm.fadeUp}
            style={{ maxWidth: 480, marginTop: 32, animationDelay: "300ms" }}
          >
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 16, lineHeight: 1.6 }}>
              Premium is currently being prepared. Leave your email and we will notify you the moment it launches,
              including an exclusive early access offer.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 200,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  padding: "14px 20px",
                  color: "white",
                  fontSize: 15,
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => void handleNotify()}
                disabled={loading}
                style={{
                  background: "#C9A84C",
                  color: "#0f1923",
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "14px 28px",
                  borderRadius: 10,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {loading ? "Sending..." : "Notify Me at Launch"}
              </button>
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{ marginTop: 2, accentColor: "#C9A84C", minWidth: 16, height: 16 }}
              />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                I agree to receive updates from ArbeidMatch. I have read and accept the{" "}
                <Link href="/privacy" className="text-[#C9A84C] underline">
                  Privacy Policy
                </Link>
                . Unsubscribe anytime.
              </span>
            </label>

            {error ? <p style={{ fontSize: 13, color: "#E24B4A", marginTop: 10 }}>{error}</p> : null}

            {success ? (
              <p style={{ fontSize: 13, color: "#1D9E75", fontWeight: 500, marginTop: 10 }}>
                You are on the list. We will notify you when Premium launches, with an exclusive early offer.
              </p>
            ) : null}

            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
              No payment required. No spam. Just a launch notification.
            </p>
          </div>

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
          <h2 className="mt-3 text-4xl font-bold text-white">
            A detailed English-language overview of Norwegian labor law, DSB approvals, workers rights, employment contracts,
            tax, and more.
          </h2>
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
        <div className="mx-auto mt-12 grid max-w-[760px] grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-[14px] border-[0.5px] border-white/[0.08] bg-white/[0.04] p-7">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-white/50">Monthly</p>
            <p className="mt-4 text-lg font-semibold text-white/90">Pricing will be announced at launch.</p>
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
              onClick={() => {
                document.getElementById("notify-form")?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                width: "100%",
                marginTop: 32,
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.5)",
                fontWeight: 600,
                fontSize: 14,
                padding: "14px 24px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
              }}
            >
              Notify me at launch
            </button>
            <p className="mt-3 text-center text-[11px] text-white/40">No credit card required to start trial</p>
          </div>

          <div className="relative rounded-[14px] border-2 border-[#C9A84C] bg-white/[0.04] p-7">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-white/50">Annual</p>
            <p className="mt-4 text-lg font-semibold text-white/90">Pricing will be announced at launch.</p>
            <ul className="mt-6 space-y-2.5 text-left text-sm text-white">
              {["Everything in Monthly", "Priority access to new content"].map((t) => (
                <li key={t} className="flex gap-2">
                  <IconCheck className="mt-0.5 shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                document.getElementById("notify-form")?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                width: "100%",
                marginTop: 32,
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.5)",
                fontWeight: 600,
                fontSize: 14,
                padding: "14px 24px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
              }}
            >
              Notify me at launch
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
                "The DSB approval guide alone saved me weeks of confusion. Everything is explained clearly and sourced from official pages. Worth the investment.",
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
          <button
            type="button"
            className="mt-10 w-full max-w-[380px] rounded-[10px] border border-white/10 bg-white/[0.06] px-7 py-3.5 text-[15px] font-semibold text-white/50 transition-colors hover:bg-white/[0.08] md:mx-auto"
            onClick={() => {
              document.getElementById("notify-form")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Notify me at launch
          </button>
          <p className="mt-4 text-[12px] text-white/40">
            By requesting launch notifications you agree to our{" "}
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
