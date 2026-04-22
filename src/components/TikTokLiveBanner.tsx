"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const TIKTOK_LIVE_URL =
  process.env.NEXT_PUBLIC_TIKTOK_LIVE_URL ?? "https://www.tiktok.com/@arbeidmatch/live";

const POLL_MS = 60_000;
const NAVY = "#0D1B2A";

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
  const reduceMotion = useReducedMotion();

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
    <div className="border-b border-[rgba(201,168,76,0.12)] bg-[#0D1B2A]">
      <div className="mx-auto w-full max-w-content px-4 py-3 md:px-6 md:py-4">
        <motion.a
          href={TIKTOK_LIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] px-4 py-3.5 pr-16 transition-colors duration-300 hover:border-[rgba(201,168,76,0.35)] hover:bg-[rgba(255,255,255,0.045)] md:gap-5 md:px-5 md:pr-20"
        >
          <span
            className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C9A84C]"
            aria-hidden
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C9A84C]/50 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C9A84C]" />
            </span>
            Live
          </span>

          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(201,168,76,0.15)] text-white/90"
            style={{ background: `linear-gradient(145deg, ${NAVY}, rgba(255,255,255,0.04))` }}
          >
            <TikTokIcon className="h-5 w-5" />
          </span>

          <span className="min-w-0 flex-1 text-left">
            <span className="block text-[15px] font-semibold tracking-tight text-white md:text-base">
              We&apos;re live on TikTok
            </span>
            <span className="mt-1 block text-[13px] leading-snug text-white/55">
              Tips on working in Scandinavia — join the stream
            </span>
          </span>
        </motion.a>
      </div>
    </div>
  );
}
