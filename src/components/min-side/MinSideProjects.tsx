"use client";

import { useMemo, useState } from "react";
import { cleanDescription, keyDateNo, stageNo, valueNo } from "@/lib/prosjekter/format";
import { domainLabel, isDomainKey } from "@/lib/prosjekter/domains";
import { NORWAY_REGIONS } from "@/lib/prosjekter/regions";
import {
  PROJECT_SOURCE_LINE,
  dayNo,
  projectCountLine,
  projectStage,
  visibleProjects,
  type AlertChoices,
  type CityOption,
  type MinSideProject,
  type MinSideStage,
} from "@/lib/min-side/profile";
import { BTN_GREEN, BTN_OUTLINE, INK, MUTED_L, SOFT, chip } from "./ui";

/**
 * The projects of the person's alerts, in the Prosjektvarsler section of Min
 * side itself (his order, 12 October 2026), in the final design of 13 October
 * (ORDER 101): towns and stages as chips, a toggle for the projects with no
 * known place, and a count that always follows the list as it is filtered.
 *
 * The towns are the subscription's own choice and are saved with us (the ATS
 * keeps the 30-day rule); the stage and the toggle only filter the page.
 */

const STAGES: { key: MinSideStage; label: string }[] = [
  { key: "planned", label: "Planlagt" },
  { key: "tender", label: "Åpen konkurranse" },
  { key: "closed", label: "Venter på tildeling" },
  { key: "awarded", label: "Tildelt" },
];

/** The top accent and the tag of each stage: awarded green, open amber, the rest quiet. */
const STAGE_LOOK: Record<MinSideStage, { accent: string; bg: string; fg: string }> = {
  awarded: { accent: "#2E9E6B", bg: "#E3F4EA", fg: "#146C43" },
  tender: { accent: "#D9A93B", bg: "#FCEFD2", fg: "#7A5A12" },
  closed: { accent: "#C9CFD8", bg: "#EEF1F5", fg: "#3D4B60" },
  planned: { accent: "#8FA6C8", bg: "#E8EEF8", fg: "#24456E" },
};

// Six at a time: on a phone the section stays a few screens long (his rule:
// no endless scroll on a phone); "Vis flere" brings the next six.
const PAGE = 6;
/** Towns shown before "+ flere". */
const TOP_CITIES = 3;

export const UNKNOWN_PLACE = "Sted ikke oppgitt";

type Saved = { ok: true } | { ok: false; message: string };

export type MinSideProjectsProps = {
  projects: MinSideProject[];
  cities?: string[];
  cityOptions?: CityOption[];
  nextCityChange?: string | null;
  choices?: AlertChoices;
  onCities?: (cities: string[]) => Promise<Saved>;
  onAskPeople?: (p: MinSideProject) => void;
};

const same = (a: string, b: string) => a.toLocaleLowerCase("nb") === b.toLocaleLowerCase("nb");

function ProjectCard({ p, now, onAskPeople }: { p: MinSideProject; now: number; onAskPeople?: (p: MinSideProject) => void }) {
  const key = projectStage(p, now);
  const look = STAGE_LOOK[key];
  const value = valueNo(p);
  const date = keyDateNo({ ...p, start_on: null }, now);
  const description = cleanDescription(p.description, 120);
  const ask = onAskPeople ? (
    <button type="button" className={BTN_GREEN} aria-haspopup="dialog" onClick={() => onAskPeople(p)}>
      Be om folk
    </button>
  ) : null;
  return (
    <li className="flex min-w-0 flex-col gap-2 rounded-xl border border-[#E6E1D6] bg-white px-[18px] py-4" style={{ borderTop: `3px solid ${look.accent}` }}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full px-2.5 py-[3px] font-semibold" style={{ background: look.bg, color: look.fg }}>
          {stageNo(p, now)}
        </span>
        {p.domains
          .filter(isDomainKey)
          .slice(0, 2)
          .map((d) => (
            <span key={d} className={`rounded-full border border-[#E6E1D6] px-2.5 py-[3px] ${SOFT}`}>
              {domainLabel(d, "no")}
            </span>
          ))}
      </div>
      <h3 className={`break-words text-base font-semibold leading-snug ${INK}`}>{p.title}</h3>
      <p className={`break-words text-[13px] ${MUTED_L}`}>
        {[p.buyer_name, p.place ?? UNKNOWN_PLACE, value, date, p.winners.length ? `Entreprenør: ${p.winners.join(", ")}` : null].filter(Boolean).join(" · ")}
      </p>
      {description ? <p className={`line-clamp-2 break-words text-[13px] leading-relaxed ${SOFT}`}>{description}</p> : null}
      {key === "awarded" ? (
        ask ? (
          <div className="mt-1 flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E6E1D6] bg-white px-3 py-2.5">
            <span className={`min-w-[180px] flex-1 text-sm font-semibold ${INK}`}>Vant dere denne? Trenger dere folk?</span>
            {ask}
          </div>
        ) : null
      ) : p.documents_url || ask ? (
        <div className="mt-1 flex flex-wrap gap-2.5">
          {p.documents_url ? (
            <a href={p.documents_url} target="_blank" rel="noopener noreferrer" className={BTN_OUTLINE}>
              Gå til konkurransen
            </a>
          ) : null}
          {ask}
        </div>
      ) : null}
    </li>
  );
}

