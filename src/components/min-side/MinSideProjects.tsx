"use client";

import { useMemo, useState } from "react";
import { CARD, FIELD, MUTED, PRIMARY, STAGE_COLOR, tint } from "@/components/prosjekter/ui";
import { cleanDescription, keyDateNo, placeNo, regionChoices, stageNo, valueNo } from "@/lib/prosjekter/format";
import { domainLabel, isDomainKey } from "@/lib/prosjekter/domains";
import { expandRegions } from "@/lib/prosjekter/regions";
import { PROJECT_SOURCE_LINE, type MinSideProject } from "@/lib/min-side/profile";

/**
 * The projects of the person's alerts, in the Prosjektvarsler section of Min
 * side itself (his order, 12 October 2026), filtered by county, domain and
 * stage. The projects page stays where the choices are changed.
 */

type StageKey = "planned" | "tender" | "closed" | "awarded";
const STAGES: { key: StageKey; label: string }[] = [
  { key: "planned", label: "Planlagt" },
  { key: "tender", label: "Åpen konkurranse" },
  { key: "closed", label: "Venter på tildeling" },
  { key: "awarded", label: "Tildelt" },
];
// Six at a time: on a phone the section stays a few screens long (his rule:
// no endless scroll on a phone); "Vis flere" brings the next six.
const PAGE = 6;

function stageKey(p: MinSideProject, now: number): StageKey {
  if (p.stage === "tender" && p.deadline_at && Date.parse(p.deadline_at) < now) return "closed";
  return p.stage;
}

function ProjectRow({ p, now }: { p: MinSideProject; now: number }) {
  const key = stageKey(p, now);
  const color = STAGE_COLOR[key] ?? "rgba(255,255,255,0.2)";
  const value = valueNo(p);
  const date = keyDateNo({ ...p, start_on: null }, now);
  const place = placeNo(p);
  const description = cleanDescription(p.description, 120);
  return (
    <li className={`${CARD} flex flex-col overflow-hidden`}>
      <div className="h-1" style={{ background: color }} aria-hidden />
      <div className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full px-2.5 py-1 font-semibold" style={{ color, background: tint(color) }}>
            {stageNo(p, now)}
          </span>
          {p.domains
            .filter(isDomainKey)
            .slice(0, 2)
            .map((d) => (
              <span key={d} className="rounded-full border border-white/10 px-2.5 py-1 text-white/60">
                {domainLabel(d, "no")}
              </span>
            ))}
        </div>
        <h3 className="break-words text-[15px] font-semibold leading-snug text-white">{p.title}</h3>
        <p className={`break-words text-[13px] ${MUTED}`}>
          {[p.buyer_name, place, value, date].filter(Boolean).join(" · ")}
        </p>
        {p.winners.length ? <p className="break-words text-[13px] text-white">Entreprenør: {p.winners.join(", ")}</p> : null}
        {description ? <p className={`line-clamp-2 break-words text-[13px] leading-relaxed ${MUTED}`}>{description}</p> : null}
        {p.documents_url ? (
          <div className="pt-1">
            <a href={p.documents_url} target="_blank" rel="noopener noreferrer" className={`${PRIMARY} min-h-[44px] px-5 text-sm`}>
              Gå til konkurransen
            </a>
          </div>
        ) : null}
      </div>
    </li>
  );
}

export default function MinSideProjects({ projects }: { projects: MinSideProject[] }) {
  const [now] = useState(() => Date.now());
  const [county, setCounty] = useState("");
  const [domain, setDomain] = useState("");
  const [stage, setStage] = useState("");
  const [shown, setShown] = useState(PAGE);

  // Only the choices that have a project behind them.
  const counties = useMemo(() => {
    const present = new Set(projects.flatMap((p) => expandRegions(p.regions)));
    return regionChoices().filter((c) => present.has(c.code));
  }, [projects]);
  const domains = useMemo(() => {
    const present = new Set(projects.flatMap((p) => p.domains).filter(isDomainKey));
    return [...present].map((key) => ({ key, label: domainLabel(key, "no") })).sort((a, b) => a.label.localeCompare(b.label, "nb"));
  }, [projects]);
  const stages = useMemo(() => STAGES.filter((s) => projects.some((p) => stageKey(p, now) === s.key)), [projects, now]);

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (!county || expandRegions(p.regions).includes(county)) &&
          (!domain || p.domains.includes(domain)) &&
          (!stage || stageKey(p, now) === stage),
      ),
    [projects, county, domain, stage, now],
  );

  if (!projects.length) return <p className={`text-sm ${MUTED}`}>Ingen prosjekter passer valgene deres akkurat nå.</p>;

  const select = (label: string, value: string, set: (v: string) => void, options: { value: string; label: string }[], all: string) => (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-white/70">
      {label}
      <select
        value={value}
        onChange={(e) => {
          set(e.target.value);
          setShown(PAGE);
        }}
        className={FIELD}
      >
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {select("Fylke", county, setCounty, counties.map((c) => ({ value: c.code, label: c.label })), "Alle fylker")}
        {select("Fagområde", domain, setDomain, domains.map((d) => ({ value: d.key, label: d.label })), "Alle fagområder")}
        {select("Stadium", stage, setStage, stages.map((s) => ({ value: s.key, label: s.label })), "Alle stadier")}
      </div>
      <p className={`text-sm ${MUTED}`} aria-live="polite">
        {filtered.length === 1 ? "1 prosjekt" : `${filtered.length} prosjekter`}
      </p>
      {filtered.length ? (
        <ul className="flex flex-col gap-3">
          {filtered.slice(0, shown).map((p) => (
            <ProjectRow key={p.id} p={p} now={now} />
          ))}
        </ul>
      ) : (
        <p className={`text-sm ${MUTED}`}>Ingen prosjekter passer filteret.</p>
      )}
      {filtered.length > shown ? (
        <button type="button" onClick={() => setShown((n) => n + PAGE)} className="self-start text-sm font-semibold text-gold hover:underline min-h-[44px]">
          Vis flere ({filtered.length - shown})
        </button>
      ) : null}
      {/* ORDER 100: the source, smaller than small, never a link (his words, 13 October 2026). */}
      <p className="max-w-[640px] text-[11px] font-normal leading-normal text-[#9AA3AF]">{PROJECT_SOURCE_LINE}</p>
    </div>
  );
}
