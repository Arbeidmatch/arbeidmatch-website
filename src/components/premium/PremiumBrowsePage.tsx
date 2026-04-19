"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PREMIUM_ARTICLES, type PremiumArticle } from "@/lib/premium/articles";

const CATEGORIES = [
  "All",
  "Workers Rights",
  "DSB and Electrical",
  "Tax and Finance",
  "Employment Contracts",
  "Naval and Maritime",
  "Datacenter",
] as const;

function IconArrow() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="text-[#C9A84C]" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export default function PremiumBrowsePage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [verify, setVerify] = useState<{
    email?: string;
    plan?: string | null;
    status?: string | null;
    trialEndsAt?: string | null;
    hasAccess?: boolean;
  } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/premium/verify", { credentials: "include" });
        const data = (await res.json()) as {
          email?: string;
          plan?: string | null;
          status?: string | null;
          trialEndsAt?: string | null;
          hasAccess?: boolean;
        };
        if (!cancelled) setVerify(data);
      } catch {
        if (!cancelled) setVerify(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (verify?.status !== "trialing") return;
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [verify?.status, verify?.trialEndsAt]);

  const hoursLeft = useMemo(() => {
    if (!verify?.trialEndsAt || verify.status !== "trialing") return null;
    const ms = new Date(verify.trialEndsAt).getTime() - now;
    if (ms <= 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60));
  }, [verify, now]);

  const filtered = useMemo(() => {
    return PREMIUM_ARTICLES.filter((a) => {
      const okCat = cat === "All" || a.category === cat;
      const qq = q.trim().toLowerCase();
      const okQ =
        !qq ||
        a.title.toLowerCase().includes(qq) ||
        a.excerpt.toLowerCase().includes(qq) ||
        a.category.toLowerCase().includes(qq);
      return okCat && okQ;
    });
  }, [cat, q]);

  const pulseUrgent = hoursLeft !== null && hoursLeft <= 6 && hoursLeft > 0;

  const onLogout = useCallback(() => {
    document.cookie = "premium_token=; Path=/; Max-Age=0";
    window.location.href = "/premium";
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1923] text-white">
      <header className="border-b border-white/[0.08] bg-[#0f1923] px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#C9A84C]" aria-hidden />
            <span className="text-lg font-semibold tracking-tight text-white">ArbeidMatch Premium</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
            {verify?.email ? <span className="text-white/85">{verify.email}</span> : null}
            {verify?.status ? (
              <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">
                {verify.status}
                {verify.plan ? ` · ${verify.plan}` : ""}
              </span>
            ) : null}
            {hoursLeft !== null && hoursLeft > 0 ? (
              <span
                className={`rounded-full border border-amber-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200 ${
                  pulseUrgent ? "animate-pulse" : ""
                }`}
              >
                Trial ends in {hoursLeft} hours
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onLogout()}
              className="text-xs text-white/45 underline"
            >
              Leave
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-10">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search guides, topics, or regulations..."
          className="w-full rounded-[10px] border border-white/10 bg-white/[0.06] px-5 py-3.5 text-[15px] text-white placeholder:text-white/35"
        />

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-5 py-2 text-[13px] font-medium transition-colors ${
                cat === c ? "bg-[#C9A84C] font-semibold text-[#0f1923]" : "bg-white/[0.06] text-white/60"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
        {filtered.length === 0 ? <p className="mt-10 text-center text-sm text-white/50">No guides match your filters.</p> : null}
      </div>
    </div>
  );
}

function ArticleCard({ article: a }: { article: PremiumArticle }) {
  return (
    <Link
      href={`/premium/article/${a.slug}`}
      className="group relative flex flex-col rounded-[14px] border-[0.5px] border-white/[0.08] bg-white/[0.04] p-6 transition-[border-color,transform] duration-200 md:hover:-translate-y-1 md:hover:border-[#C9A84C]/50"
    >
      <span className="w-fit rounded-full bg-[rgba(201,168,76,0.1)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#C9A84C]">
        {a.category}
      </span>
      <p className="mt-4 text-[17px] font-bold leading-snug text-white">{a.title}</p>
      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-white/65">{a.excerpt}</p>
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-white/40">
        <span>{a.readingTime} min read</span>
        <span>Last updated: {a.lastUpdated}</span>
      </div>
      <p className="mt-2 text-[11px] font-medium text-[#C9A84C]">{a.officialSources.join(", ")}</p>
      <span className="absolute bottom-5 right-5 opacity-80 transition-transform group-hover:translate-x-0.5">
        <IconArrow />
      </span>
    </Link>
  );
}
