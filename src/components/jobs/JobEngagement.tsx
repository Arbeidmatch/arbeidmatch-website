"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The job page's three buttons and four numbers (ORDER 57, his approved design,
 * 5 October 2026): Liker / Del / Lagre, and how many viewed, liked, shared and
 * saved it.
 *
 * His words: "sa se vada cati au vizualizat, cati au dat inimioara, cati au
 * distribuit si cati au salvat; pot salva anuntul numai candidatii care au
 * cont". So:
 *   - a view is counted once per device per day, from here, never by the
 *     server render (which is cached and fetched by crawlers);
 *   - the heart is a toggle, remembered on this device;
 *   - a share is counted when the Share button is used, and the shared link
 *     carries ?src=share;
 *   - Save is a candidate's: it opens the portal, which asks a visitor to sign
 *     in first and brings them back here, saved.
 * The numbers are read live from the ATS; nothing about the visitor is stored.
 */

type Counts = { views: number; likes: number; shares: number; saves: number };

const HEART = "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z";

function store(key: string, value?: string): string | null {
  try {
    if (value === undefined) return window.localStorage.getItem(key);
    if (value === "") window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage off */
  }
  return null;
}

export function JobEngagement({
  jobId,
  slug,
  title,
  atsBaseUrl,
  initial,
  layout = "card",
}: {
  jobId: string;
  slug: string;
  title: string;
  atsBaseUrl: string;
  initial: Partial<Counts>;
  layout?: "card" | "inline";
}) {
  const base = atsBaseUrl.replace(/\/$/, "");
  const api = `${base}/api/public/jobs/${encodeURIComponent(jobId)}`;
  const likedKey = `am_liked_job_${jobId}`;
  const [counts, setCounts] = useState<Counts>({
    views: Number(initial.views) || 0,
    likes: Number(initial.likes) || 0,
    shares: Number(initial.shares) || 0,
    saves: Number(initial.saves) || 0,
  });
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const counted = useRef(false);

  useEffect(() => {
    // One view per device per day.
    const today = new Date().toISOString().slice(0, 10);
    const viewKey = `am_viewed_job_${jobId}`;
    const countView = !counted.current && store(viewKey) !== today;
    counted.current = true;
    void (async () => {
      await Promise.resolve();
      setLiked(store(likedKey) === "1");
      setSaved(new URLSearchParams(window.location.search).get("saved") === "1");
      if (countView) {
        store(viewKey, today);
        await fetch(`${api}/engagement`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "view" }) }).catch(() => null);
      }
      const res = await fetch(`${api}/engagement`, { cache: "no-store" }).catch(() => null);
      const body = res?.ok ? ((await res.json().catch(() => null)) as { data?: Counts } | null) : null;
      if (body?.data) setCounts(body.data);
    })();
  }, [api, jobId, likedKey]);

  async function toggleLike() {
    const next = !liked;
    setLiked(next);
    setCounts((c) => ({ ...c, likes: Math.max(0, c.likes + (next ? 1 : -1)) }));
    store(likedKey, next ? "1" : "");
    const res = await fetch(`${api}/like`, { method: next ? "POST" : "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setLiked(!next);
      setCounts((c) => ({ ...c, likes: Math.max(0, c.likes + (next ? -1 : 1)) }));
      store(likedKey, next ? "" : "1");
    }
  }

  const shareUrl = () => {
    const u = new URL(`https://www.arbeidmatch.no/stilling/${encodeURIComponent(slug)}`);
    u.searchParams.set("src", "share");
    return u.toString();
  };

  async function countShare() {
    setCounts((c) => ({ ...c, shares: c.shares + 1 }));
    await fetch(`${api}/engagement`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "share" }) }).catch(() => null);
  }

  async function share() {
    const url = shareUrl();
    const nav = navigator as Navigator & { share?: (d: { title: string; url: string }) => Promise<void> };
    if (typeof nav.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await nav.share({ title, url });
        await countShare();
      } catch {
        /* closed without sharing */
      }
      return;
    }
    setShareOpen((v) => !v);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      await countShare();
    } catch {
      /* clipboard refused */
    }
  }

  const saveHref = `${base}/candidate/save-job?${new URLSearchParams({ job: slug, back: `https://www.arbeidmatch.no/stilling/${slug}` }).toString()}`;
  const btn =
    "inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-2 text-sm font-bold text-navy transition hover:border-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy";

  const numbers: Array<[string, number, string]> = [
    ["visninger", counts.views, "text-navy"],
    ["liker", counts.likes, "text-[#C53030]"],
    ["delt", counts.shares, "text-navy"],
    ["lagret", counts.saves, "text-navy"],
  ];

  return (
    <div className="flex flex-col gap-3">
      {layout === "inline" ? (
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-secondary">
          {numbers.map(([label, n, tone]) => (
            <span key={label}>
              <b className={`font-extrabold ${tone}`}>{n}</b> {label}
            </span>
          ))}
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <button type="button" aria-pressed={liked} aria-label={liked ? "Unlike this job" : "Like this job"} onClick={() => void toggleLike()} className={btn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "#C53030" : "none"} stroke="#C53030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={HEART} />
          </svg>
          Liker
        </button>
        <button type="button" aria-expanded={shareOpen} onClick={() => void share()} className={btn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="m8.6 13.5 6.8 4" />
            <path d="m15.4 6.5-6.8 4" />
          </svg>
          Del
        </button>
        {saved ? (
          <span className={`${btn} border-gold`} aria-live="polite">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Lagret
          </span>
        ) : (
          <a href={saveHref} className={btn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Lagre
          </a>
        )}
      </div>

      {shareOpen ? (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <button type="button" onClick={() => void copyLink()} className={btn}>
            {copied ? "Kopiert · Copied" : "Kopier lenke · Copy link"}
          </button>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl())}`} target="_blank" rel="noopener noreferrer" onClick={() => void countShare()} className={btn}>
            Facebook
          </a>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl()}`)}`} target="_blank" rel="noopener noreferrer" onClick={() => void countShare()} className={btn}>
            WhatsApp
          </a>
          <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl())}`} onClick={() => void countShare()} className={btn}>
            E-post · E-mail
          </a>
        </div>
      ) : null}

      {!saved ? (
        <p className="text-center text-xs text-text-secondary">
          Lagre krever konto · Save needs an account.{" "}
          <a href={saveHref} className="font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">
            Logg inn / Sign in
          </a>
        </p>
      ) : null}

      {layout === "card" ? (
        <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-surface px-2 py-3">
          {numbers.map(([label, n, tone]) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <p className={`text-lg font-extrabold ${tone}`}>{n}</p>
              <p className="text-[11px] text-text-secondary">{label}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
