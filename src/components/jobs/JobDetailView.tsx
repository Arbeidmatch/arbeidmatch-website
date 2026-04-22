"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import ApplyWithProfileGate from "@/components/jobs/ApplyWithProfileGate";
import { JobMarkdownBody } from "@/components/jobs/JobMarkdown";
import ShareJobButton from "@/components/jobs/ShareJobButton";
import type { JobRecord } from "@/lib/jobs/types";
import JobCard from "@/components/jobs/JobCard";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function DetailSection({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;

  return (
    <section className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/75">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function normalizeList(items?: string[] | string | null): string[] {
  if (!items) return [];
  if (Array.isArray(items)) return items.map((item) => item.trim()).filter(Boolean);
  return items.split("\n").map((item) => item.trim()).filter(Boolean);
}

function normalizeComparableText(text: string): string {
  return text.replace(/\r\n/g, "\n").trim().replace(/\n{3,}/g, "\n\n");
}

function requirementsPlainText(requirements?: string[] | string | null): string {
  return normalizeList(requirements).join("\n");
}

function plainTextFromMarkdown(md: string): string {
  return normalizeComparableText(md)
    .replace(/^#{1,6}\s+/gm, " ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[*_`]/g, " ")
    .replace(/^[-*+]\s+/gm, " ")
    .replace(/^\d+\.\s+/gm, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function markdownHeadingsLower(description: string): string[] {
  const out: string[] = [];
  for (const line of description.split("\n")) {
    const m = line.match(/^#{1,6}\s*(.+)$/);
    if (m) out.push(m[1].trim().toLowerCase());
  }
  return out;
}

function descriptionHasWorkTasksHeading(description: string): boolean {
  return markdownHeadingsLower(description).some((t) =>
    /^(work\s+tasks?|arbeidsoppgaver|tasks?\s*&?\s*responsibilities)/.test(t),
  );
}

function descriptionHasWeOfferHeading(description: string): boolean {
  return markdownHeadingsLower(description).some((t) =>
    /^(we\s+offer|what\s+we\s+offer|benefits|vi\s+tilbyr)/.test(t),
  );
}

function descriptionCoversStructuredJobSections(description: string): boolean {
  const h = markdownHeadingsLower(description);
  const has = (patterns: RegExp[]) => h.some((title) => patterns.some((p) => p.test(title)));

  const work = has([/^work\s+tasks?$/, /^arbeidsoppgaver/, /^tasks?\s*&?\s*responsibilities/]);
  const qual = has([
    /^qualifications?$/,
    /^requirements?$/,
    /^personal\s+qualities$/,
    /^personlige\s+egenskaper/,
    /^krav(\s+til)?/,
    /^kvalifikasjoner/,
  ]);
  const offer = has([/^we\s+offer$/, /^benefits/, /^vi\s+tilbyr/, /^what\s+we\s+offer$/]);
  const personal = has([/^personal\s+qualities$/, /^personlige\s+egenskaper/, /^personlig\s+/]);

  const hits = [work, qual, offer, personal].filter(Boolean).length;
  return hits >= 3;
}

function descriptionHasQualificationsStyleHeading(description: string): boolean {
  return markdownHeadingsLower(description).some((title) =>
    /^(qualifications?|requirements?|personal\s+qualities|personlige\s+egenskaper|krav(\s+til)?|kvalifikasjoner)/.test(title),
  );
}

function isRequirementsContentAbsorbedByDescription(description: string, requirementsMarkdown: string): boolean {
  const reqMd = requirementsMarkdown.trim();
  if (!reqMd) return false;
  const reqPlain = plainTextFromMarkdown(reqMd);
  if (reqPlain.length < 12) return false;
  const descPlain = plainTextFromMarkdown(description);
  if (!descPlain.includes(reqPlain)) return false;
  return reqPlain.length >= 40 || reqPlain.length >= descPlain.length * 0.25;
}

function isRequirementsDuplicateOfDescription(description: string, requirements?: string[] | string | null): boolean {
  const req = normalizeComparableText(requirementsPlainText(requirements));
  if (!req) return false;
  return normalizeComparableText(description) === req;
}

function formatJobLocationHeadline(location: string): string {
  const loc = location.trim();
  if (!loc) return "Norway";
  const lower = loc.toLowerCase();
  if (/\bnorway\b|\bnorge\b/.test(lower)) return loc;
  return `${loc}, Norway`;
}

function listFieldToMarkdown(items?: string[] | string | null): string {
  const lines = normalizeList(items);
  if (!lines.length) return "";
  return lines
    .map((line) => {
      const t = line.trim();
      if (!t) return "";
      if (/^[-*+]\s/.test(t) || /^\d+\.\s/.test(t) || /^#{1,6}\s/.test(t)) return t;
      return `- ${t}`;
    })
    .filter(Boolean)
    .join("\n");
}

function isListFieldAbsorbedByDescription(description: string, items?: string[] | string | null): boolean {
  const md = listFieldToMarkdown(items);
  return isRequirementsContentAbsorbedByDescription(description, md);
}

function excerptPlainAfterFirstHeading(md: string, maxLen: number): string | null {
  const s = md.replace(/\r\n/g, "\n").trim();
  const lines = s.split("\n");
  let i = 0;
  if (lines[0]?.match(/^#{1,6}\s/)) {
    i = 1;
    while (i < lines.length && lines[i]?.trim() === "") i++;
  }
  const body = lines.slice(i).join("\n").trim();
  const plain = plainTextFromMarkdown(body);
  if (plain.length < 24) return null;
  if (plain.length <= maxLen) return plain;
  const cut = plain.slice(0, maxLen);
  const last = cut.lastIndexOf(" ");
  return `${(last > 30 ? cut.slice(0, last) : cut).trim()}…`;
}

function pickHeroBlurb(job: JobRecord): string | null {
  const desc = job.description?.trim() ?? "";
  if (!desc) return job.summary?.trim() ?? null;

  const sum = job.summary?.trim();
  if (sum) {
    const sumNorm = plainTextFromMarkdown(sum.replace(/\.\.\.\s*$/, ""));
    const descNorm = plainTextFromMarkdown(desc);
    const prefixLen = Math.min(100, sumNorm.length);
    if (sumNorm.length >= 24 && prefixLen > 0 && descNorm.startsWith(sumNorm.slice(0, prefixLen))) {
      return excerptPlainAfterFirstHeading(desc, 240);
    }
    return sum;
  }

  return excerptPlainAfterFirstHeading(desc, 240);
}

function MarkdownSection({ title, markdown }: { title: string; markdown: string }) {
  const trimmed = markdown?.trim() ?? "";
  if (!trimmed) return null;

  return (
    <section className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5 md:p-8">
      <h2 className="border-b border-[rgba(201,168,76,0.22)] pb-3 text-xl font-semibold tracking-tight text-white">{title}</h2>
      <div className="mt-6">
        <JobMarkdownBody markdown={trimmed} />
      </div>
    </section>
  );
}

type ListingBoardStatus = "draft" | "live" | "closed";

function defaultListingStatus(job: JobRecord): ListingBoardStatus {
  const fromMeta = job.employerBoardMeta?.listingStatus;
  if (fromMeta === "draft" || fromMeta === "live" || fromMeta === "closed") return fromMeta;
  if (job.status === "closed") return "closed";
  if (job.status === "draft") return "draft";
  return "live";
}

export default function JobDetailView({
  job,
  relatedJobs,
  browseOnly = false,
  shareUrl,
  surfaceKeyedTools = false,
}: {
  job: JobRecord;
  relatedJobs: JobRecord[];
  browseOnly?: boolean;
  shareUrl?: string;
  surfaceKeyedTools?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const applyHref =
    job.applicationMethod === "external_url"
      ? job.applicationUrl || `/jobs/${job.slug}/apply`
      : job.applicationMethod === "email"
        ? `mailto:${job.applicationEmail || "post@arbeidmatch.no"}`
        : `/jobs/${job.slug}/apply`;
  const applyExternal = job.applicationMethod === "external_url";

  const requirementsMarkdown = useMemo(() => {
    const raw = job.requirements;
    if (!raw) return "";
    if (typeof raw === "string") return raw.trim();
    return listFieldToMarkdown(raw);
  }, [job.requirements]);

  const workTasksMarkdown = useMemo(() => listFieldToMarkdown(job.responsibilities), [job.responsibilities]);

  const benefitsMarkdown = useMemo(() => listFieldToMarkdown(job.benefits), [job.benefits]);

  const showQualifications = useMemo(() => {
    const trimmed = requirementsMarkdown.trim();
    if (!trimmed) return false;
    if (isRequirementsDuplicateOfDescription(job.description, job.requirements)) return false;
    if (isRequirementsContentAbsorbedByDescription(job.description, requirementsMarkdown)) return false;
    if (descriptionCoversStructuredJobSections(job.description)) return false;
    if (descriptionHasQualificationsStyleHeading(job.description)) return false;
    return true;
  }, [job.description, job.requirements, requirementsMarkdown]);

  const showWorkTasks = useMemo(() => {
    if (!workTasksMarkdown.trim()) return false;
    if (descriptionCoversStructuredJobSections(job.description)) return false;
    if (descriptionHasWorkTasksHeading(job.description)) return false;
    if (isListFieldAbsorbedByDescription(job.description, job.responsibilities)) return false;
    return true;
  }, [job.description, job.responsibilities, workTasksMarkdown]);

  const showWeOffer = useMemo(() => {
    if (!benefitsMarkdown.trim()) return false;
    if (descriptionCoversStructuredJobSections(job.description)) return false;
    if (descriptionHasWeOfferHeading(job.description)) return false;
    if (isListFieldAbsorbedByDescription(job.description, job.benefits)) return false;
    return true;
  }, [benefitsMarkdown, job.benefits, job.description]);

  const boardId = job.employerJobId ?? null;
  const canSurface = Boolean(surfaceKeyedTools && job.source === "employer_board" && boardId);

  const [revising, setRevising] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [draftTitle, setDraftTitle] = useState(job.title);
  const [draftDescription, setDraftDescription] = useState(job.description);
  const [draftRequirements, setDraftRequirements] = useState(() => requirementsPlainText(job.requirements));
  const [draftSalaryMin, setDraftSalaryMin] = useState(() =>
    job.employerBoardMeta?.salaryMin != null ? String(job.employerBoardMeta.salaryMin) : "",
  );
  const [draftSalaryMax, setDraftSalaryMax] = useState(() =>
    job.employerBoardMeta?.salaryMax != null ? String(job.employerBoardMeta.salaryMax) : "",
  );
  const [draftListingStatus, setDraftListingStatus] = useState<ListingBoardStatus>(() => defaultListingStatus(job));

  const resetDraftFromJob = useCallback(() => {
    setDraftTitle(job.title);
    setDraftDescription(job.description);
    setDraftRequirements(requirementsPlainText(job.requirements));
    setDraftSalaryMin(job.employerBoardMeta?.salaryMin != null ? String(job.employerBoardMeta.salaryMin) : "");
    setDraftSalaryMax(job.employerBoardMeta?.salaryMax != null ? String(job.employerBoardMeta.salaryMax) : "");
    setDraftListingStatus(defaultListingStatus(job));
  }, [job]);

  const beginRevise = useCallback(() => {
    resetDraftFromJob();
    setSaveError(null);
    setRevising(true);
  }, [resetDraftFromJob]);

  const cancelRevise = useCallback(() => {
    resetDraftFromJob();
    setSaveError(null);
    setRevising(false);
  }, [resetDraftFromJob]);

  const saveRevise = useCallback(async () => {
    if (!boardId) return;
    const key = searchParams.get("admin")?.trim();
    if (!key) {
      setSaveError("Missing key.");
      return;
    }

    const parseNum = (s: string): number | null => {
      const t = s.trim();
      if (!t) return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : NaN;
    };

    const salaryMin = parseNum(draftSalaryMin);
    const salaryMax = parseNum(draftSalaryMax);
    if (Number.isNaN(salaryMin) || Number.isNaN(salaryMax)) {
      setSaveError("Salary must be empty or valid numbers.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/employer/board-job/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: key,
          title: draftTitle.trim(),
          description: draftDescription.trim(),
          requirements: draftRequirements.trim(),
          salaryMin,
          salaryMax,
          status: draftListingStatus,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setSaveError(typeof data.error === "string" ? data.error : "Save failed.");
        return;
      }
      setRevising(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }, [
    boardId,
    draftDescription,
    draftListingStatus,
    draftRequirements,
    draftSalaryMax,
    draftSalaryMin,
    draftTitle,
    router,
    searchParams,
  ]);

  const summaryPreview = useMemo(() => {
    if (revising) {
      const d = draftDescription.trim();
      if (!d) return "";
      return d.length > 220 ? `${d.slice(0, 220)}...` : d;
    }
    return pickHeroBlurb(job);
  }, [revising, draftDescription, job]);

  type MetaRow = { label: string; view: ReactNode; revise?: ReactNode };

  const metaRows: MetaRow[] = useMemo(() => {
    const base: MetaRow[] = [
      { label: "Contract", view: job.contractType ?? "-" },
      { label: "Work type", view: job.workModel ?? "-" },
      {
        label: "Salary",
        view: job.salary ?? "Based on experience",
        revise: (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={draftSalaryMin}
              onChange={(e) => setDraftSalaryMin(e.target.value)}
              className="w-[100px] rounded border border-white/15 bg-[#0D1B2A] px-2 py-1 text-sm text-white"
              min={0}
            />
            <span className="text-white/45">to</span>
            <input
              type="number"
              inputMode="numeric"
              value={draftSalaryMax}
              onChange={(e) => setDraftSalaryMax(e.target.value)}
              className="w-[100px] rounded border border-white/15 bg-[#0D1B2A] px-2 py-1 text-sm text-white"
              min={0}
            />
          </div>
        ),
      },
      { label: "Published", view: job.publishedAt ? formatDate(job.publishedAt) : "-" },
      { label: "Start date", view: job.startDate ? formatDate(job.startDate) : "As agreed" },
      { label: "Application", view: job.applicationMethod ?? "internal" },
    ];

    if (!(canSurface && revising)) return base;

    const listingRow: MetaRow = {
      label: "Listing",
      view: draftListingStatus,
      revise: (
        <select
          value={draftListingStatus}
          onChange={(e) => setDraftListingStatus(e.target.value as ListingBoardStatus)}
          className="mt-1 w-full max-w-[200px] rounded border border-white/15 bg-[#0D1B2A] px-2 py-1.5 text-sm text-white"
        >
          <option value="draft">draft</option>
          <option value="live">live</option>
          <option value="closed">closed</option>
        </select>
      ),
    };

    return [...base.slice(0, 5), listingRow, base[5]!];
  }, [
    canSurface,
    revising,
    job.contractType,
    job.workModel,
    job.salary,
    job.publishedAt,
    job.startDate,
    job.applicationMethod,
    draftSalaryMin,
    draftSalaryMax,
    draftListingStatus,
  ]);

  return (
    <div className="container-site pb-16 pt-6 md:pt-8">
      <Link href="/jobs" className="link-text-premium inline-flex text-sm font-medium text-[#C9A84C]">
        Back to all jobs
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article
          className={`relative rounded-[20px] border bg-white/[0.03] p-6 md:p-8 ${
            job.source === "employer_board"
              ? "border-[#C9A84C]/40 bg-[linear-gradient(145deg,rgba(13,27,42,0.95),rgba(17,30,46,0.92))]"
              : "border-[#C9A84C]/20"
          }`}
        >
          {canSurface && !revising ? (
            <div className="absolute right-4 top-4 z-10 md:right-6 md:top-6">
              <button
                type="button"
                onClick={beginRevise}
                className="rounded-md border border-[rgba(201,168,76,0.45)] bg-[rgba(201,168,76,0.12)] px-3 py-1.5 text-xs font-semibold text-[#C9A84C] transition-colors hover:bg-[rgba(201,168,76,0.2)]"
              >
                Edit
              </button>
            </div>
          ) : null}

          {canSurface && revising ? (
            <div className="absolute right-4 top-4 z-10 flex flex-wrap justify-end gap-2 md:right-6 md:top-6">
              <button
                type="button"
                onClick={cancelRevise}
                disabled={saving}
                className="rounded-md border border-white/20 bg-transparent px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveRevise()}
                disabled={saving}
                className="rounded-md border border-[rgba(201,168,76,0.55)] bg-[#C9A84C] px-3 py-1.5 text-xs font-semibold text-[#0D1B2A] hover:brightness-110 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          ) : null}

          <header className={canSurface ? "pr-24 md:pr-32" : undefined}>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/65">{formatJobLocationHeadline(job.location)}</p>
            {revising && canSurface ? (
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="mt-3 w-full max-w-3xl rounded-lg border border-white/15 bg-[#0D1B2A]/80 px-3 py-2 text-2xl font-bold text-white md:text-3xl"
              />
            ) : (
              <h1 className="mt-3 text-3xl font-bold leading-tight text-white md:text-4xl">{job.title}</h1>
            )}
            {summaryPreview ? (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/75">{summaryPreview}</p>
            ) : null}
          </header>

          {saveError ? <p className="mt-3 text-sm text-red-300/90">{saveError}</p> : null}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metaRows.map((row) => (
              <div key={row.label} className="rounded-xl border border-white/10 bg-[#0D1B2A]/60 p-3">
                <p className="text-xs text-white/45">{row.label}</p>
                {revising && canSurface && row.revise != null ? row.revise : <p className="mt-1 text-sm font-semibold text-white">{row.view}</p>}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">{job.trade ? <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/75">{job.trade}</span> : null}</div>

          <div className="mt-10 space-y-8 md:space-y-10">
            {revising && canSurface ? (
              <section className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5 md:p-8">
                <h2 className="border-b border-[rgba(201,168,76,0.22)] pb-3 text-xl font-semibold tracking-tight text-white">About the role</h2>
                <textarea
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  rows={14}
                  className="mt-6 w-full resize-y rounded-lg border border-white/15 bg-[#0D1B2A]/80 p-3 font-mono text-sm leading-relaxed text-white"
                />
              </section>
            ) : (
              <MarkdownSection title="About the role" markdown={job.description} />
            )}
            {showWorkTasks ? <MarkdownSection title="Work tasks" markdown={workTasksMarkdown} /> : null}
            {revising && canSurface ? (
              <section className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5 md:p-8">
                <h2 className="border-b border-[rgba(201,168,76,0.22)] pb-3 text-xl font-semibold tracking-tight text-white">Qualifications</h2>
                <textarea
                  value={draftRequirements}
                  onChange={(e) => setDraftRequirements(e.target.value)}
                  rows={8}
                  className="mt-6 w-full resize-y rounded-lg border border-white/15 bg-[#0D1B2A]/80 p-3 font-mono text-sm leading-relaxed text-white"
                />
              </section>
            ) : showQualifications ? (
              <MarkdownSection title="Qualifications" markdown={requirementsMarkdown} />
            ) : null}
            {showWeOffer ? <MarkdownSection title="We offer" markdown={benefitsMarkdown} /> : null}
            <DetailSection
              title="Application method"
              items={[
                job.applicationMethod === "external_url"
                  ? "Apply via external application page."
                  : job.applicationMethod === "email"
                    ? `Apply by email: ${job.applicationEmail || "post@arbeidmatch.no"}`
                    : "Apply directly through ArbeidMatch form.",
              ]}
            />
          </div>
        </article>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:h-fit">
          <div className="rounded-[18px] border border-[#C9A84C]/25 bg-[#0A0F18] p-5">
            <p className="text-sm text-white/70">{browseOnly ? "Browse mode" : "Ready to apply?"}</p>
            {browseOnly ? (
              <Link
                href="/for-candidates"
                className="mt-3 inline-flex w-full min-h-[46px] items-center justify-center rounded-md border border-[rgba(201,168,76,0.35)] bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[rgba(201,168,76,0.08)]"
              >
                How to unlock applications
              </Link>
            ) : job.applicationMethod === "internal" || !job.applicationMethod ? (
              <ApplyWithProfileGate
                applyHref={applyHref}
                className="btn-gold-premium mt-3 inline-flex w-full min-h-[46px] items-center justify-center rounded-md bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0D1B2A]"
              >
                Apply now
              </ApplyWithProfileGate>
            ) : (
              <a
                href={applyHref}
                target={applyExternal ? "_blank" : undefined}
                rel={applyExternal ? "noopener noreferrer" : undefined}
                className="btn-gold-premium mt-3 inline-flex w-full min-h-[46px] items-center justify-center rounded-md bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0D1B2A]"
              >
                Apply now
              </a>
            )}
            {shareUrl ? (
              <div className="mt-3">
                <ShareJobButton jobUrl={shareUrl} jobTitle={job.title} />
              </div>
            ) : null}
            <p className="mt-3 text-xs leading-relaxed text-white/55">
              {browseOnly
                ? "You are viewing jobs in read-only mode. Use your invitation email or contact us to unlock applications."
                : "Fast and direct process. ArbeidMatch recruits continuously for trusted clients in Norway."}
            </p>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Verified process</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>Verified opportunities</li>
              <li>Norway-focused recruitment</li>
              <li>Professional screening process</li>
            </ul>
            {job.applicationEmail ? (
              <a
                href={`mailto:${job.applicationEmail}`}
                className="link-text-premium mt-3 inline-flex text-sm font-medium text-[#C9A84C]"
              >
                Contact support
              </a>
            ) : null}
          </div>
        </aside>
      </div>

      {relatedJobs.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">Related jobs</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relatedJobs.map((relatedJob) => (
              <JobCard key={relatedJob.id} job={relatedJob} browseOnly={browseOnly} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-[120] border-t border-[#C9A84C]/25 bg-[#0A0F18]/95 p-3 backdrop-blur-sm lg:hidden">
        {browseOnly ? (
          <Link
            href="/for-candidates"
            className="inline-flex w-full min-h-[46px] items-center justify-center rounded-md border border-[rgba(201,168,76,0.35)] bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[rgba(201,168,76,0.08)]"
          >
            How to unlock applications
          </Link>
        ) : job.applicationMethod === "internal" || !job.applicationMethod ? (
          <Link
            href={applyHref}
            className="btn-gold-premium inline-flex w-full min-h-[46px] items-center justify-center rounded-md bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0D1B2A]"
          >
            Apply now
          </Link>
        ) : (
          <a
            href={applyHref}
            target={applyExternal ? "_blank" : undefined}
            rel={applyExternal ? "noopener noreferrer" : undefined}
            className="btn-gold-premium inline-flex w-full min-h-[46px] items-center justify-center rounded-md bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0D1B2A]"
          >
            Apply now
          </a>
        )}
      </div>
    </div>
  );
}
