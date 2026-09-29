"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { CARD, EYEBROW, MUTED, PRIMARY, SECONDARY, STAGE_COLOR, tint } from "@/components/prosjekter/ui";
import { domainsOf } from "@/lib/prosjekter/domains";
import {
  cleanDescription,
  domainChoices,
  domainsNo,
  formatDateNo,
  FREQUENCIES,
  FREQUENCY_NO,
  keyDateNo,
  placeNo,
  regionChoices,
  stageNo,
  valueNo,
  type AlertProject,
  type Frequency,
} from "@/lib/prosjekter/format";

/**
 * A client's own page of projects, ported from the ATS page of the same name.
 *
 * A heading with their company, three counts that filter, domain chips, a
 * sort, and one card per project with its owner, place, value, date and
 * contractor; a short description that opens; and "Gå til konkurransen" while
 * a tender is open. On a first visit it is the thank-you and the yes: how
 * often, which domains, which counties. The source is never named.
 *
 * Every control is at least 44px tall.
 */

type Sub = {
  status: "invited" | "active" | "unsubscribed" | "expired";
  company_name: string;
  recipient_name: string | null;
  frequency: Frequency | null;
  domains: string[];
  regions: string[];
  free_days: number;
  free_until: string | null;
};

type SortKey = "new" | "value" | "deadline";
type StageKey = "all" | "planned" | "tender" | "awarded";

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors ${
        on ? "bg-gold/15 text-gold ring-1 ring-gold/50" : "border border-white/15 text-white/70 hover:border-white/30 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Choices({
  frequency,
  setFrequency,
  domains,
  setDomains,
  regions,
  setRegions,
}: {
  frequency: Frequency | null;
  setFrequency: (f: Frequency) => void;
  domains: string[];
  setDomains: (d: string[]) => void;
  regions: string[];
  setRegions: (r: string[]) => void;
}) {
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="text-sm font-semibold text-white">Hvor ofte vil dere høre fra oss?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {FREQUENCIES.map((f) => (
            <Chip key={f} on={frequency === f} onClick={() => setFrequency(f)}>
              {FREQUENCY_NO[f]}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold text-white">Fagområder</legend>
        <p className={`mt-0.5 text-xs ${MUTED}`}>Ingen valgt betyr alle.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {domainChoices().map((d) => (
            <Chip key={d.key} on={domains.includes(d.key)} onClick={() => setDomains(toggle(domains, d.key))}>
              {d.label}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold text-white">Område</legend>
        <p className={`mt-0.5 text-xs ${MUTED}`}>Ingen valgt betyr hele Norge.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {regionChoices().map(({ code, label: name }) => (
            <Chip key={code} on={regions.includes(code)} onClick={() => setRegions(toggle(regions, code))}>
              {name}
            </Chip>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function ProjectCard({ p }: { p: AlertProject }) {
  const [open, setOpen] = useState(false);
  const description = cleanDescription(p.description, open ? 2000 : 220);
  const value = valueNo(p);
  const date = keyDateNo(p);
  const stage = stageNo(p);
  const place = placeNo(p);
  const color = STAGE_COLOR[p.stage] ?? "rgba(255,255,255,0.2)";
  return (
    <article className={`${CARD} flex flex-col overflow-hidden`}>
      <div className="h-1" style={{ background: color }} aria-hidden />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full px-2.5 py-1 font-semibold" style={{ color, background: tint(color) }}>
            {stage}
          </span>
          {domainsNo(p)
            .slice(0, 2)
            .map((d) => (
              <span key={d} className="rounded-full border border-white/10 px-2.5 py-1 text-white/60">
                {d}
              </span>
            ))}
        </div>
        <h3 className="text-base font-semibold leading-snug text-white">
          {p.project_no !== null ? <span className="mr-1.5 font-mono text-[13px] font-normal text-white/45">#{p.project_no}</span> : null}
          {p.title}
        </h3>
        <dl className="grid grid-cols-[92px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
          {p.buyer_name ? (
            <>
              <dt className="text-white/55">Byggherre</dt>
              <dd className="text-white">{p.buyer_name}</dd>
            </>
          ) : null}
          {place ? (
            <>
              <dt className="text-white/55">Sted</dt>
              <dd className="text-white">{place}</dd>
            </>
          ) : null}
          {value ? (
            <>
              <dt className="text-white/55">Verdi</dt>
              <dd className="font-semibold tabular-nums text-white">{value}</dd>
            </>
          ) : null}
          {date ? (
            <>
              <dt className="text-white/55">Dato</dt>
              <dd className="text-white">{date.replace(/^(Tilbudsfrist|Oppstart|Kunngjort) /, (m) => `${m.trim()}: `)}</dd>
            </>
          ) : null}
          {p.winners.length ? (
            <>
              <dt className="text-white/55">Entreprenør</dt>
              <dd className="font-medium text-white">{p.winners.map((w) => w.name).join(", ")}</dd>
            </>
          ) : null}
        </dl>
        {description ? (
          <p className={`text-[13px] leading-relaxed ${MUTED}`}>
            {description}{" "}
            {(p.description ?? "").length > 220 ? (
              <button type="button" onClick={() => setOpen((o) => !o)} className="font-semibold text-gold hover:underline">
                {open ? "Vis mindre" : "Les mer"}
              </button>
            ) : null}
          </p>
        ) : null}
        {p.documents_url && /^https?:\/\//i.test(p.documents_url) ? (
          <div className="mt-auto pt-1">
            <a href={p.documents_url} target="_blank" rel="noopener noreferrer" className={`${PRIMARY} min-h-[44px] px-5 text-sm`}>
              Gå til konkurransen
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function ProjectAlertsClient({ token }: { token: string }) {
  const [sub, setSub] = useState<Sub | null>(null);
  const [projects, setProjects] = useState<AlertProject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<Frequency | null>(null);
  const [domains, setDomains] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stage, setStage] = useState<StageKey>("all");
  const [domain, setDomain] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("new");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/prosjekter/alerts/${encodeURIComponent(token)}`, { cache: "no-store" });
      const payload = (await res.json().catch(() => ({}))) as {
        subscription?: Sub;
        projects?: AlertProject[];
        error?: string;
      };
      if (!res.ok || !payload.subscription) {
        setError(payload.error ?? "Lenken er ikke gyldig lenger.");
        return;
      }
      setError(null);
      setSub(payload.subscription);
      setProjects(payload.projects ?? []);
      setFrequency(payload.subscription.frequency ?? "weekly");
      setDomains(payload.subscription.domains ?? []);
      setRegions(payload.subscription.regions ?? []);
    } catch {
      setError("Siden kunne ikke lastes. Prøv igjen om litt.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (action: "confirm" | "update" | "unsubscribe") => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/prosjekter/alerts/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, frequency, domains, regions }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setNotice(payload.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      setNotice(action === "unsubscribe" ? "Dere er meldt av." : action === "update" ? "Valgene er lagret." : null);
      setSettingsOpen(false);
      await load();
    } catch {
      setNotice("Noe gikk galt. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  const counts = useMemo(
    () => ({
      planned: projects.filter((p) => p.stage === "planned").length,
      tender: projects.filter((p) => p.stage === "tender").length,
      awarded: projects.filter((p) => p.stage === "awarded").length,
    }),
    [projects],
  );
  const presentDomains = useMemo(() => {
    const seen = new Set<string>();
    for (const p of projects) for (const d of domainsOf(p.cpv_codes)) seen.add(d);
    return domainChoices().filter((d) => seen.has(d.key));
  }, [projects]);
  const shown = useMemo(() => {
    const list = projects.filter(
      (p) =>
        (stage === "all" || p.stage === stage) &&
        (domain === "all" || domainsOf(p.cpv_codes).some((d) => d === domain)),
    );
    const v = (p: AlertProject) => p.awarded_value_nok ?? p.estimated_value_nok ?? -1;
    const d = (p: AlertProject) => (p.deadline_at ? Date.parse(p.deadline_at) : Infinity);
    if (sort === "value") return [...list].sort((a, b) => v(b) - v(a));
    if (sort === "deadline") return [...list].filter((p) => p.stage === "tender").sort((a, b) => d(a) - d(b));
    return list;
  }, [projects, stage, domain, sort]);

  const freeMonths = sub ? Math.max(1, Math.round(sub.free_days / 30.44)) : 1;

  return (
    <div className="bg-[#0D1B2A] text-white">
      <div className="container-site flex flex-col gap-8 pb-16 pt-10 md:pb-24 md:pt-14">
        <header className="flex flex-col gap-3">
          <p className={EYEBROW}>ArbeidMatch Norge AS</p>
          <h1 className="am-h2 font-display font-semibold text-white">Prosjekter i Norge</h1>
          {sub ? (
            <p className={`text-sm ${MUTED}`}>
              For {sub.company_name}
              {sub.free_until && sub.status === "active"
                ? ` · gratis til ${formatDateNo(sub.free_until)}, som takk for samarbeidet`
                : ""}
            </p>
          ) : null}
        </header>

        {loading && !sub ? <p className={MUTED}>Henter prosjektene ...</p> : null}
        {error ? <div className={`${CARD} p-6 text-sm`}>{error}</div> : null}
        {notice ? (
          <div className={`${CARD} border-gold/40 p-4 text-sm`} role="status">
            {notice}
          </div>
        ) : null}

        {sub && sub.status === "invited" ? (
          <section className={`${CARD} flex flex-col gap-6 p-6 sm:p-8`} aria-label="Takk">
            <div>
              <h2 className="text-xl font-semibold text-white">Takk for samarbeidet</h2>
              <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${MUTED}`}>
                Som takk for prosjektene vi har hatt sammen får {sub.company_name} prosjektvarsler gratis i {freeMonths}{" "}
                {freeMonths <= 1 ? "måned" : "måneder"}. Velg hvor ofte og hva dere vil høre om, så sender vi dere det som
                passer.
              </p>
            </div>
            <Choices
              frequency={frequency}
              setFrequency={setFrequency}
              domains={domains}
              setDomains={setDomains}
              regions={regions}
              setRegions={setRegions}
            />
            <div>
              <button type="button" className={PRIMARY} disabled={busy || !frequency} onClick={() => void act("confirm")}>
                Ja takk, send meg prosjektvarsler
              </button>
            </div>
          </section>
        ) : null}

        {sub && sub.status === "unsubscribed" ? (
          <section className={`${CARD} flex flex-col gap-4 p-6`}>
            <p className="text-sm">Dere er meldt av prosjektvarslene.</p>
            {sub.free_until ? (
              <div>
                <button type="button" className={SECONDARY} disabled={busy} onClick={() => void act("confirm")}>
                  Meld meg på igjen
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {sub && sub.status === "expired" ? (
          <section className={`${CARD} p-6 text-sm`}>
            Den gratis perioden er over. Ta gjerne kontakt med oss hvis dere vil fortsette å få prosjektvarsler.
          </section>
        ) : null}

        {sub && sub.status === "active" ? (
          <>
            <section className="grid grid-cols-3 gap-2 sm:gap-4" aria-label="Oversikt">
              {(
                [
                  ["planned", "Planlagt", counts.planned],
                  ["tender", "Åpne konkurranser", counts.tender],
                  ["awarded", "Tildelt", counts.awarded],
                ] as const
              ).map(([key, label, n]) => {
                const on = stage === key;
                const color = STAGE_COLOR[key];
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setStage(on ? "all" : key)}
                    className={`${CARD} flex min-h-[88px] flex-col items-start justify-between gap-2 p-3 text-left transition-colors hover:border-white/25 sm:p-5 ${
                      on ? "border-transparent ring-2" : ""
                    }`}
                    style={on ? ({ "--tw-ring-color": color } as React.CSSProperties) : undefined}
                  >
                    <span className="text-[26px] font-semibold leading-none tabular-nums sm:text-4xl" style={{ color }}>
                      {n}
                    </span>
                    <span className="text-[12px] leading-tight text-white/70 sm:text-sm">{label}</span>
                  </button>
                );
              })}
            </section>

            <section className="flex flex-col gap-3" aria-label="Filter">
              <div className="flex flex-wrap gap-2">
                <Chip on={domain === "all"} onClick={() => setDomain("all")}>
                  Alle fagområder
                </Chip>
                {presentDomains.map((d) => (
                  <Chip key={d.key} on={domain === d.key} onClick={() => setDomain(domain === d.key ? "all" : d.key)}>
                    {d.label}
                  </Chip>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs ${MUTED}`}>Sorter:</span>
                <Chip on={sort === "new"} onClick={() => setSort("new")}>
                  Nyeste
                </Chip>
                <Chip on={sort === "value"} onClick={() => setSort("value")}>
                  Høyest verdi
                </Chip>
                <Chip on={sort === "deadline"} onClick={() => setSort("deadline")}>
                  Snarest frist
                </Chip>
              </div>
            </section>

            {shown.length === 0 ? (
              <div className={`${CARD} p-6 text-sm ${MUTED}`}>Ingen prosjekter passer disse valgene akkurat nå.</div>
            ) : (
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Prosjekter">
                {shown.map((p) => (
                  <ProjectCard key={p.id} p={p} />
                ))}
              </section>
            )}

            <section className={`${CARD} p-5`} aria-label="Innstillinger">
              <button
                type="button"
                className="min-h-[44px] text-left text-sm font-semibold text-white hover:text-gold"
                onClick={() => setSettingsOpen((o) => !o)}
                aria-expanded={settingsOpen}
              >
                Innstillinger: {sub.frequency ? FREQUENCY_NO[sub.frequency].toLowerCase() : ""}
                {sub.domains.length ? `, ${sub.domains.length} fagområder` : ", alle fagområder"}
              </button>
              {settingsOpen ? (
                <div className="mt-4 flex flex-col gap-5">
                  <Choices
                    frequency={frequency}
                    setFrequency={setFrequency}
                    domains={domains}
                    setDomains={setDomains}
                    regions={regions}
                    setRegions={setRegions}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={PRIMARY} disabled={busy || !frequency} onClick={() => void act("update")}>
                      Lagre
                    </button>
                    <button type="button" className={SECONDARY} disabled={busy} onClick={() => void act("unsubscribe")}>
                      Meld av
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
