"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Briefcase, Clock, FileCheck } from "lucide-react";

const GOLD = "#C9A84C";
const NAVY = "#0f1923";

function InlineRegisterBlock({ idPrefix, onPrimaryDsb }: { idPrefix: string; onPrimaryDsb: () => void }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/guide-interest-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), specialty: "electrician", consent: true }),
      });
      const data = (await res.json()) as { success?: boolean };
      if (!res.ok || !data.success) {
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mt-8 w-full max-w-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={onPrimaryDsb}
          className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] px-8 py-3.5 text-[15px] font-bold text-[#0f1923] transition-opacity duration-200 hover:opacity-95"
          style={{ background: GOLD }}
        >
          Get the Full DSB Guide
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] border bg-transparent px-8 py-3.5 text-[15px] font-semibold transition-colors duration-200 hover:bg-[rgba(201,168,76,0.08)]"
          style={{ color: GOLD, borderColor: "rgba(201,168,76,0.45)" }}
        >
          Register for job alerts
        </button>
      </div>
      {open ? (
        <div className="mt-6 w-full max-w-md">
          {status === "success" ? (
            <p className="text-[13px]" style={{ color: GOLD }}>
              You are on the list. We will contact you when we have a match.
            </p>
          ) : (
            <form onSubmit={submit}>
              <input
                id={`${idPrefix}-email`}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full rounded-[8px] border border-white/[0.12] bg-white/[0.06] px-[14px] py-2.5 text-[13px] text-white placeholder:text-white/40"
              />
              <label className="mt-2 flex cursor-pointer items-start gap-2 text-[11px] text-white/[0.5]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 shrink-0"
                />
                <span>I agree to receive job-related emails from ArbeidMatch</span>
              </label>
              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-3 w-full rounded-[8px] py-3 text-[13px] font-semibold text-[#0f1923] disabled:opacity-60"
                style={{ background: GOLD }}
              >
                Notify me of matching jobs
              </button>
              {status === "error" ? (
                <p className="mt-2 text-[13px] text-red-400">Something went wrong. Please try again.</p>
              ) : null}
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}

function RequirementCard({
  icon,
  title,
  body,
  badge,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  badge: string;
}) {
  return (
    <article className="rounded-[20px] border border-black/[0.08] bg-white p-8">
      <div className="text-gold">{icon}</div>
      <h3 className="mt-4 text-lg font-bold text-[#0f1923]">{title}</h3>
      <p className="mt-2 text-[14px] leading-[1.7] text-[#4b5563]">{body}</p>
      <span
        className="mt-4 inline-block rounded-full px-3 py-1 text-[11px] font-semibold"
        style={{ background: "rgba(201,168,76,0.1)", color: GOLD }}
      >
        {badge}
      </span>
    </article>
  );
}

export default function ElectriciansNorwayPage() {
  const router = useRouter();

  return (
    <main>
      <section className="bg-[#0f1923] px-6 pb-10 pt-14 text-white md:pb-16 md:pt-20 lg:pb-16 lg:pt-[80px]">
        <div className="mx-auto max-w-content">
          <span
            className="inline-block rounded-full border px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{
              background: "rgba(201,168,76,0.1)",
              borderColor: "rgba(201,168,76,0.35)",
              color: GOLD,
            }}
          >
            For Electricians
          </span>
          <h1 className="mt-6 font-extrabold leading-[1.1] text-white [font-size:clamp(32px,5vw,56px)]">
            Work as a Qualified Electrician in Norway
          </h1>
          <p className="mt-5 max-w-[600px] text-[17px] leading-[1.75] text-white/[0.65]">
            Norway needs qualified electricians. As an EU/EEA citizen, you have the right to apply for work. Here is what
            you need to know before you start.
          </p>
          <InlineRegisterBlock idPrefix="hero" onPrimaryDsb={() => router.push("/dsb-support")} />
        </div>
      </section>

      <section className="bg-white px-6 py-16 md:py-16" style={{ padding: "64px 24px" }}>
        <div className="mx-auto max-w-content">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
            The basics
          </p>
          <h2 className="mt-2 text-[30px] font-bold text-[#0f1923]">Three things every EU/EEA electrician needs for Norway</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <RequirementCard
              icon={<FileCheck size={32} strokeWidth={1.5} />}
              title="DSB Authorization"
              body="DSB (Directorate for Civil Protection) is the Norwegian authority that approves foreign electricians. You need DSB authorization to work legally on electrical installations in Norway."
              badge="Required by law"
            />
            <RequirementCard
              icon={<Briefcase size={32} strokeWidth={1.5} />}
              title="Valid EU/EEA Trade Certificate"
              body="You need a recognized trade certificate or equivalent qualification from your home country. This is the starting point for your DSB application. Documents not in English, Swedish or Danish must be translated."
              badge="Part of your DSB application"
            />
            <RequirementCard
              icon={<Clock size={32} strokeWidth={1.5} />}
              title="Work Experience Documentation"
              body="At least 1 year of documented work experience in the electrical trade within the last 10 years is required. Your employer references must confirm the dates and type of work."
              badge="Minimum requirement"
            />
          </div>
        </div>
      </section>

      <section className="px-6 text-white" style={{ background: NAVY, padding: "64px 24px" }}>
        <div className="mx-auto max-w-content">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
            How long does it take?
          </p>
          <h2 className="mt-2 text-[30px] font-bold text-white">Permanent or temporary: choose your path</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article
              className="rounded-[20px] border border-[rgba(201,168,76,0.15)] px-8 py-8"
              style={{ background: "rgba(255,255,255,0.02)", borderTop: "3px solid #C9A84C" }}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: GOLD }}>
                Faster option
              </p>
              <h3 className="mt-2 text-xl font-bold text-white">Temporary Approval</h3>
              <p className="mt-3 text-[32px] font-extrabold text-white">1 to 2 months</p>
              <ul className="mt-4 flex flex-col gap-2 text-[13px] text-white/[0.7]">
                <li>Valid for maximum 12 months</li>
                <li>DSB responds within 1 month</li>
                <li>Good for project-based work</li>
                <li>Requires project description</li>
              </ul>
            </article>
            <article
              className="rounded-[20px] border border-[rgba(201,168,76,0.15)] px-8 py-8"
              style={{ background: "rgba(255,255,255,0.02)", borderTop: "3px solid #1D9E75" }}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1D9E75]">Long-term option</p>
              <h3 className="mt-2 text-xl font-bold text-white">Permanent Authorization</h3>
              <p className="mt-3 text-[32px] font-extrabold text-white">Up to 4 months</p>
              <ul className="mt-4 flex flex-col gap-2 text-[13px] text-white/[0.7]">
                <li>Valid indefinitely</li>
                <li>Required for permanent employment</li>
                <li>Recommended for relocation</li>
                <li>Full recognition of qualifications</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16" style={{ padding: "64px 24px" }}>
        <div className="mx-auto max-w-content">
          <div
            className="rounded-[8px] border-l-[3px] px-6 py-6"
            style={{ background: "rgba(201,168,76,0.06)", borderLeftColor: GOLD }}
          >
            <h2 className="text-[15px] font-semibold text-[#0f1923]">Want the complete step-by-step process?</h2>
            <p className="mt-3 text-[14px] leading-[1.7] text-[#374151]">
              The full DSB application process, required documents checklist, common rejection reasons, FSE safety
              requirements, and datacenter or naval-specific authorizations are covered in our detailed DSB Authorization
              Guide.
            </p>
            <Link
              href="/dsb-support"
              className="mt-4 inline-flex items-center justify-center rounded-[8px] px-6 py-3 text-[14px] font-bold text-[#0f1923]"
              style={{ background: GOLD }}
            >
              Get the Full Guide
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 text-white" style={{ background: NAVY, padding: "64px 24px" }}>
        <div className="mx-auto w-full max-w-2xl">
          <h2 className="text-[28px] font-bold text-white">Already have your DSB? We want to hear from you.</h2>
          <p className="mt-3 text-[15px] text-white/[0.6]">
            Register your profile and we will match you with Norwegian employers actively looking for qualified electricians.
            Our team reviews every profile and contacts you personally when we have a match.
          </p>
          <FooterRegisterForm />
        </div>
      </section>
    </main>
  );
}

function FooterRegisterForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/guide-interest-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), specialty: "electrician", consent: true }),
      });
      const data = (await res.json()) as { success?: boolean };
      if (!res.ok || !data.success) {
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <p className="mt-6 text-[13px]" style={{ color: GOLD }}>
        You are on the list. We will contact you when we have a match.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 w-full max-w-md">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="w-full rounded-[8px] border border-white/[0.12] bg-white/[0.06] px-[14px] py-2.5 text-[13px] text-white placeholder:text-white/40"
      />
      <label className="mt-2 flex cursor-pointer items-start gap-2 text-[11px] text-white/[0.5]">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 shrink-0" />
        <span>I agree to receive job-related emails from ArbeidMatch</span>
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-4 w-full max-w-xs rounded-[8px] py-3 text-[14px] font-bold text-[#0f1923] disabled:opacity-60"
        style={{ background: GOLD }}
      >
        Notify me of matching jobs
      </button>
      {status === "error" ? <p className="mt-2 text-[13px] text-red-400">Something went wrong. Please try again.</p> : null}
    </form>
  );
}
