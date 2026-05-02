"use client";

import type { CSSProperties, FormEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Flame, Zap } from "lucide-react";

import SourceDisclaimer from "@/components/ui/SourceDisclaimer";

const GOLD = "#C9A84C";
const GREEN = "#1D9E75";
const BORDER = "rgba(201,168,76,0.15)";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

type View = "initial" | "certified" | "notCertified";
type Dir = "forward" | "back";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function InlineSignup({
  open,
  specialty,
  guideWanted,
  successMessage,
  reducedMotion,
}: {
  open: boolean;
  specialty: string;
  guideWanted: boolean;
  successMessage: string;
  reducedMotion: boolean;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setConsent(false);
      setStatus("idle");
      setClientError(null);
    }
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setClientError(null);
    const trimmed = email.trim();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setClientError("email");
      return;
    }
    if (!consent) {
      setClientError("consent");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/guide-interest-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed.toLowerCase(),
          specialty,
          consent: true,
          guideWanted,
        }),
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

  const transitionMs = reducedMotion ? 0 : 200;

  return (
    <div
      className="grid w-full min-w-0"
      style={{
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: `grid-template-rows ${transitionMs}ms ease-out`,
      }}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="pt-3">
          {status === "success" ? (
            <p className="py-2 text-[13px] font-medium" style={{ color: GREEN }}>
              {successMessage}
            </p>
          ) : (
            <form onSubmit={submit} className="box-border w-full min-w-0">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setClientError(null);
                }}
                placeholder="Your email address"
                className="box-border w-full min-w-0 rounded-[8px] border border-white/[0.12] bg-white/[0.06] px-[14px] py-2.5 text-[13px] text-white placeholder:text-white/40"
                autoComplete="email"
              />
              <label className="mt-2 flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    setClientError(null);
                  }}
                  className="mt-0.5 h-4 min-h-[16px] w-4 min-w-[16px] shrink-0 rounded border-white/20 bg-transparent"
                  style={{ accentColor: GOLD }}
                />
                <span className="text-[11px] leading-[1.5] text-white/[0.5]">
                  I agree to receive job-related emails from ArbeidMatch. I have read and accept the{" "}
                  <Link href="/privacy" className="text-[#C9A84C] underline">
                    Privacy Policy
                  </Link>
                  . Unsubscribe anytime.
                </span>
              </label>
              {clientError === "email" ? (
                <p className="mt-2 text-[13px] text-[#E24B4A]">Please enter a valid email address.</p>
              ) : null}
              {clientError === "consent" ? (
                <p className="mt-2 text-[13px] text-[#E24B4A]">Please accept to continue.</p>
              ) : null}
              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 box-border w-full min-w-0 rounded-[8px] py-2.5 text-[13px] font-bold text-[#0f1923] disabled:opacity-70"
                style={{ background: GOLD }}
              >
                {status === "loading" ? "Sending..." : "Submit"}
              </button>
              {status === "error" ? (
                <p className="mt-2 text-[13px] text-[#E24B4A]">Something went wrong. Please try again.</p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

type AnimPhase = "idle" | "leave" | "enterStart" | "enterRun";

function useViewTransition(reducedMotion: boolean) {
  const [view, setView] = useState<View>("initial");
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [dir, setDir] = useState<Dir>("forward");
  const pending = useRef<View | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const navigate = useCallback(
    (next: View, navigationDir: Dir) => {
      if (reducedMotion) {
        setView(next);
        setPhase("idle");
        return;
      }
      if (phase !== "idle") return;
      if (next === view) return;
      clearTimers();
      pending.current = next;
      setDir(navigationDir);
      setPhase("leave");
    },
    [reducedMotion, view, phase, clearTimers],
  );

  useEffect(() => {
    if (phase !== "leave" || reducedMotion) return;
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (cancelled) return;
      const next = pending.current;
      if (next == null) return;
      setView(next);
      setPhase("enterStart");
    }, 200);
    timers.current.push(id);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase !== "enterStart" || reducedMotion) return;
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setPhase("enterRun"));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase !== "enterRun" || reducedMotion) return;
    const id = window.setTimeout(() => setPhase("idle"), 450);
    timers.current.push(id);
    return () => window.clearTimeout(id);
  }, [phase, reducedMotion]);

  const shellMotion = useCallback((): CSSProperties => {
    if (reducedMotion) {
      return { opacity: 1, transform: "translate3d(0,0,0)" };
    }
    const outX = dir === "forward" ? -16 : 16;
    const inX = dir === "forward" ? 16 : -16;
    if (phase === "leave") {
      return {
        opacity: 0,
        transform: `translate3d(${outX}px,0,0)`,
        transition: "opacity 200ms ease-out, transform 200ms ease-out",
      };
    }
    if (phase === "enterStart") {
      return {
        opacity: 0,
        transform: `translate3d(${inX}px,0,0)`,
        transition: "none",
      };
    }
    if (phase === "enterRun") {
      return {
        opacity: 1,
        transform: "translate3d(0,0,0)",
        transition: "opacity 250ms ease-out 180ms, transform 250ms ease-out 180ms",
      };
    }
    return { opacity: 1, transform: "translate3d(0,0,0)", transition: "none" };
  }, [phase, dir, reducedMotion]);

  return { view, phase, navigate, shellMotion };
}

