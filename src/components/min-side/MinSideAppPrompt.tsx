"use client";

import { useEffect, useState } from "react";

import {
  decideAppPrompt,
  FORSPRANG_PACKAGE,
  FORSPRANG_PLAY_URL,
  visitPopupDelay,
  VISIT_POPUP_KEY,
  type AppState,
  type PromptDecision,
} from "@/lib/min-side/app-prompt";
import { BTN_NAVY, BTN_OUTLINE, INK, SOFT } from "./ui";

/**
 * The Forsprang install prompt (ORDER 272): a bottom sheet on a phone that has
 * not got the app, once per visit, never on a desktop. The rules are in
 * lib/min-side/app-prompt.ts; this only reads the browser and draws.
 */

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// Chrome fires this once, early, and only to whoever is listening then: kept here from the first load of the chunk.
let deferredInstall: InstallEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstall = e as InstallEvent;
  });
}

type RelatedApp = { id?: string; platform?: string };

async function relatedAppInstalled(): Promise<boolean> {
  const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<RelatedApp[]> };
  if (typeof nav.getInstalledRelatedApps !== "function") return false;
  try {
    const apps = await Promise.race([nav.getInstalledRelatedApps(), new Promise<RelatedApp[]>((r) => setTimeout(() => r([]), 1500))]);
    return apps.some((a) => a.id === FORSPRANG_PACKAGE);
  } catch {
    return false;
  }
}

function readVisit(): string | null {
  try {
    return window.sessionStorage.getItem(VISIT_POPUP_KEY);
  } catch {
    return null;
  }
}

function claimVisit() {
  try {
    window.sessionStorage.setItem(VISIT_POPUP_KEY, "install_app");
  } catch {
    /* private window: it shows this once all the same */
  }
}

function Logo({ size = 56 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/forsprang/forsprang-mark.svg" alt="" width={size} height={size} className="flex-none rounded-[14px]" />
  );
}

const TICKS = ["Åpner rett på prosjektene", "Alltid innlogget med nøkkelen", "Logg inn med fingeren"];

const IOS_STEPS = [
  <>
    Trykk på <strong>Del</strong>-knappen nederst i Safari (firkanten med pil opp).
  </>,
  <>
    Velg <strong>Legg til på Hjem-skjerm</strong>.
  </>,
  <>
    Trykk <strong>Legg til</strong>. Forsprang ligger nå blant appene deres.
  </>,
];

export function MinSideAppPrompt({ app, onLater }: { app: AppState | null; onLater: () => Promise<void> | void }) {
  const [decision, setDecision] = useState<PromptDecision>(null);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (!app || app.prompt_hidden) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const facts = {
        userAgent: navigator.userAgent,
        maxTouchPoints: navigator.maxTouchPoints ?? 0,
        coarsePointer: window.matchMedia("(pointer: coarse)").matches,
        width: window.innerWidth,
        standalone: window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches,
        navigatorStandalone: (navigator as Navigator & { standalone?: boolean }).standalone === true,
        referrer: document.referrer ?? "",
        relatedAppInstalled: await relatedAppInstalled(),
      };
      if (cancelled) return;
      const next = decideAppPrompt(facts, app, readVisit());
      if (next) {
        claimVisit();
        setDecision(next);
      }
    }, visitPopupDelay("install_app"));
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [app]);

  if (!decision) return null;

  const later = () => {
    setDecision(null);
    void onLater();
  };

  const install = async () => {
    if (decision.primary === "play") {
      window.location.href = FORSPRANG_PLAY_URL;
      return;
    }
    if (deferredInstall) {
      const event = deferredInstall;
      deferredInstall = null;
      await event.prompt().catch(() => undefined);
      setDecision(null);
      return;
    }
    setManual(true);
  };

  // A tap beside the sheet closes it for this visit; only "Senere" keeps it away for thirty days.
  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-[rgba(13,27,42,0.45)]" onClick={() => setDecision(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forsprang-app-title"
        className={`w-full rounded-t-[20px] bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-5 ${INK}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D5D9E0]" aria-hidden />
        <div className="flex items-center gap-4">
          <Logo />
          <div className="min-w-0">
            <h2 id="forsprang-app-title" className="text-[19px] font-bold leading-tight">
              Forsprang
            </h2>
            <p className={`mt-0.5 text-[15px] ${SOFT}`}>
              {decision.sheet === "android" ? "Prosjektene deres, rett på telefonen" : "Legg Forsprang på Hjem-skjermen"}
            </p>
          </div>
        </div>

        {decision.sheet === "android" ? (
          <>
            <ul className="mt-5 flex flex-col gap-3">
              {TICKS.map((t) => (
                <li key={t} className="flex items-center gap-3 text-[16px]">
                  <span aria-hidden className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#E3F4EA] text-[14px] font-bold text-[#146C43]">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            {manual ? (
              <p className={`mt-4 text-[15px] ${SOFT}`} role="status">
                Åpne menyen ⋮ øverst i nettleseren og velg <strong>Installer app</strong>.
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-3">
              <button type="button" className={`${BTN_NAVY} w-full min-h-[48px] text-[16px]`} onClick={() => void install()}>
                {decision.primary === "play" ? "Hent på Google Play" : "Installer"}
              </button>
              <button type="button" className={`${BTN_OUTLINE} w-full min-h-[48px] text-[16px]`} onClick={later}>
                Senere
              </button>
            </div>
          </>
        ) : (
          <>
            <ol className="mt-5 flex flex-col gap-4">
              {IOS_STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-[16px] leading-snug">
                  <span aria-hidden className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#1B2B44] text-[14px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6">
              <button type="button" className={`${BTN_OUTLINE} w-full min-h-[48px] text-[16px]`} onClick={later}>
                Senere
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
