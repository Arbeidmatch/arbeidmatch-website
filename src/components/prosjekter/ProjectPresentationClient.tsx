"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { CARD, EYEBROW, MUTED, PRIMARY, SECONDARY, STAGE_COLOR, tint } from "@/components/prosjekter/ui";
import { domainLabel, domainsOf } from "@/lib/prosjekter/domains";
import { formatDateNo, keyDateNo, placeNo, readableText, stageNo, valueNo, type AlertProject } from "@/lib/prosjekter/format";

/**
 * One project presented to one client, ported from the ATS page of the same
 * name. It leads with the project and the way into the competition, then the
 * key facts, the dates on a line, the notice's own text in readable
 * paragraphs, how the winner is chosen, the lots, what a bidder must meet and
 * the rest of the fields; and at the end, whether they need people for it.
 * Everything in Norwegian; nothing names where the project was found.
 *
 * Every control is at least 44px tall.
 */

type Detail = { label: string; value: string };
type Presentation = {
  company_name: string;
  recipient_name: string | null;
  sender: { name: string | null; email: string | null };
  project: Pick<
    AlertProject,
    | "project_no"
    | "stage"
    | "title"
    | "description"
    | "buyer_name"
    | "regions"
    | "city"
    | "cpv_codes"
    | "estimated_value_nok"
    | "awarded_value_nok"
    | "published_on"
    | "deadline_at"
    | "start_on"
    | "end_on"
  > & {
    duration_text: string | null;
    tenders_received: number | null;
    contract_signed_on: string | null;
    winners: { name: string }[];
    details: Detail[];
    tender_open: boolean;
  };
};

function durationNo(text: string | null): string | null {
  if (!text) return null;
  return text
    .replace(/years?/, () => "år")
    .replace(/months?/, (m) => (m === "month" ? "måned" : "måneder"))
    .replace(/days?/, (m) => (m === "day" ? "dag" : "dager"));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={`${CARD} p-6 sm:p-8`}>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#0D1B2A] text-white">
      <div className="container-site pb-16 pt-10 md:pb-24 md:pt-14">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}

