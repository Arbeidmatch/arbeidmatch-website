"use client";

import { useEffect, useState } from "react";

const TIKTOK_LIVE_URL =
  process.env.NEXT_PUBLIC_TIKTOK_LIVE_URL ?? "https://www.tiktok.com/@arbeidmatch/live";

const POLL_MS = 60_000;

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-4.08 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

/**
 * TikTok live strip when `site_settings.tiktok_live` is true (polled every 60s).
 */
export default function TikTokLiveBanner() {
  const [live, setLive] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLive() {
      try {
        const res = await fetch("/api/tiktok-live-status", { cache: "no-store" });
        const data = (await res.json()) as { live?: boolean };
        if (!cancelled) {
          setLive(Boolean(data.live));
        }
      } catch {
        if (!cancelled) setLive(false);
      }
    }

    void fetchLive();
    const id = window.setInterval(() => void fetchLive(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (live === null || !live) {
    return null;
  }

  return (
    <div className="border-b border-red-900/20 bg-[#0a0f1a]">
      <div className="mx-auto w-full max-w-content px-4 py-2.5 md:px-6 md:py-3">
        <a
          href={TIKTOK_LIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="animate-tiktok-live-border relative flex items-center gap-3 overflow-hidden rounded-xl border border-red-500/40 bg-[#0f172a] px-4 py-3 pr-14 shadow-lg transition hover:border-red-400/60 hover:bg-[#131d2e] md:gap-4 md:px-5"
        >
          <span
            className="absolute right-2 top-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white md:right-3 md:top-2.5"
            aria-hidden
          >
            LIVE
          </span>

          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
            <TikTokIcon className="h-6 w-6" />
          </span>

          <span className="min-w-0 flex-1 text-left">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-white md:text-lg">
                We&apos;re LIVE on TikTok!
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-400">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#E24B4A] shadow-[0_0_8px_#E24B4A]" />
                LIVE
              </span>
            </span>
            <span className="mt-0.5 block text-sm text-slate-400">
              Join us now for tips on working in Scandinavia
            </span>
          </span>
        </a>
      </div>
    </div>
  );
}
