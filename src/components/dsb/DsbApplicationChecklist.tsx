"use client";

import { useMemo, useState } from "react";

const GOLD = "#C9A84C";
const NAVY = "#0f1923";

type Item = { id: string; label: string; note?: string; required: boolean };

const REQUIRED_ITEMS: Item[] = [
  {
    id: "cv",
    label: "CV with dated education and work experience in the electrical trade",
    note: "Must include biographical data, all relevant dates, and job descriptions.",
    required: true,
  },
  {
    id: "diploma",
    label: "Original diploma or school report with subject list and grades",
    note: "Include curriculum from the education program.",
    required: true,
  },
  {
    id: "diploma-tr",
    label: "Certified translation of diploma (if not in English, Swedish or Danish)",
    note: "Translation must be done by an approved translator.",
    required: true,
  },
  {
    id: "trade",
    label: "Original trade certificate, craft certificate, or journeyman certificate",
    note: "Must be the certificate for the specific electrical profession you are applying for.",
    required: true,
  },
  {
    id: "trade-tr",
    label: "Certified translation of trade certificate (if not in English, Swedish or Danish)",
    required: true,
  },
  {
    id: "refs",
    label: "Employer references proving minimum 1 year of practical experience in the last 10 years",
    note: "Experience must be from outside Norway. Must include dates and type of work.",
    required: true,
  },
  {
    id: "refs-tr",
    label: "Certified translation of employer references (if not in English, Swedish or Danish)",
    required: true,
  },
  {
    id: "passport",
    label: "Valid passport copy",
    note: "Must be currently valid at time of application.",
    required: true,
  },
];

const TEMP_ITEMS: Item[] = [
  {
    id: "project",
    label: "Project description: nature of work, duration, frequency, and continuity",
    required: false,
  },
  {
    id: "establishment",
    label: "Attestation of legal establishment in home EU/EEA member state",
    required: false,
  },
  {
    id: "summary",
    label: "Evidence of professional qualifications (summary document)",
    required: false,
  },
];

export default function DsbApplicationChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [tempOpen, setTempOpen] = useState(false);
  const requiredCount = REQUIRED_ITEMS.length;
  const done = useMemo(
    () => REQUIRED_ITEMS.filter((i) => checked[i.id]).length,
    [checked],
  );
  const pct = requiredCount ? Math.round((done / requiredCount) * 100) : 0;

  const toggle = (id: string) => {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  };

  return (
    <section className="border-t border-white/10 py-12 text-white md:py-16" style={{ backgroundColor: NAVY }}>
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <h2 className="text-2xl font-bold text-white">DSB Application Checklist</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">
          Use this checklist to prepare your DSB application documents. All items below are required by DSB for EU/EEA
          applicants.
        </p>

        <ul className="mt-10 space-y-4">
          {REQUIRED_ITEMS.map((item) => (
            <li key={item.id} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 md:px-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!checked[item.id]}
                  onChange={() => toggle(item.id)}
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-white/20 bg-transparent"
                  style={{ accentColor: GOLD }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium leading-snug text-white">{item.label}</span>
                  {item.note ? (
                    <span className="mt-1 block text-xs italic leading-relaxed text-white/45">{item.note}</span>
                  ) : null}
                </span>
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => setTempOpen((v) => !v)}
            className="text-left text-sm font-semibold"
            style={{ color: GOLD }}
            aria-expanded={tempOpen}
          >
            Additional documents for temporary approval only
            <span className="ml-1 text-white/50">{tempOpen ? "−" : "+"}</span>
          </button>
          {tempOpen ? (
            <ul className="mt-4 space-y-3 border-l-2 border-white/10 pl-4">
              {TEMP_ITEMS.map((item) => (
                <li key={item.id} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 md:px-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={!!checked[item.id]}
                      onChange={() => toggle(item.id)}
                      className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-white/20 bg-transparent"
                      style={{ accentColor: GOLD }}
                    />
                    <span className="text-[15px] leading-snug text-white/90">{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-8">
          <p className="text-[13px] text-white/50">
            {done} of {requiredCount} required documents checked
          </p>
          <div className="mt-2 w-full overflow-hidden rounded-[2px] bg-white/10" style={{ height: 4 }}>
            <div className="h-full rounded-[2px] bg-[#C9A84C] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div
          className="mt-5 rounded-lg border px-4 py-4 md:px-5"
          style={{ borderColor: "rgba(201,168,76,0.35)", background: "rgba(201,168,76,0.08)" }}
        >
          <p className="text-[13px] leading-relaxed text-white/85">
            Save or print this checklist before starting your application. You can also download the checklist as PDF
            from DSB.no.{" "}
            <a
              href="https://profapp.dsb.no/profapp/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#C9A84C] underline-offset-2 hover:underline"
            >
              Go to DSB application portal
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