function CardShell({ children, shellMotion }: { children: ReactNode; shellMotion: CSSProperties }) {
  return (
    <div
      className="relative box-border flex h-full w-full min-w-0 flex-col justify-between overflow-hidden"
      style={{
        minHeight: 320,
        padding: "clamp(28px, 4vw, 40px) clamp(24px, 3vw, 36px)",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        color: "#ffffff",
        ...shellMotion,
      }}
    >
      {children}
    </div>
  );
}

function IconBox({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-xl border"
      style={{
        background: "rgba(201,168,76,0.1)",
        borderColor: "rgba(201,168,76,0.15)",
      }}
    >
      {children}
    </div>
  );
}

function ElectricianCard({ reducedMotion }: { reducedMotion: boolean }) {
  const router = useRouter();
  const { view, navigate, shellMotion } = useViewTransition(reducedMotion);

  return (
    <CardShell shellMotion={shellMotion()}>
      {view === "initial" ? (
        <>
          <div>
            <IconBox>
              <Zap size={24} color={GOLD} strokeWidth={1.75} aria-hidden />
            </IconBox>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
              Electrician
            </p>
            <h3 className="mt-2 text-[26px] font-extrabold leading-[1.2] text-white">Work as an electrician in Norway</h3>
            <p className="mt-2.5 text-[14px] leading-[1.65] text-white/[0.55]">
              Norway has strong demand for qualified electricians. Select your current status to get started.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => navigate("certified", "forward")}
              className="flex w-full items-center justify-between rounded-[10px] border px-5 py-3.5 text-left text-[14px] font-semibold"
              style={{
                background: "rgba(29,158,117,0.1)",
                borderColor: "#1D9E75",
                color: GREEN,
              }}
            >
              <span>I have DSB authorization</span>
              <ArrowRight size={16} color={GREEN} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => navigate("notCertified", "forward")}
              className="flex w-full items-center justify-between rounded-[10px] border px-5 py-3.5 text-left text-[14px] font-semibold"
              style={{
                background: "rgba(201,168,76,0.08)",
                borderColor: "rgba(201,168,76,0.15)",
                color: GOLD,
              }}
            >
              <span>I don&apos;t have DSB yet</span>
              <ArrowRight size={16} color={GOLD} aria-hidden />
            </button>
          </div>
        </>
      ) : null}

      {view === "certified" ? (
        <>
          <div>
            <button
              type="button"
              onClick={() => navigate("initial", "back")}
              className="mb-6 flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[12px] text-white/[0.3]"
            >
              <ArrowLeft size={12} aria-hidden />
              Back
            </button>
            <span
              className="mb-4 inline-block rounded-[20px] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ background: "rgba(29,158,117,0.1)", color: GREEN }}
            >
              DSB Authorized
            </span>
            <h3 className="text-[22px] font-extrabold text-white">Find your next project in Norway</h3>
            <p className="mt-2 text-[14px] leading-[1.65] text-white/[0.6]">
              Register your profile and we work to connect you with Norwegian employers looking for DSB-authorized
              electricians. Norwegian employer references are a strong advantage.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2.5">
            <a
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-[10px] py-3.5 text-center text-[14px] font-bold text-white no-underline"
              style={{ background: GREEN }}
            >
              Browse open electrician jobs
            </a>
            <a
              href="https://jobs.arbeidmatch.no/sign-up"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                background: "transparent",
                border: "1px solid #1D9E75",
                color: "#1D9E75",
                fontWeight: 600,
                fontSize: 14,
                padding: "14px 20px",
                borderRadius: 10,
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              Register and find work
            </a>
          </div>
        </>
      ) : null}

      {view === "notCertified" ? (
        <>
          <div>
            <button
              type="button"
              onClick={() => navigate("initial", "back")}
              className="mb-6 flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[12px] text-white/[0.3]"
            >
              <ArrowLeft size={12} aria-hidden />
              Back
            </button>
            <span
              className="mb-4 inline-block rounded-[20px] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ background: "rgba(201,168,76,0.1)", color: GOLD }}
            >
              No DSB yet
            </span>
            <h3 className="mt-[14px] text-[22px] font-extrabold text-white">Where are you from?</h3>
            <p className="mt-2 text-[14px] leading-[1.65] text-white/[0.6]">
              DSB authorization requirements differ based on your country of origin. Select your situation to get the right
              guide.
            </p>
          </div>
          <div
            style={{
              margin: "20px 0",
              borderTop: "1px solid rgba(255,255,255,0.03)",
            }}
          />
          <div className="flex flex-col gap-[10px]">
            <button
              type="button"
              onClick={() => router.push("/dsb-support/eu")}
              className="flex w-full items-center justify-between rounded-[10px] border px-5 py-4 text-left transition-all duration-200 ease-out hover:bg-[rgba(201,168,76,0.15)] hover:border-[rgba(201,168,76,0.5)]"
              style={{ background: "rgba(201,168,76,0.08)", borderColor: "rgba(201,168,76,0.15)" }}
            >
              <span className="flex flex-col items-start gap-[2px]">
                <span style={{ color: GOLD, fontSize: 14, fontWeight: 600 }}>I am from EU / EEA</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                  Many EU and EEA countries: check the official list if you are unsure
                </span>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 6L15 12L9 18" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => router.push("/dsb-support/non-eu")}
              className="flex w-full items-center justify-between rounded-[10px] border px-5 py-4 text-left transition-all duration-200 ease-out hover:bg-[rgba(201,168,76,0.12)] hover:border-[rgba(201,168,76,0.4)]"
              style={{ background: "rgba(201,168,76,0.06)", borderColor: "rgba(201,168,76,0.15)" }}
            >
              <span className="flex flex-col items-start gap-[2px]">
                <span style={{ color: GOLD, fontSize: 14, fontWeight: 600 }}>I am from outside EU / EEA</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                  Many countries outside the EU/EEA: rules depend on nationality and role
                </span>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 6L15 12L9 18" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="mt-4 text-center text-[11px] italic text-white/[0.3]">
            Not sure? Check if your country is in the EU/EEA on{" "}
            <a
              href="https://european-union.europa.eu/principles-countries-history/country-profiles_en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] no-underline"
              style={{ color: GOLD }}
            >
              europa.eu
            </a>
          </p>
          <div className="mt-6">
            <Link href="/dsb-support" className="text-[12px] text-white/[0.4] underline underline-offset-2">
              Learn more about DSB authorization
            </Link>
          </div>
        </>
      ) : null}
    </CardShell>
  );
}

