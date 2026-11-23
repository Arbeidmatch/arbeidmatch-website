"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

import { ANNONSE_TABS, expiringWordsNo, type AnnonseGroup, type Annonser } from "@/lib/min-side/annonser";
import { BODY, CARD, GREY, NAVY, PILL, SEGMENTS, SMALL, segment } from "./ios";

const nb = (n: number) => new Intl.NumberFormat("nb-NO").format(n).replace(/[  ]/g, " ");

/** The status tag on a card: green while live, grey otherwise. */
function tag(group: AnnonseGroup): string {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.8125rem] font-semibold";
  if (group === "live") return `${base} bg-[#E3F4EA] text-[#146C43]`;
  if (group === "pending") return `${base} bg-[#FBF6E8] text-[#7A5A12]`;
  return `${base} bg-[#EDEDF2] text-[#4B5563]`;
}

/**
 * ORDER 276: the board "Min side - Annonser" (phone and computer): the line
 * with the live count and this month's clicks on Søk, the advert ending
 * soonest, the tabs Live, Kontroll and Utløpt, and one card per advert with
 * its counts. Every action opens JobbOS's own Annonser page, where the firm
 * signs in to write, pay and extend; nothing is changed from here.
 */
export default function MinSideAnnonser({ annonser }: { annonser: Annonser }) {
  const firstTab: AnnonseGroup = annonser.state === "ok" && annonser.liveCount === 0 && annonser.adverts.some((a) => a.group === "pending") ? "pending" : "live";
  const [tab, setTab] = useState<AnnonseGroup>(firstTab);

  if (annonser.state === "unavailable") {
    return (
      <div className={`${CARD} p-4`}>
        <p className={`${BODY} ${NAVY}`}>Annonsene kunne ikke hentes akkurat nå. Prøv igjen om litt.</p>
      </div>
    );
  }

  const shown = annonser.adverts.filter((a) => a.group === tab);
  const countOf = (g: AnnonseGroup) => annonser.adverts.filter((a) => a.group === g).length;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {annonser.lineNo ? <p className={`${BODY} ${NAVY}`}>{annonser.lineNo}</p> : null}

      {annonser.expiring ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#E9D9A6] bg-[#FBF6E8] p-4">
          <div className="min-w-0">
            <p className={`break-words font-semibold ${BODY} ${NAVY}`}>{annonser.expiring.title}</p>
            <p className={`${SMALL} text-[#7A5A12]`}>{expiringWordsNo(annonser.expiring.days)}</p>
          </div>
          <a href={annonser.manageUrl} className={PILL} target="_blank" rel="noopener noreferrer">
            Forleng
          </a>
        </div>
      ) : null}

      <div role="group" aria-label="Vis annonser etter status" className={SEGMENTS}>
        {ANNONSE_TABS.map((t) => (
          <button key={t.key} type="button" aria-pressed={tab === t.key} className={segment(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label} ({countOf(t.key)})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className={`${CARD} p-4`}>
          <p className={`${BODY} ${GREY}`}>
            {tab === "live" ? "Ingen annonser er live nå." : tab === "pending" ? "Ingen annonser venter på kontroll." : "Ingen utløpte annonser."}
          </p>
        </div>
      ) : (
        <ul className="flex min-w-0 flex-col gap-3">
          {shown.map((a) => (
            <li key={a.id} className={`${CARD} flex min-w-0 flex-col gap-2 p-4`}>
              <span className={`${tag(a.group)} self-start`}>{a.statusNo}</span>
              <p className={`break-words font-semibold ${BODY} ${NAVY}`}>{a.title}</p>
              {a.whenNo ? <p className={`break-words ${SMALL} ${GREY}`}>{a.whenNo}</p> : null}
              <p className={`flex flex-wrap gap-x-4 gap-y-1 ${SMALL} ${NAVY}`}>
                <span>{nb(a.views)} visninger</span>
                <span>{nb(a.applyClicks)} klikk på Søk</span>
              </p>
              {a.publicUrl ? (
                <a href={a.publicUrl} className={`${PILL} self-start`} target="_blank" rel="noopener noreferrer">
                  Se annonsen
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className={`${SMALL} ${GREY}`}>
        Annonsene skrives, betales og forlenges på{" "}
        <a href={annonser.manageUrl} className={`font-semibold underline underline-offset-4 ${NAVY}`} target="_blank" rel="noopener noreferrer">
          Annonser-siden
        </a>
        , der dere logger inn med firmaets egen konto.
      </p>
    </div>
  );
}