export default function ProjectPresentationClient({ token }: { token: string }) {
  const [data, setData] = useState<Presentation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAllReq, setShowAllReq] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      const preview = new URLSearchParams(window.location.search).get("preview") === "1" ? "?preview=1" : "";
      const res = await fetch(`/api/prosjekter/presentation/${encodeURIComponent(token)}${preview}`, {
        cache: "no-store",
      }).catch(() => null);
      const payload = res ? ((await res.json().catch(() => ({}))) as { data?: Presentation; error?: string }) : {};
      if (!live) return;
      if (!res?.ok || !payload.data) setError(payload.error ?? "Siden kunne ikke lastes. Prøv igjen om litt.");
      else setData(payload.data);
    })();
    return () => {
      live = false;
    };
  }, [token]);

  const goToTender = async () => {
    setBusy(true);
    // Opened before the answer arrives, so a popup blocker sees it as the click's own window.
    const tab = window.open("", "_blank");
    try {
      const res = await fetch(`/api/prosjekter/presentation/${encodeURIComponent(token)}`, { method: "POST" });
      const payload = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (payload.url) {
        if (tab) {
          tab.opener = null;
          tab.location.href = payload.url;
        } else {
          window.open(payload.url, "_blank", "noopener,noreferrer");
        }
      } else {
        tab?.close();
        setError(payload.error ?? "Konkurransen er ikke åpen lenger.");
      }
    } catch {
      tab?.close();
      setError("Noe gikk galt. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  const p = data?.project;
  const groups = useMemo(() => {
    const d = p?.details ?? [];
    const pick = (label: string) => d.filter((x) => x.label === label).map((x) => x.value);
    return {
      award: pick("Tildelingskriterium"),
      requirements: pick("Kvalifikasjonskrav"),
      lots: pick("Delkontrakt"),
      about: pick("Om prosjektet").concat(pick("Om prosedyren")),
      rest: d.filter((x) => !["Tildelingskriterium", "Kvalifikasjonskrav", "Delkontrakt", "Om prosedyren"].includes(x.label)),
    };
  }, [p]);

  if (error && !data) {
    return (
      <Shell>
        <div className={`${CARD} p-6 text-sm`}>{error}</div>
      </Shell>
    );
  }
  if (!data || !p) {
    return (
      <Shell>
        <p className={MUTED}>Henter prosjektet ...</p>
      </Shell>
    );
  }

  const color = STAGE_COLOR[p.stage] ?? STAGE_COLOR.tender;
  const value = valueNo(p);
  const keyDate = keyDateNo(p);
  const timeline = (
    [
      ["Kunngjort", p.published_on],
      ["Frist for spørsmål", p.details.find((d) => d.label === "Frist for spørsmål")?.value ?? null],
      ["Tilbudsfrist", p.deadline_at],
      ["Kontrakt signert", p.contract_signed_on],
      ["Oppstart", p.start_on],
      ["Ferdig", p.end_on],
    ] as const
  )
    .map(([label, raw]) => [label, raw ? (/^\d{2}\.\d{2}\.\d{4}/.test(raw) ? raw.slice(0, 10) : formatDateNo(raw)) : null] as const)
    .filter(([, v]) => Boolean(v));
  const paragraphs = readableText(p.description);
  const reqShown = showAllReq ? groups.requirements : groups.requirements.slice(0, 5);
  const facts = (
    [
      ["Byggherre", p.buyer_name],
      ["Sted", placeNo(p) || null],
      ["Verdi", value],
      ["Varighet", durationNo(p.duration_text)],
      ["Entreprenør", p.winners.length ? p.winners.map((w) => w.name).join(", ") : null],
      ["Tilbud mottatt", p.tenders_received !== null && p.tenders_received !== undefined ? String(p.tenders_received) : null],
    ] as const
  ).filter(([, v]) => Boolean(v));

  return (
    <Shell>
      <p className={EYEBROW}>ArbeidMatch Norge AS{data.company_name ? ` · for ${data.company_name}` : ""}</p>

      <header className={`${CARD} overflow-hidden`}>
        <div className="h-1.5" style={{ background: color }} aria-hidden />
        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full px-3 py-1 font-semibold" style={{ color, background: tint(color) }}>
              {stageNo(p)}
            </span>
            {domainsOf(p.cpv_codes).map((d) => (
              <span key={d} className="rounded-full border border-white/10 px-3 py-1 text-white/60">
                {domainLabel(d, "no")}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-white sm:text-3xl">
            {p.project_no !== null ? <span className="mr-2 font-mono text-lg font-normal text-white/45">#{p.project_no}</span> : null}
            {p.title}
          </h1>
          {keyDate ? <p className={`text-sm ${MUTED}`}>{keyDate}</p> : null}
          {p.tender_open ? (
            <div>
              <button type="button" onClick={() => void goToTender()} disabled={busy} className={`${PRIMARY} w-full sm:w-auto`}>
                Gå til konkurransen
              </button>
              <p className={`mt-2 text-xs ${MUTED}`}>Konkurransegrunnlaget og innlevering av tilbud.</p>
              {error ? (
                <p className="mt-2 text-sm text-white/80" role="status">
                  {error}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {facts.length ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Nøkkeltall">
          {facts.map(([label, v]) => (
            <div key={label} className={`${CARD} p-4`}>
              <p className="text-xs text-white/55">{label}</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-white">{v}</p>
            </div>
          ))}
        </section>
      ) : null}

      {timeline.length > 1 ? (
        <Section title="Tidslinje">
          <ol className="relative flex flex-col gap-4 border-l-2 border-white/15 pl-5 sm:flex-row sm:gap-0 sm:border-l-0 sm:border-t-2 sm:pl-0 sm:pt-5">
            {timeline.map(([label, v]) => (
              <li key={label} className="relative sm:flex-1 sm:pr-3">
                <span
                  className="absolute -left-[27px] top-1 h-3 w-3 rounded-full sm:-top-[27px] sm:left-0"
                  style={{ background: color }}
                  aria-hidden
                />
                <p className="text-xs text-white/55">{label}</p>
                <p className="text-sm font-semibold text-white">{v}</p>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {paragraphs.length ? (
        <Section title="Om prosjektet">
          <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-white/85">
            {paragraphs.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </div>
        </Section>
      ) : null}

      {groups.award.length ? (
        <Section title="Slik velges vinneren">
          <ul className="flex flex-col gap-2">
            {groups.award.map((a) => {
              const m = /^(.*?)(?:\s+(\d+(?:[.,]\d+)?) %)?$/.exec(a);
              return (
                <li key={a} className="flex items-start justify-between gap-4 rounded-lg bg-white/[0.04] p-3 text-sm text-white/90">
                  <span>{m?.[1] ?? a}</span>
                  {m?.[2] ? (
                    <span className="shrink-0 text-base font-semibold tabular-nums" style={{ color }}>
                      {m[2]} %
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {groups.lots.length ? (
        <Section title="Delkontrakter">
          <ul className="flex flex-col gap-2 text-sm text-white/90">
            {groups.lots.map((l) => (
              <li key={l} className="rounded-lg bg-white/[0.04] p-3">
                {l}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {groups.requirements.length ? (
        <Section title="Krav til leverandøren">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-white/90 marker:text-gold">
            {reqShown.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {groups.requirements.length > 5 ? (
            <button
              type="button"
              onClick={() => setShowAllReq((v) => !v)}
              className="mt-3 min-h-[44px] text-sm font-semibold text-gold hover:underline"
            >
              {showAllReq ? "Vis færre" : `Vis alle ${groups.requirements.length} krav`}
            </button>
          ) : null}
        </Section>
      ) : null}

      {groups.rest.length || groups.about.length ? (
        <Section title="Detaljer">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[200px_minmax(0,1fr)]">
            {[...groups.rest, ...p.details.filter((d) => d.label === "Om prosedyren")].map((d, i) => (
              <div key={`${d.label}-${i}`} className="contents">
                <dt className="text-white/55">{d.label}</dt>
                <dd className="leading-relaxed text-white/90">{d.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}

      <section className="flex flex-col gap-3 rounded-xl border border-gold/35 bg-gold/[0.06] p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-white">Trenger dere folk til prosjektet?</h2>
        <p className={`text-sm leading-relaxed ${MUTED}`}>
          Vi skaffer fagarbeidere og hjelpearbeidere til bygg og anlegg i hele Norge. Si fra hvor mange dere trenger og
          når, så finner vi dem.
        </p>
        <div>
          {data.sender.email ? (
            <a
              href={`mailto:${data.sender.email}?subject=${encodeURIComponent(`Bemanning: ${p.title}`.slice(0, 150))}`}
              className={SECONDARY}
            >
              Kontakt {data.sender.name ?? "oss"}
            </a>
          ) : (
            <Link href="/contact" className={SECONDARY}>
              Kontakt oss
            </Link>
          )}
        </div>
      </section>
    </Shell>
  );
}