export default function MinSideProjects({ projects, cities = [], cityOptions = [], nextCityChange = null, choices, onCities, onAskPeople }: MinSideProjectsProps) {
  const [now] = useState(() => Date.now());
  const [stages, setStages] = useState<MinSideStage[]>([]);
  const [showUnknown, setShowUnknown] = useState(true);
  const [shown, setShown] = useState(PAGE);
  const [moreCities, setMoreCities] = useState(false);
  // The towns as just chosen, until the saved answer comes back with the page.
  const [pending, setPending] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const chosen = pending ?? cities;

  const stageChoices = useMemo(() => STAGES.filter((s) => projects.some((p) => projectStage(p, now) === s.key)), [projects, now]);
  const anyUnknown = projects.some((p) => !p.place);
  const filtered = useMemo(() => visibleProjects(projects, { cities: chosen, stages, showUnknown, now }), [projects, chosen, stages, showUnknown, now]);

  // The towns on show: the first few and every chosen one, or all of them after "+ flere".
  const cityChips = useMemo(() => {
    const names = cityOptions.map((o) => o.name);
    for (const c of chosen) if (!names.some((n) => same(n, c))) names.push(c);
    if (moreCities) return names;
    return [...names.slice(0, TOP_CITIES), ...names.slice(TOP_CITIES).filter((n) => chosen.some((c) => same(c, n)))];
  }, [cityOptions, chosen, moreCities]);
  const hiddenCities = Math.max(0, cityOptions.length - cityChips.length);

  const context = [
    ...new Set((choices?.regions ?? []).map((r) => NORWAY_REGIONS[r]).filter((x): x is string => Boolean(x))),
    ...(choices?.domains ?? []).filter(isDomainKey).map((d) => domainLabel(d, "no")),
  ].join(" · ");

  if (!projects.length && !cityOptions.length) return <p className={`text-sm ${MUTED_L}`}>Ingen prosjekter passer valgene deres akkurat nå.</p>;

  const isChosen = (name: string) => chosen.some((c) => same(c, name));
  const toggleCity = async (name: string) => {
    if (!onCities || saving) return;
    const next = isChosen(name) ? chosen.filter((c) => !same(c, name)) : [...chosen, name];
    setCityError(null);
    setPending(next);
    setSaving(true);
    setShown(PAGE);
    const r = await onCities(next);
    setSaving(false);
    setPending(null);
    // Refused (too soon, or anything else): the towns stay as they were, and the ATS's own words say why.
    if (!r.ok) setCityError(r.message);
  };
  const toggleStage = (key: MinSideStage) => {
    setStages((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]));
    setShown(PAGE);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        {cityChips.length ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="By">
              <span className={`w-full text-[13px] sm:w-[86px] ${MUTED_L}`}>By</span>
              {cityChips.map((name) => {
                const on = isChosen(name);
                return (
                  <button key={name} type="button" aria-pressed={on} disabled={!onCities || saving} className={chip(on)} onClick={() => void toggleCity(name)}>
                    {on ? `${name} ✓` : name}
                  </button>
                );
              })}
              {hiddenCities > 0 || moreCities ? (
                <button
                  type="button"
                  aria-expanded={moreCities}
                  className={`inline-flex min-h-[36px] items-center rounded-full border border-dashed border-[#C9CFD8] bg-white px-3.5 text-[13px] ${MUTED_L} hover:border-[#1B2B44]`}
                  onClick={() => setMoreCities((m) => !m)}
                >
                  {moreCities ? "Færre" : "+ flere"}
                </button>
              ) : null}
            </div>
            {nextCityChange ? <p className={`text-xs sm:pl-[94px] ${MUTED_L}`}>Byene kan endres igjen fra {dayNo(nextCityChange)}</p> : null}
            {cityError ? (
              <p role="alert" className="text-sm font-semibold text-[#B42318] sm:pl-[94px]">
                {cityError}
              </p>
            ) : null}
          </div>
        ) : null}
        {stageChoices.length ? (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Stadium">
            <span className={`w-full text-[13px] sm:w-[86px] ${MUTED_L}`}>Stadium</span>
            {stageChoices.map((s) => {
              const on = stages.includes(s.key);
              return (
                <button key={s.key} type="button" aria-pressed={on} className={chip(on)} onClick={() => toggleStage(s.key)}>
                  {s.label}
                </button>
              );
            })}
            {context ? <span className={`text-[13px] sm:ml-2 ${MUTED_L}`}>{context}</span> : null}
          </div>
        ) : null}
        {anyUnknown ? (
          <label className={`flex min-h-[44px] cursor-pointer items-center gap-3 self-start text-sm ${SOFT}`}>
            <input
              type="checkbox"
              role="switch"
              aria-checked={showUnknown}
              className="h-5 w-5 accent-[#1B2B44]"
              checked={showUnknown}
              onChange={(e) => {
                setShowUnknown(e.target.checked);
                setShown(PAGE);
              }}
            />
            Vis prosjekter uten oppgitt sted
          </label>
        ) : null}
      </div>

      <p className={`border-t border-[#EFEBE2] pt-3.5 text-[15px] font-bold ${INK}`} aria-live="polite" data-ms-count="">
        {projectCountLine(filtered.length, chosen)}
      </p>
      {filtered.length ? (
        <ul className="flex flex-col gap-3">
          {filtered.slice(0, shown).map((p) => (
            <ProjectCard key={p.id} p={p} now={now} onAskPeople={onAskPeople} />
          ))}
        </ul>
      ) : (
        <p className={`text-sm ${MUTED_L}`}>Ingen prosjekter passer filteret.</p>
      )}
      {filtered.length > shown ? (
        <button type="button" onClick={() => setShown((n) => n + PAGE)} className={`${BTN_OUTLINE} self-start`}>
          Vis flere ({filtered.length - shown})
        </button>
      ) : null}
      {/* ORDER 100: the source, smaller than small, never a link (his words, 13 October 2026). */}
      <p className="max-w-[640px] text-[11px] font-normal leading-normal text-[#9AA3AF]">{PROJECT_SOURCE_LINE}</p>
    </div>
  );
}
