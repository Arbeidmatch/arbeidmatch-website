"use client";

import { useState } from "react";
import type { WhatsNewEntry } from "@/lib/min-side/profile";
import { BTN_OUTLINE, GOLD_TEXT, INK, SOFT } from "./ui";

/**
 * What's new on Min side (U1b): the improvements that concern a client, one at
 * a time, until they tick them as seen or tried. "Lukk" only closes it for
 * this visit; the ticks are kept by the ATS for the person's address.
 *
 * ORDER 101 (13 October 2026): a small notice in the page, above the section,
 * never a window over it. On a phone the first version covered most of the
 * screen and the project list under it.
 */

const CLOSED_KEY = "am-min-side-whats-new-closed";

export function MinSideWhatsNew({ entries, onTick }: { entries: WhatsNewEntry[]; onTick: (id: string, tried: boolean) => Promise<void> }) {
  // Read once when it first shows: the page mounts it only after the profile has come, in the browser.
  const [closed, setClosed] = useState(() => {
    try {
      return typeof window !== "undefined" && window.sessionStorage.getItem(CLOSED_KEY) === "1";
    } catch {
      return false; /* private window: it shows, and closes for now all the same */
    }
  });
  const [busy, setBusy] = useState(false);

  const entry = entries[0];
  if (!entry || closed) return null;

  const tick = async (tried: boolean) => {
    setBusy(true);
    await onTick(entry.id, tried);
    setBusy(false);
  };
  const close = () => {
    try {
      window.sessionStorage.setItem(CLOSED_KEY, "1");
    } catch {
      /* private window: it closes for now all the same */
    }
    setClosed(true);
  };

  return (
    <aside aria-labelledby="min-side-whats-new" className="flex min-w-0 flex-col gap-2 rounded-xl border border-[#E6E1D6] border-l-[3px] border-l-[#1B2B44] bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-bold uppercase tracking-[0.1em] ${GOLD_TEXT}`}>Nytt på Min side{entries.length > 1 ? ` · 1 av ${entries.length}` : ""}</p>
        <h2 id="min-side-whats-new" className={`mt-0.5 break-words text-sm font-semibold ${INK}`}>
          {entry.title}
        </h2>
        <p className={`mt-0.5 line-clamp-2 break-words text-[13px] ${SOFT}`}>{entry.detail}</p>
        {entry.variants.length ? <p className={`mt-0.5 break-words text-[13px] ${SOFT}`}>{entry.variants.join(" · ")}</p> : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" className={`${BTN_OUTLINE} text-sm`} disabled={busy} onClick={() => void tick(true)}>
          Prøvd det
        </button>
        <button type="button" className={`${BTN_OUTLINE} text-sm`} disabled={busy} onClick={() => void tick(false)}>
          Sett
        </button>
        <button type="button" className={`${BTN_OUTLINE} text-sm`} disabled={busy} onClick={close}>
          Lukk
        </button>
      </div>
    </aside>
  );
}
