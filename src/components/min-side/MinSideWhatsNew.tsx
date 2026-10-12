"use client";

import { useEffect, useState } from "react";
import type { WhatsNewEntry } from "@/lib/min-side/profile";
import { EYEBROW, MUTED, PRIMARY, SECONDARY } from "@/components/prosjekter/ui";

/**
 * What's new on Min side (U1b): the improvements that concern a client, one at
 * a time, until they tick them as seen or tried. "Lukk" only closes it for
 * this visit; the ticks are kept by the ATS for the person's address.
 */

const CLOSED_KEY = "am-min-side-whats-new-closed";

export function MinSideWhatsNew({ entries, onTick }: { entries: WhatsNewEntry[]; onTick: (id: string, tried: boolean) => Promise<void> }) {
  const [closed, setClosed] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setClosed(window.sessionStorage.getItem(CLOSED_KEY) === "1");
    } catch {
      setClosed(false);
    }
  }, []);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="min-side-whats-new">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0D1B2A] p-6 text-white shadow-2xl">
        <p className={EYEBROW}>Nytt på Min side{entries.length > 1 ? ` · 1 av ${entries.length}` : ""}</p>
        <h2 id="min-side-whats-new" className="mt-2 text-xl font-semibold">
          {entry.title}
        </h2>
        <p className={`mt-2 text-sm ${MUTED}`}>{entry.detail}</p>
        {entry.variants.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {entry.variants.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className={PRIMARY} disabled={busy} onClick={() => void tick(true)}>
            Prøvd det
          </button>
          <button type="button" className={SECONDARY} disabled={busy} onClick={() => void tick(false)}>
            Sett
          </button>
          <button type="button" className={SECONDARY} disabled={busy} onClick={close}>
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
}
