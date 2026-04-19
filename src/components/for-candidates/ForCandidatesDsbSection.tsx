"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "am_dsb_type";

/** EU disc (blue + ring of stars): renders reliably on desktop where 🇪🇺 may clip or fall back to letters. */
function EuFlagBadge({ className }: { className?: string }) {
  const stars = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * Math.PI) / 6 - Math.PI / 2;
    const r = 12.5;
    const cx = 20 + r * Math.cos(angle);
    const cy = 20 + r * Math.sin(angle);
    return <circle key={i} cx={cx} cy={cy} r={1.65} fill="#FFCC00" />;
  });
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 40 40"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx={20} cy={20} r={20} fill="#003399" />
      {stars}
    </svg>
  );
}

function GlobeBadge({ className }: { className?: string }) {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx={20} cy={20} r={18} stroke="currentColor" strokeWidth={1.5} className="opacity-90" />
      <ellipse cx={20} cy={20} rx={8} ry={18} stroke="currentColor" strokeWidth={1.5} className="opacity-80" />
      <path d="M2 20h36" stroke="currentColor" strokeWidth={1.5} className="opacity-80" />
      <path d="M20 2c8 6 8 30 0 36M20 2c-8 6-8 30 0 36" stroke="currentColor" strokeWidth={1.5} className="opacity-80" />
    </svg>
  );
}

const cardBase =
  "dsb-card rounded-xl p-5 text-left text-white md:p-6";

const listItem = "relative pl-4 text-sm text-white/85 before:absolute before:left-0 before:top-2 before:h-1 before:w-1 before:rounded-full before:bg-gold";

export default function ForCandidatesDsbSection() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const goEu = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "eu");
    } catch {
      /* ignore */
    }
    router.push("/dsb-support/eu");
  };

  const goNonEu = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "non-eu");
    } catch {
      /* ignore */
    }
    router.push("/dsb-support/non-eu");
  };

  return (
    <section className="bg-surface py-16 md:py-20">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <div className="dsb-premium-outer-ring relative overflow-hidden rounded-2xl border border-gold/35 bg-gradient-to-br from-[#050815] via-[#0a0f1e] to-[#050c18]">
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-gold/20 via-gold/8 to-gold/20 opacity-50 animate-pulse-glow"
            aria-hidden
          />
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/10 blur-3xl" aria-hidden />

          <div className="relative p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
              <span
                className="mx-auto flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gold/35 bg-gold/10 text-3xl animate-pulse-glow md:mx-0"
                aria-hidden
              >
                ⚡
              </span>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold leading-tight text-white md:text-4xl">DSB Authorization Guide</h2>
                <p className="mt-3 text-base text-white/80 md:text-lg">
                  Get legally approved to work as an electrician in Norway
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!expanded ? (
                <motion.div
                  key="collapsed"
                  initial={false}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="mt-8"
                >
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setExpanded(true)}
                      className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#b8923f] via-gold to-[#d4b45c] py-[14px] px-[40px] text-sm font-semibold text-[#0a0f14] shadow-[0_8px_28px_rgba(201,168,76,0.35)] transition hover:shadow-[0_12px_36px_rgba(201,168,76,0.45)]"
                    >
                      Find My Guide →
                    </button>
                  </div>
                  <p className="mt-3 text-center text-xs text-white/55">
                    Instant access · Valid 30 days · 500+ electricians
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  key="expanded-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.25 },
                  }}
                  className="overflow-hidden"
                >
                  <motion.div
                    className="pt-8"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: {},
                      show: {
                        transition: { staggerChildren: 0.1, delayChildren: 0.08 },
                      },
                    }}
                  >
                  <div className="dsb-cards grid grid-cols-1 gap-5 md:grid-cols-2">
                    <motion.article
                      variants={{
                        hidden: { opacity: 0, y: 16 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
                      }}
                      className={`${cardBase} dsb-card--eu bg-white/[0.05]`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center" aria-hidden>
                        <EuFlagBadge className="block" />
                      </span>
                      <h3 className="mt-3 text-xl font-semibold text-white">EU/EEA Electricians</h3>
                      <ul className="mt-4 space-y-2">
                        <li className={listItem}>Faster process: 2-4 months</li>
                        <li className={listItem}>No visa required</li>
                        <li className={listItem}>Job placement available after approval</li>
                      </ul>
                      <button
                        type="button"
                        onClick={goEu}
                        className="mt-6 w-full rounded-md bg-gold py-3 text-sm font-bold text-navy transition hover:bg-gold-hover"
                      >
                        Get the EU/EEA Guide →
                      </button>
                    </motion.article>

                    <motion.article
                      variants={{
                        hidden: { opacity: 0, y: 16 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
                      }}
                      className={`${cardBase} dsb-card--non-eu bg-white/[0.03]`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center text-sky-200/90" aria-hidden>
                        <GlobeBadge className="block" />
                      </span>
                      <h3 className="mt-3 text-xl font-semibold text-white">Non-EU Electricians</h3>
                      <ul className="mt-4 space-y-2">
                        <li className={listItem}>Longer process: 6-12 months</li>
                        <li className={listItem}>Work visa required</li>
                        <li className={listItem}>Individual DSB assessment</li>
                      </ul>
                      <button
                        type="button"
                        onClick={goNonEu}
                        className="mt-6 w-full rounded-md border border-amber-300/70 py-3 text-sm font-bold text-amber-100 transition hover:bg-amber-300/10"
                      >
                        Get the Non-EU Guide →
                      </button>
                    </motion.article>
                  </div>

                  <motion.p
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="mt-6 text-center text-sm text-white/75"
                  >
                    <a
                      href="https://en.wikipedia.org/wiki/European_Economic_Area"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-gold underline underline-offset-2 hover:text-gold-hover"
                    >
                      Not sure? Check the EU/EEA country list →
                    </a>
                  </motion.p>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0 },
                      show: { opacity: 1 },
                    }}
                    className="mt-4 text-center"
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      className="text-[11px] font-medium text-white/45 transition hover:text-white/80"
                    >
                      Show less ↑
                    </button>
                  </motion.div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative mx-auto mt-8 max-w-content text-center md:px-6">
          <Link
            href="/dsb-checklist"
            className="inline-flex items-center gap-2 text-sm font-semibold text-navy transition-colors duration-300 hover:text-gold"
          >
            Prefer email? Get the free EU/EEA DSB document checklist →
          </Link>
        </div>
      </div>
    </section>
  );
}
