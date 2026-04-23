"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, SlidersHorizontal, Zap } from "lucide-react";
import { readPartnerRequestContext } from "@/lib/partnerRequestContext";
import { useEffect, useMemo, useState } from "react";

type SessionCheck = {
  valid: boolean;
  reason?: "expired" | "invalid" | "used";
};

type SelectableMode = "quick" | "custom";

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.36, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function PartnerSessionPage() {
  const { session_token } = useParams<{ session_token: string }>();
  const router = useRouter();
  const reduce = useReducedMotion();
  const listVariants = useMemo(
    () => ({
      hidden: {},
      visible: {
        transition: { staggerChildren: reduce ? 0 : 0.1 },
      },
    }),
    [reduce],
  );
  const [state, setState] = useState<"loading" | "ready" | "expired" | "invalid">("loading");
  const [selectedMode, setSelectedMode] = useState<SelectableMode | null>(null);
  const [requestContext, setRequestContext] = useState<{ industry: string; role: string } | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch(`/api/verify-partner-session?token=${encodeURIComponent(session_token)}`);
        const data = (await response.json()) as SessionCheck;
        if (response.ok && data.valid) {
          setState("ready");
          return;
        }
        if (data.reason === "expired") {
          setState("expired");
          return;
        }
        setState("invalid");
      } catch {
        setState("invalid");
      }
    };
    void run();
  }, [session_token]);

  useEffect(() => {
    if (state !== "ready") return;
    const refreshContext = () => setRequestContext(readPartnerRequestContext());
    window.addEventListener("focus", refreshContext);
    return () => window.removeEventListener("focus", refreshContext);
  }, [state]);

  useEffect(() => {
    if (state !== "ready") return;
    const ctx = readPartnerRequestContext();
    setRequestContext(ctx);
    if (ctx?.industry || ctx?.role) {
      setSelectedMode("quick");
    }
  }, [state]);

  const quickMatchContextBadge = useMemo(() => {
    if (!requestContext) return "";
    const r = requestContext.role?.trim() ?? "";
    const i = requestContext.industry?.trim() ?? "";
    return [r, i].filter(Boolean).join(" · ");
  }, [requestContext]);

  const goSearch = () => {
    if (state !== "ready" || !selectedMode) return;
    const mode = selectedMode === "quick" ? "quick_match" : "custom_search";
    router.push(`/request/partner/${encodeURIComponent(session_token)}/search?mode=${mode}`);
  };

  if (state === "loading") {
    return (
      <section className="min-h-screen bg-[#0D1B2A] px-4 py-20 text-center text-white">
        <p className="text-white/70">Verifying secure link...</p>
      </section>
    );
  }

  if (state === "expired") {
    return (
      <section className="min-h-screen bg-[#0D1B2A] px-4 py-20 text-white">
        <div className="mx-auto max-w-xl rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-8 text-center">
          <h1 className="text-2xl font-bold text-white">
            This link has expired. Partner links are valid for 14 days. Request a new one below.
          </h1>
          <Link
            href="/request"
            className="mx-auto mt-6 inline-flex rounded-[10px] bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0D1B2A]"
          >
            Request new link
          </Link>
        </div>
      </section>
    );
  }

  if (state === "invalid") {
    return (
      <section className="min-h-screen bg-[#0D1B2A] px-4 py-20 text-white">
        <div className="mx-auto max-w-xl rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-8 text-center">
          <h1 className="text-2xl font-bold text-white">Invalid link.</h1>
          <Link
            href="/request"
            className="mx-auto mt-6 inline-flex rounded-[10px] bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0D1B2A]"
          >
            Back to request
          </Link>
        </div>
      </section>
    );
  }

  if (state !== "ready") {
    return null;
  }

  const tapProps = reduce ? {} : { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } };

  return (
    <section className="flex min-h-[100dvh] flex-col bg-[#0D1B2A] px-4 pb-8 pt-10 text-white md:mx-auto md:max-w-lg md:px-6 md:pt-12">
      <header className="shrink-0 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Find Candidates</h1>
        <p className="mt-1 text-sm text-white/40">Choose how to search</p>
        {requestContext?.role || requestContext?.industry ? (
          <p className="mt-4 text-pretty text-sm leading-relaxed text-[#C9A84C]/90">
            Showing results for{" "}
            <span className="font-semibold text-white">{requestContext.role || "your role"}</span>
            {" in "}
            <span className="font-semibold text-white">{requestContext.industry || "your sector"}</span>
          </p>
        ) : null}
      </header>

      <motion.div
        className="mt-10 flex flex-1 flex-col gap-4"
        variants={listVariants}
        initial={reduce ? "visible" : "hidden"}
        animate="visible"
      >
        <motion.button
          type="button"
          variants={cardVariants}
          onClick={() => setSelectedMode("quick")}
          className={`relative w-full rounded-2xl border p-6 text-left transition-colors duration-200 ${
            selectedMode === "quick"
              ? "border-[#C9A84C] bg-[#C9A84C]/10"
              : "border-white/12 bg-white/[0.04] hover:border-white/22"
          }`}
          {...tapProps}
        >
          {selectedMode === "quick" ? (
            <motion.span
              initial={reduce ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 520, damping: 22 }}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#C9A84C] text-[#0D1B2A]"
              aria-hidden
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </motion.span>
          ) : null}
          <Zap className="text-[#C9A84C]" size={40} strokeWidth={1.35} aria-hidden />
          <p className="mt-4 text-lg font-bold tracking-tight text-white">See who&apos;s available</p>
          <p className="mt-1.5 text-sm leading-snug text-white/55">
            Browse available candidates for this role and sector.
          </p>
          {quickMatchContextBadge ? (
            <p className="mt-3 inline-flex max-w-full rounded-full border border-[#C9A84C]/15 bg-[#C9A84C]/15 px-3 py-1 text-xs text-[#C9A84C]">
              <span className="truncate">{quickMatchContextBadge}</span>
            </p>
          ) : null}
        </motion.button>

        <motion.button
          type="button"
          variants={cardVariants}
          onClick={() => setSelectedMode("custom")}
          className={`relative w-full rounded-2xl border p-6 text-left transition-colors duration-200 ${
            selectedMode === "custom"
              ? "border-[#C9A84C] bg-[#C9A84C]/10"
              : "border-white/12 bg-white/[0.04] hover:border-white/22"
          }`}
          {...tapProps}
        >
          {selectedMode === "custom" ? (
            <motion.span
              initial={reduce ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 520, damping: 22 }}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#C9A84C] text-[#0D1B2A]"
              aria-hidden
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </motion.span>
          ) : null}
          <SlidersHorizontal className="text-[#C9A84C]" size={40} strokeWidth={1.35} aria-hidden />
          <p className="mt-4 text-lg font-bold tracking-tight text-white">Custom Search</p>
          <p className="mt-1.5 text-sm leading-snug text-white/55">Filter by skills, location, experience.</p>
        </motion.button>
      </motion.div>

      <div className="mt-auto shrink-0 space-y-4 pt-10">
        <AnimatePresence>
          {selectedMode ? (
            <motion.button
              key="start"
              type="button"
              onClick={goSearch}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: 8 }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 26 }}
              className="w-full rounded-xl bg-[#C9A84C] py-3.5 text-[15px] font-semibold tracking-tight text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
            >
              Start →
            </motion.button>
          ) : null}
        </AnimatePresence>
        <p className="mx-auto w-max rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/15 px-3 py-1 text-xs font-medium text-[#C9A84C]/95">
          3 free alerts this month
        </p>
      </div>
    </section>
  );
}