function WelderCard({ reducedMotion }: { reducedMotion: boolean }) {
  const { view, navigate, shellMotion } = useViewTransition(reducedMotion);
  const [formNoIso, setFormNoIso] = useState(false);

  useEffect(() => {
    setFormNoIso(false);
  }, [view]);

  return (
    <CardShell shellMotion={shellMotion()}>
      {view === "initial" ? (
        <>
          <div>
            <IconBox>
              <Flame size={24} color={GOLD} strokeWidth={1.75} aria-hidden />
            </IconBox>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
              Welder
            </p>
            <h3 className="mt-2 text-[26px] font-extrabold leading-[1.2] text-white">Work as a welder in Norway</h3>
            <p className="mt-2.5 text-[14px] leading-[1.65] text-white/[0.55]">
              Norwegian shipyards are actively hiring ISO-certified welders. Select your current status to get started.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => navigate("certified", "forward")}
              className="flex w-full items-center justify-between rounded-[10px] border px-5 py-3.5 text-left text-[14px] font-semibold"
              style={{
                background: "rgba(29,158,117,0.1)",
                borderColor: "#1D9E75",
                color: GREEN,
              }}
            >
              <span>I have a valid ISO certificate</span>
              <ArrowRight size={16} color={GREEN} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => navigate("notCertified", "forward")}
              className="flex w-full items-center justify-between rounded-[10px] border px-5 py-3.5 text-left text-[14px] font-semibold"
              style={{
                background: "rgba(201,168,76,0.08)",
                borderColor: "rgba(201,168,76,0.15)",
                color: GOLD,
              }}
            >
              <span>I don&apos;t have ISO certification yet</span>
              <ArrowRight size={16} color={GOLD} aria-hidden />
            </button>
          </div>
        </>
      ) : null}

      {view === "certified" ? (
        <>
          <div>
            <button
              type="button"
              onClick={() => navigate("initial", "back")}
              className="mb-6 flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[12px] text-white/[0.3]"
            >
              <ArrowLeft size={12} aria-hidden />
              Back
            </button>
            <span
              className="mb-4 inline-block rounded-[20px] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ background: "rgba(29,158,117,0.1)", color: GREEN }}
            >
              ISO Certified
            </span>
            <h3 className="text-[22px] font-extrabold text-white">Apply for shipyard placements</h3>
            <p className="mt-2 text-[14px] leading-[1.65] text-white/[0.6]">
              ISO 9606 certified welders are in high demand at Norwegian shipyards. Transport and accommodation are typically
              part of the package. Many employers confirm details before signing. We work to connect you with active openings.
            </p>
            <p className="mt-2 text-[11px] italic leading-snug text-white/[0.4]">
              Typical range: 280 to 330 NOK per hour. Rotation: 4 weeks on, 2 weeks home or 6 weeks on, 2 weeks home. Verify
              specifics with each employer.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2.5">
            <a
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-[10px] py-3.5 text-center text-[14px] font-bold text-white no-underline"
              style={{ background: GREEN }}
            >
              Browse open welding jobs
            </a>
            <a
              href="https://jobs.arbeidmatch.no/sign-up"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                background: "transparent",
                border: "1px solid #1D9E75",
                color: "#1D9E75",
                fontWeight: 600,
                fontSize: 14,
                padding: "14px 20px",
                borderRadius: 10,
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              Register your profile
            </a>
          </div>
        </>
      ) : null}

      {view === "notCertified" ? (
        <>
          <div>
            <button
              type="button"
              onClick={() => navigate("initial", "back")}
              className="mb-6 flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[12px] text-white/[0.3]"
            >
              <ArrowLeft size={12} aria-hidden />
              Back
            </button>
            <span
              className="mb-4 inline-block rounded-[20px] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ background: "rgba(201,168,76,0.1)", color: GOLD }}
            >
              No ISO yet
            </span>
            <h3 className="text-[22px] font-extrabold text-white">Get notified when our welding guide is ready</h3>
            <p className="mt-2 text-[14px] leading-[1.65] text-white/[0.6]">
              ISO 9606 certification is required for most welding positions at Norwegian shipyards. We are preparing a guide to
              help you understand the path to certification and placement in Norway.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setFormNoIso((o) => !o)}
              className="w-full rounded-[10px] border py-3.5 text-[14px] font-bold"
              style={{ borderColor: "rgba(201,168,76,0.15)", color: GOLD, background: "transparent" }}
            >
              Notify me when the guide is ready
            </button>
            <InlineSignup
              open={formNoIso}
              specialty="welder-no-iso"
              guideWanted
              successMessage="We have registered your interest. We aim to notify you when the welding certification guide becomes available. We cannot guarantee a publication date."
              reducedMotion={reducedMotion}
            />
          </div>
        </>
      ) : null}
    </CardShell>
  );
}

export default function TradeSpecialistCards() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section className="bg-[#0D1B2A] py-12 md:py-20">
      <div className="mx-auto grid w-full max-w-[1000px] grid-cols-1 gap-6 px-4 md:grid-cols-2">
        <div className="w-full min-w-0">
          <ElectricianCard reducedMotion={reducedMotion} />
        </div>
        <div className="w-full min-w-0">
          <WelderCard reducedMotion={reducedMotion} />
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-[1000px] px-4 text-center">
        <SourceDisclaimer
          text="Salary ranges are general market estimates based on collective agreements and publicly available sources. Actual pay depends on qualifications, employer, project type, and individual negotiation. ArbeidMatch is not responsible for salary outcomes."
          sourceLabel="Source: Arbeidstilsynet.no"
          sourceUrl="https://www.arbeidstilsynet.no/en/pay-and-engagement-of-employees/pay-and-minimum-rates-of-pay/minimum-wage/"
          variant="dark"
        />
        <p className="mt-2 text-center text-[12px] italic text-white/50">
          Norwegian employer references significantly influence placement opportunities.
        </p>
      </div>
    </section>
  );
}
