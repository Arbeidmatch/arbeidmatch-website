"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AtsMeter } from "@/app/cv-gen/_components/AtsMeter";
import { CheckboxGroup, SelectField, TextArea, TextField } from "@/app/cv-gen/_components/Fields";
import { ConsentModal } from "@/app/cv-gen/_components/ConsentModal";
import { CvPreview } from "@/app/cv-gen/_components/CvPreview";
import { ImproveButton } from "@/app/cv-gen/_components/ImproveButton";
import {
  CHANNEL_NAME,
  draftIssues,
  emptyDraft,
  isCompleteDraft,
  loadDraft,
  saveDraft,
  wipeDraft,
  type DraftMessage,
} from "@/lib/cv/draft";
import { suggestBullet, suggestSkill, suggestSummary } from "@/lib/cv/suggest";
import {
  CERTIFICATION_SUGGESTIONS,
  DRIVING_LICENCES,
  LANGUAGE_LEVELS,
  TEMPLATE_IDS,
  TEMPLATE_META,
  WORK_PERMITS,
  WORK_PERMIT_LABELS,
  dateRangeWithDuration,
  durationLabel,
  sortExperienceByDate,
  type CvDocument,
  type TemplateId,
} from "@/lib/cv/schema";

const STEPS = [
  "Template",
  "Your details",
  "Summary",
  "Work experience",
  "Education",
  "Certificates",
  "Skills and languages",
  "Cover letter",
  "Review",
] as const;

/** Index of "Work experience" in STEPS, the step whose roles get sorted on the way out. */
const EXPERIENCE_STEP = 3;

const BADGE_COPY: Record<string, { label: string; colour: string }> = {
  best: { label: "Best for ATS", colour: "#1D9E75" },
  good: { label: "Good", colour: "#C9A84C" },
  acceptable: { label: "Acceptable", colour: "#B26A00" },
};

const primaryButton =
  "rounded bg-[#C9A84C] px-5 py-3 font-bold text-[#0D1B2A] transition-colors hover:bg-[#B8913A] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A] disabled:cursor-not-allowed disabled:opacity-50";
const ghostButton =
  "rounded border border-[#E2E5EA] bg-white px-5 py-3 font-semibold text-[#55616D] transition-colors hover:border-[#0D1B2A] hover:text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]";
const smallButton =
  "rounded border border-[#E2E5EA] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#55616D] transition-colors hover:border-[#0D1B2A] hover:text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]";

export function CvBuilder({ policyVersion, demo }: { policyVersion: string; demo: CvDocument | null }) {
  const [doc, setDoc] = useState<CvDocument>(() => demo ?? emptyDraft());
  const [step, setStep] = useState(0);
  const [showConsent, setShowConsent] = useState(false);
  const [wiped, setWiped] = useState(false);
  const [downloadState, setDownloadState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [combined, setCombined] = useState(false);
  /** The last document actually written to localStorage. Comparing it to `doc` derives the save status. */
  const [savedDoc, setSavedDoc] = useState<CvDocument | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const hydrated = useRef(false);

  // Restore a draft on first paint. The demo fixture wins so screenshots are stable.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    // The requested step applies in both modes. It is how the guide screenshots land
    // on the right step and how a shared link reopens where someone left off.
    const params = new URLSearchParams(window.location.search);
    const requested = Number(params.get("step"));
    if (Number.isFinite(requested) && requested >= 1 && requested <= STEPS.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(requested - 1);
    }

    if (demo) return;
    const stored = loadDraft();
    // Reading localStorage is only possible after mount, so restoring a draft is
    // necessarily a second render. There is no server value to hydrate from.
    if (stored) setDoc(stored);
  }, [demo]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  // Debounced persist plus a broadcast to the preview tab.
  useEffect(() => {
    if (!hydrated.current || demo) return;
    const timer = window.setTimeout(() => {
      saveDraft(doc);
      setSavedDoc(doc);
      const message: DraftMessage = { type: "draft", doc, step };
      channelRef.current?.postMessage(message);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [doc, step, demo]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("step", String(step + 1));
    window.history.replaceState(null, "", url.toString());
  }, [step]);

  const issues = useMemo(() => draftIssues(doc), [doc]);
  const complete = useMemo(() => isCompleteDraft(doc), [doc]);

  const update = useCallback((mutate: (draft: CvDocument) => CvDocument) => {
    setDoc((current) => mutate(structuredClone(current)));
  }, []);

  /**
   * Moving between steps. Leaving the work experience step puts the roles in the order a
   * recruiter expects, most recent first. It happens on the way out rather than while
   * typing, so a card never jumps away mid-date.
   */
  const goToStep = useCallback(
    (target: number) => {
      const next = Math.max(0, Math.min(STEPS.length - 1, target));
      if (step === EXPERIENCE_STEP && next !== EXPERIENCE_STEP) {
        setDoc((current) => {
          const sorted = sortExperienceByDate(current.experience);
          const unchanged = sorted.every((entry, index) => entry === current.experience[index]);
          return unchanged ? current : { ...current, experience: sorted };
        });
      }
      setStep(next);
    },
    [step],
  );

  const wipeEverything = useCallback(() => {
    wipeDraft();
    const message: DraftMessage = { type: "wipe" };
    channelRef.current?.postMessage(message);
    setDoc(emptyDraft());
    setStep(0);
    setShowConsent(false);
    setWiped(true);
  }, []);

  async function download(token: string) {
    setDownloadState("working");
    setDownloadError(null);
    try {
      const response = await fetch("/api/cv/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, kind: combined && doc.coverLetter ? "combined" : "cv" }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { error?: string };
        setDownloadError(result.error ?? "The download failed. Your CV was also emailed to you.");
        setDownloadState("error");
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const fileName = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "ArbeidMatch_CV.pdf";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setDownloadState("done");
    } catch {
      setDownloadError("The download failed. Your CV was also emailed to you.");
      setDownloadState("error");
    }
  }

  if (wiped) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Your data has been deleted</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[#55616D]">
          Your data has been deleted from the CV generator. Nothing was saved. If you want a
          PDF, you will need to start the CV from the beginning.
        </p>
        <button type="button" onClick={() => setWiped(false)} className={`${primaryButton} mt-6`}>
          Start over
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] pb-28 lg:pb-0">
      <Stepper step={step} onSelect={goToStep} />

      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 lg:grid-cols-[45fr_55fr]">
        <div>
          <form onSubmit={(event) => event.preventDefault()} noValidate>
            {step === 0 ? <TemplateStep doc={doc} update={update} /> : null}
            {step === 1 ? <DetailsStep doc={doc} update={update} issues={issues} /> : null}
            {step === 2 ? <SummaryStep doc={doc} update={update} issues={issues} /> : null}
            {step === 3 ? <ExperienceStep doc={doc} update={update} issues={issues} /> : null}
            {step === 4 ? <EducationStep doc={doc} update={update} /> : null}
            {step === 5 ? <CertificationsStep doc={doc} update={update} /> : null}
            {step === 6 ? <SkillsStep doc={doc} update={update} issues={issues} /> : null}
            {step === 7 ? <CoverLetterStep doc={doc} update={update} /> : null}
            {step === 8 ? (
              <ReviewStep
                doc={doc}
                complete={complete}
                issues={issues}
                combined={combined}
                setCombined={setCombined}
                onDownload={() => setShowConsent(true)}
                downloadState={downloadState}
                downloadError={downloadError}
                onGoToStep={goToStep}
              />
            ) : null}
          </form>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              className={ghostButton}
              onClick={() => goToStep(step - 1)}
              disabled={step === 0}
            >
              Back
            </button>
            {/* Demo mode never writes to storage, so it has no save status to report. */}
            <span className="text-[13px] text-[#8A929C]" aria-live="polite">
              {demo ? "" : savedDoc === doc ? "Saved in this browser" : "Saving..."}
            </span>
            <button
              type="button"
              className={primaryButton}
              onClick={() => goToStep(step + 1)}
              disabled={step === STEPS.length - 1}
            >
              Next
            </button>
          </div>

          <button
            type="button"
            onClick={wipeEverything}
            className="mt-6 text-[13px] font-semibold text-[#8A929C] underline transition-colors hover:text-[#B03A2E] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]"
          >
            Clear everything and start again
          </button>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-4 space-y-4">
            <div className="rounded border border-[#E2E5EA] bg-white p-4">
              <PreviewFrame doc={doc} />
            </div>
            <AtsMeter doc={doc} />
          </div>
        </div>
      </div>

      <MobileBar onDownload={() => setStep(STEPS.length - 1)} />

      {showConsent ? (
        <ConsentModal
          doc={doc}
          policyVersion={policyVersion}
          onClose={() => setShowConsent(false)}
          onDecline={wipeEverything}
          onVerified={(token) => {
            setShowConsent(false);
            void download(token);
          }}
        />
      ) : null}
    </div>
  );
}

function PreviewFrame({ doc }: { doc: CvDocument }) {
  const [zoom, setZoom] = useState(1);
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">Preview</h2>
        <div className="flex items-center gap-2">
          <button type="button" className={smallButton} onClick={() => setZoom((v) => Math.max(0.7, v - 0.15))} aria-label="Zoom out">
            -
          </button>
          <span className="text-[13px] text-[#55616D]">{Math.round(zoom * 100)}%</span>
          <button type="button" className={smallButton} onClick={() => setZoom((v) => Math.min(1.6, v + 0.15))} aria-label="Zoom in">
            +
          </button>
        </div>
      </div>
      <div className="max-h-[70vh] overflow-auto border border-[#E2E5EA] bg-[#E9ECF0] p-3">
        <CvPreview doc={doc} scale={zoom} />
      </div>
      <p className="mt-2 text-[12px] text-[#8A929C]">Page 1 of the PDF, at {Math.round(zoom * 100)}%.</p>
    </>
  );
}

function Stepper({ step, onSelect }: { step: number; onSelect: (index: number) => void }) {
  return (
    <nav aria-label="CV steps" className="sticky top-0 z-30 border-b border-[#E2E5EA] bg-white">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="h-1 w-full bg-[#E2E5EA]">
          <div
            className="h-full bg-[#C9A84C] transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <ol className="flex gap-1 overflow-x-auto py-2">
          {STEPS.map((title, index) => (
            <li key={title}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-current={index === step ? "step" : undefined}
                className={`whitespace-nowrap rounded px-3 py-1.5 text-[13px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A84C] ${
                  index === step ? "bg-[#0D1B2A] text-white" : "text-[#55616D] hover:bg-[#F5F6F8]"
                }`}
              >
                {index + 1}. {title}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

function MobileBar({ onDownload }: { onDownload: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-[#E2E5EA] bg-white p-3 lg:hidden">
      <a
        href="/cv-gen/preview"
        target="_blank"
        rel="noopener"
        className={`${ghostButton} flex-1 text-center`}
      >
        Preview
      </a>
      <button type="button" onClick={onDownload} className={`${primaryButton} flex-1`}>
        Download
      </button>
    </div>
  );
}

interface StepProps {
  doc: CvDocument;
  update: (mutate: (draft: CvDocument) => CvDocument) => void;
  issues?: Record<string, string>;
}

function StepHeading({ title, intro }: { title: string; intro: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-2xl font-bold text-[#0D1B2A]">{title}</h1>
      <p className="mt-1 text-[15px] leading-relaxed text-[#55616D]">{intro}</p>
    </header>
  );
}

function TemplateStep({ doc, update }: StepProps) {
  return (
    <>
      <StepHeading
        title="Choose a layout"
        intro="All five carry the same information in the same order. They differ in how it looks. Classic is the safest choice when you do not know which system will read your CV."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {TEMPLATE_IDS.map((id: TemplateId) => {
          const meta = TEMPLATE_META[id];
          const badge = BADGE_COPY[meta.badge];
          const selected = doc.templateId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => update((draft) => ({ ...draft, templateId: id }))}
              aria-pressed={selected}
              className={`rounded border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A84C] ${
                selected ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[#E2E5EA] bg-white hover:border-[#0D1B2A]"
              }`}
            >
              <div className="pointer-events-none mb-3 overflow-hidden border border-[#E2E5EA]">
                <CvPreview doc={{ ...doc, templateId: id }} scale={0.5} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#0D1B2A]">{meta.name}</span>
                <span
                  className="rounded px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ backgroundColor: badge.colour }}
                >
                  {badge.label}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-snug text-[#55616D]">{meta.bestFor}</p>
              {meta.warning ? (
                <p className="mt-1 text-[13px] font-medium text-[#B26A00]">{meta.warning}</p>
              ) : null}
            </button>
          );
        })}
      </div>
    </>
  );
}

function DetailsStep({ doc, update, issues = {} }: StepProps) {
  const set = (key: keyof CvDocument["personal"], value: unknown) =>
    update((draft) => ({ ...draft, personal: { ...draft.personal, [key]: value } }));

  return (
    <>
      <StepHeading
        title="Your details"
        intro="Keep this short and factual. Do not add a photo, your date of birth or your national identity number. Norwegian employers do not want them on a CV."
      />
      <div className="grid gap-x-4 sm:grid-cols-2">
        <TextField
          label="First name"
          required
          value={doc.personal.firstName}
          onChange={(value) => set("firstName", value)}
          error={issues["personal.firstName"]}
        />
        <TextField
          label="Last name"
          required
          value={doc.personal.lastName}
          onChange={(value) => set("lastName", value)}
          error={issues["personal.lastName"]}
        />
      </div>
      <TextField
        label="Headline"
        required
        spellCheck
        help="Use a standard job title an employer would search for."
        example="Write Tiler rather than Tile artist."
        maxLength={60}
        value={doc.personal.headline}
        onChange={(value) => set("headline", value)}
        error={issues["personal.headline"]}
      />
      <div className="grid gap-x-4 sm:grid-cols-2">
        <TextField
          label="Email"
          type="email"
          required
          value={doc.personal.email}
          onChange={(value) => set("email", value)}
          error={issues["personal.email"]}
        />
        <TextField
          label="Phone"
          required
          help="Include the country code. A Norwegian number gets answered faster."
          example="+47 96734730"
          value={doc.personal.phone}
          onChange={(value) => set("phone", value.replace(/[^\d+]/g, ""))}
          error={issues["personal.phone"]}
        />
      </div>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <TextField
          label="City"
          required
          value={doc.personal.city}
          onChange={(value) => set("city", value)}
          error={issues["personal.city"]}
        />
        <TextField
          label="Country"
          required
          value={doc.personal.country}
          onChange={(value) => set("country", value)}
          error={issues["personal.country"]}
        />
      </div>
      <SelectField
        label="Work permit status"
        help="EU/EEA citizens can work in Norway without a visa. We do not sponsor visas."
        value={doc.personal.workPermit}
        onChange={(value) => set("workPermit", value)}
        options={WORK_PERMITS.map((permit) => ({ value: permit, label: WORK_PERMIT_LABELS[permit] }))}
      />
      <CheckboxGroup
        legend="Driving licence"
        help="Select every category you hold. Leave empty if you have none."
        options={DRIVING_LICENCES}
        values={doc.personal.drivingLicence ?? []}
        onToggle={(value) =>
          update((draft) => {
            const current = draft.personal.drivingLicence ?? [];
            const next = current.includes(value)
              ? current.filter((item) => item !== value)
              : [...current, value];
            return { ...draft, personal: { ...draft.personal, drivingLicence: next } };
          })
        }
      />
      <TextField
        label="LinkedIn (optional)"
        value={doc.personal.linkedin ?? ""}
        onChange={(value) => set("linkedin", value || undefined)}
        placeholder="https://www.linkedin.com/in/..."
        error={issues["personal.linkedin"]}
      />
    </>
  );
}

function SummaryStep({ doc, update, issues = {} }: StepProps) {
  return (
    <>
      <StepHeading
        title="Professional summary"
        intro="Three or four sentences an employer reads first. Say what you are, how long you have done it, and what you are certified for. Aim for 300 to 800 characters."
      />
      <TextArea
        label="Summary"
        required
        rows={7}
        maxLength={800}
        counter
        help="Write about yourself in the third person, without I or my. That is the convention on a Norwegian CV."
        example="Tiler with nine years of experience on residential and commercial sites in Norway and Romania."
        value={doc.summary}
        onChange={(value) => update((draft) => ({ ...draft, summary: value }))}
        error={issues.summary}
      />
      <ImproveButton
        label="Improve this summary"
        getSuggestion={() => suggestSummary(doc)}
        onAccept={(text) => update((draft) => ({ ...draft, summary: text }))}
      />
    </>
  );
}

function ExperienceStep({ doc, update, issues = {} }: StepProps) {
  const move = (index: number, direction: -1 | 1) =>
    update((draft) => {
      const target = index + direction;
      if (target < 0 || target >= draft.experience.length) return draft;
      const list = [...draft.experience];
      [list[index], list[target]] = [list[target], list[index]];
      return { ...draft, experience: list };
    });

  return (
    <>
      <StepHeading
        title="Work experience"
        intro="Add every job. They are put in order for you, most recent first, when you continue to the next step, and how long each one lasted is worked out from the dates. For each one, write two to six short lines that say what you actually did. Start each line with an action verb."
      />

      {doc.experience.map((entry, index) => (
        <fieldset key={index} className="mb-6 rounded border border-[#E2E5EA] bg-white p-4">
          <legend className="px-1 text-sm font-bold text-[#0D1B2A]">Role {index + 1}</legend>

          {/*
            Reordering appears once there is something to reorder.

            The owner photographed this on 12 August: one job on the page, and
            two dead grey buttons above the first thing he had to fill in. Both
            were disabled, because there is nowhere to move the only role, so the
            first thing the form said to him was two words he could not act on.
            The intro already promises the jobs are ordered for him by date,
            which makes the pair doubly puzzling on a single role.
          */}
          <div className="mb-3 flex flex-wrap gap-2 empty:mb-0">
            {doc.experience.length > 1 ? (
              <>
                <button type="button" className={smallButton} onClick={() => move(index, -1)} disabled={index === 0}>
                  Move up
                </button>
                <button
                  type="button"
                  className={smallButton}
                  onClick={() => move(index, 1)}
                  disabled={index === doc.experience.length - 1}
                >
                  Move down
                </button>
              </>
            ) : null}
            {doc.experience.length > 1 ? (
              <button
                type="button"
                className={smallButton}
                onClick={() =>
                  update((draft) => ({
                    ...draft,
                    experience: draft.experience.filter((_, i) => i !== index),
                  }))
                }
              >
                Remove
              </button>
            ) : null}
          </div>

          <TextField
            label="Job title"
            required
            spellCheck
            help="Use the title an employer would search for."
            example="Tiler, not Tile artist"
            value={entry.jobTitle}
            onChange={(value) =>
              update((draft) => {
                draft.experience[index].jobTitle = value;
                return draft;
              })
            }
            error={issues[`experience.${index}.jobTitle`]}
          />
          <div className="grid gap-x-4 sm:grid-cols-3">
            <TextField
              label="Company"
              required
              value={entry.company}
              onChange={(value) =>
                update((draft) => {
                  draft.experience[index].company = value;
                  return draft;
                })
              }
              error={issues[`experience.${index}.company`]}
            />
            <TextField
              label="City"
              required
              value={entry.city}
              onChange={(value) =>
                update((draft) => {
                  draft.experience[index].city = value;
                  return draft;
                })
              }
              error={issues[`experience.${index}.city`]}
            />
            <TextField
              label="Country"
              required
              value={entry.country}
              onChange={(value) =>
                update((draft) => {
                  draft.experience[index].country = value;
                  return draft;
                })
              }
              error={issues[`experience.${index}.country`]}
            />
          </div>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <TextField
              label="Start"
              required
              example="03/2021"
              value={entry.startDate}
              onChange={(value) =>
                update((draft) => {
                  draft.experience[index].startDate = value;
                  return draft;
                })
              }
              error={issues[`experience.${index}.startDate`]}
            />
            <TextField
              label="End"
              required
              example="02/2024, or write Present if you are still there"
              value={entry.endDate}
              onChange={(value) =>
                update((draft) => {
                  draft.experience[index].endDate = value;
                  return draft;
                })
              }
              error={issues[`experience.${index}.endDate`]}
            />
          </div>

          {/* Counted from the two dates and printed on the CV, so nobody has to work it out. */}
          {durationLabel(entry.startDate, entry.endDate) ? (
            <p className="-mt-2 mb-4 text-[13px] text-[#55616D]" aria-live="polite">
              {dateRangeWithDuration(entry.startDate, entry.endDate)} shows on your CV.
            </p>
          ) : null}

          <p className="mb-2 text-sm font-semibold text-[#0D1B2A]">What you did</p>
          {entry.bullets.map((bullet, bulletIndex) => (
            <div key={bulletIndex}>
              <TextArea
                label={`Line ${bulletIndex + 1}`}
                rows={2}
                maxLength={220}
                value={bullet}
                onChange={(value) =>
                  update((draft) => {
                    draft.experience[index].bullets[bulletIndex] = value;
                    return draft;
                  })
                }
                error={issues[`experience.${index}.bullets.${bulletIndex}`]}
              />
              <ImproveButton
                getSuggestion={() => suggestBullet(bullet, doc, index)}
                onAccept={(text) =>
                  update((draft) => {
                    draft.experience[index].bullets[bulletIndex] = text;
                    return draft;
                  })
                }
              />
            </div>
          ))}

          <div className="flex gap-2">
            {entry.bullets.length < 6 ? (
              <button
                type="button"
                className={smallButton}
                onClick={() =>
                  update((draft) => {
                    draft.experience[index].bullets.push("");
                    return draft;
                  })
                }
              >
                Add a line
              </button>
            ) : null}
            {entry.bullets.length > 2 ? (
              <button
                type="button"
                className={smallButton}
                onClick={() =>
                  update((draft) => {
                    draft.experience[index].bullets.pop();
                    return draft;
                  })
                }
              >
                Remove last line
              </button>
            ) : null}
          </div>
        </fieldset>
      ))}

      <button
        type="button"
        className={ghostButton}
        onClick={() =>
          update((draft) => ({
            ...draft,
            experience: [
              ...draft.experience,
              { jobTitle: "", company: "", city: "", country: "", startDate: "", endDate: "Present", bullets: ["", ""] },
            ],
          }))
        }
      >
        Add another job
      </button>
    </>
  );
}

function EducationStep({ doc, update }: StepProps) {
  return (
    <>
      <StepHeading
        title="Education"
        intro="Your qualification, where you got it and when. A trade diploma matters more here than a long list of courses."
      />
      {doc.education.map((entry, index) => (
        <fieldset key={index} className="mb-6 rounded border border-[#E2E5EA] bg-white p-4">
          <legend className="px-1 text-sm font-bold text-[#0D1B2A]">Qualification {index + 1}</legend>
          <TextField
            label="Qualification"
            required
            spellCheck
            example="Vocational diploma, Construction and finishing works"
            value={entry.qualification}
            onChange={(value) =>
              update((draft) => {
                draft.education[index].qualification = value;
                return draft;
              })
            }
          />
          <div className="grid gap-x-4 sm:grid-cols-3">
            <TextField
              label="Institution"
              required
              value={entry.institution}
              onChange={(value) =>
                update((draft) => {
                  draft.education[index].institution = value;
                  return draft;
                })
              }
            />
            <TextField
              label="City"
              required
              value={entry.city}
              onChange={(value) =>
                update((draft) => {
                  draft.education[index].city = value;
                  return draft;
                })
              }
            />
            <TextField
              label="Country"
              required
              value={entry.country}
              onChange={(value) =>
                update((draft) => {
                  draft.education[index].country = value;
                  return draft;
                })
              }
            />
          </div>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <TextField
              label="Start"
              required
              example="09/2012"
              value={entry.startDate}
              onChange={(value) =>
                update((draft) => {
                  draft.education[index].startDate = value;
                  return draft;
                })
              }
            />
            <TextField
              label="End"
              required
              example="06/2015"
              value={entry.endDate}
              onChange={(value) =>
                update((draft) => {
                  draft.education[index].endDate = value;
                  return draft;
                })
              }
            />
          </div>
          <button
            type="button"
            className={smallButton}
            onClick={() =>
              update((draft) => ({ ...draft, education: draft.education.filter((_, i) => i !== index) }))
            }
          >
            Remove
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className={ghostButton}
        onClick={() =>
          update((draft) => ({
            ...draft,
            education: [
              ...draft.education,
              { qualification: "", institution: "", city: "", country: "", startDate: "", endDate: "" },
            ],
          }))
        }
      >
        Add a qualification
      </button>
    </>
  );
}

function CertificationsStep({ doc, update }: StepProps) {
  const addCertificate = (name: string) =>
    update((draft) => ({ ...draft, certifications: [...draft.certifications, { name }] }));

  return (
    <>
      <StepHeading
        title="Certificates and licences"
        intro="These decide whether you can start on a Norwegian site at all. Add the ones you actually hold, with the dates."
      />

      <p className="mb-2 text-sm font-semibold text-[#0D1B2A]">Common in Norway</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {CERTIFICATION_SUGGESTIONS.filter(
          (name) => !doc.certifications.some((entry) => entry.name === name),
        ).map((name) => (
          <button key={name} type="button" className={smallButton} onClick={() => addCertificate(name)}>
            + {name}
          </button>
        ))}
      </div>

      {doc.certifications.map((entry, index) => (
        <fieldset key={index} className="mb-4 rounded border border-[#E2E5EA] bg-white p-4">
          <legend className="px-1 text-sm font-bold text-[#0D1B2A]">Certificate {index + 1}</legend>
          <TextField
            label="Name"
            required
            value={entry.name}
            onChange={(value) =>
              update((draft) => {
                draft.certifications[index].name = value;
                return draft;
              })
            }
          />
          <div className="grid gap-x-4 sm:grid-cols-3">
            <TextField
              label="Issued by"
              value={entry.issuer ?? ""}
              onChange={(value) =>
                update((draft) => {
                  draft.certifications[index].issuer = value || undefined;
                  return draft;
                })
              }
            />
            <TextField
              label="Issued"
              example="01/2024"
              value={entry.issued ?? ""}
              onChange={(value) =>
                update((draft) => {
                  draft.certifications[index].issued = value || undefined;
                  return draft;
                })
              }
            />
            <TextField
              label="Expires"
              example="01/2026"
              value={entry.expires ?? ""}
              onChange={(value) =>
                update((draft) => {
                  draft.certifications[index].expires = value || undefined;
                  return draft;
                })
              }
            />
          </div>
          <button
            type="button"
            className={smallButton}
            onClick={() =>
              update((draft) => ({
                ...draft,
                certifications: draft.certifications.filter((_, i) => i !== index),
              }))
            }
          >
            Remove
          </button>
        </fieldset>
      ))}
    </>
  );
}

function SkillsStep({ doc, update, issues = {} }: StepProps) {
  const [entry, setEntry] = useState("");

  const addSkill = (value: string) => {
    const clean = value.trim();
    if (!clean || doc.skills.includes(clean) || doc.skills.length >= 20) return;
    update((draft) => ({ ...draft, skills: [...draft.skills, clean] }));
    setEntry("");
  };

  return (
    <>
      <StepHeading
        title="Skills and languages"
        intro="Between 6 and 20 short skills. Use the words an employer searches for: the tools, materials and processes you work with."
      />

      <div className="mb-2 flex gap-2">
        <input
          aria-label="Add a skill"
          value={entry}
          onChange={(event) => setEntry(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addSkill(entry);
            }
          }}
          placeholder="Wall and floor tiling"
          className="flex-1 rounded border border-[#E2E5EA] bg-white px-3 py-2.5 text-[15px] text-[#0D1B2A] outline-none placeholder:text-[#8A929C] focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/40"
        />
        <button type="button" className={ghostButton} onClick={() => addSkill(entry)}>
          Add
        </button>
      </div>

      {entry.trim() ? (
        <ImproveButton
          label="Improve this skill"
          getSuggestion={() => suggestSkill(entry)}
          onAccept={(text) => addSkill(text)}
        />
      ) : null}

      {issues.skills ? (
        <p role="alert" className="mb-3 text-[13px] font-medium text-[#B03A2E]">
          {issues.skills}
        </p>
      ) : null}

      <ul className="mb-6 flex flex-wrap gap-2">
        {doc.skills.map((skill, index) => (
          <li key={skill}>
            <button
              type="button"
              onClick={() =>
                update((draft) => ({ ...draft, skills: draft.skills.filter((_, i) => i !== index) }))
              }
              className="rounded border border-[#C9A84C] bg-[#C9A84C]/15 px-3 py-1.5 text-[13px] font-semibold text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]"
              aria-label={`Remove ${skill}`}
            >
              {skill} &times;
            </button>
          </li>
        ))}
      </ul>

      <h2 className="mb-2 text-lg font-bold text-[#0D1B2A]">Languages</h2>
      {doc.languages.map((entryValue, index) => (
        <div key={index} className="grid gap-x-4 sm:grid-cols-[2fr_2fr_auto] sm:items-start">
          <TextField
            label="Language"
            required
            value={entryValue.language}
            onChange={(value) =>
              update((draft) => {
                draft.languages[index].language = value;
                return draft;
              })
            }
          />
          <SelectField
            label="Level"
            value={entryValue.level}
            onChange={(value) =>
              update((draft) => {
                draft.languages[index].level = value;
                return draft;
              })
            }
            options={LANGUAGE_LEVELS.map((level) => ({ value: level, label: level }))}
          />
          {doc.languages.length > 1 ? (
            <button
              type="button"
              className={`${smallButton} mt-7`}
              onClick={() =>
                update((draft) => ({ ...draft, languages: draft.languages.filter((_, i) => i !== index) }))
              }
            >
              Remove
            </button>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        className={ghostButton}
        onClick={() =>
          update((draft) => ({ ...draft, languages: [...draft.languages, { language: "", level: "Basic" }] }))
        }
      >
        Add a language
      </button>
    </>
  );
}

function CoverLetterStep({ doc, update }: StepProps) {
  const letter = doc.coverLetter;

  return (
    <>
      <StepHeading
        title="Cover letter"
        intro="Strongly recommended. Applications without a cover letter are given lower priority."
      />

      {!letter ? (
        <button
          type="button"
          className={primaryButton}
          onClick={() =>
            update((draft) => ({
              ...draft,
              coverLetter: { recipientName: "", companyName: "", companyCity: "", body: "" },
            }))
          }
        >
          Write a cover letter
        </button>
      ) : (
        <>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <TextField
              label="Who it is addressed to"
              help="Leave empty and it opens with Dear Hiring Manager."
              value={letter.recipientName ?? ""}
              onChange={(value) =>
                update((draft) => {
                  if (draft.coverLetter) draft.coverLetter.recipientName = value || undefined;
                  return draft;
                })
              }
            />
            <TextField
              label="Company"
              value={letter.companyName ?? ""}
              onChange={(value) =>
                update((draft) => {
                  if (draft.coverLetter) draft.coverLetter.companyName = value || undefined;
                  return draft;
                })
              }
            />
          </div>
          <TextArea
            label="Letter"
            required
            rows={12}
            maxLength={3000}
            counter
            help="Three to five short paragraphs. Why this job, what you have done that proves you can do it, and when you can start. Leave a blank line between paragraphs."
            value={letter.body}
            onChange={(value) =>
              update((draft) => {
                if (draft.coverLetter) draft.coverLetter.body = value;
                return draft;
              })
            }
          />
          <button
            type="button"
            className={smallButton}
            onClick={() => update((draft) => ({ ...draft, coverLetter: undefined }))}
          >
            Remove the cover letter
          </button>
        </>
      )}
    </>
  );
}

function ReviewStep({
  doc,
  complete,
  issues,
  combined,
  setCombined,
  onDownload,
  downloadState,
  downloadError,
  onGoToStep,
}: {
  doc: CvDocument;
  complete: boolean;
  issues: Record<string, string>;
  combined: boolean;
  setCombined: (value: boolean) => void;
  onDownload: () => void;
  downloadState: "idle" | "working" | "done" | "error";
  downloadError: string | null;
  onGoToStep: (index: number) => void;
}) {
  const problems = Object.entries(issues).slice(0, 8);

  return (
    <>
      <StepHeading
        title="Review and download"
        intro="Check the preview, then download. We confirm your consent with a code sent to your email, and your CV arrives in the same inbox."
      />

      <div className="mb-6 lg:hidden">
        <CvPreview doc={doc} scale={0.8} />
      </div>

      <div className="mb-6 lg:hidden">
        <AtsMeter doc={doc} />
      </div>

      {problems.length > 0 ? (
        <div className="mb-5 rounded border border-[#B03A2E]/40 bg-[#FDF3F2] p-4">
          <h2 className="text-sm font-bold text-[#B03A2E]">Still to fix</h2>
          <ul className="mt-2 space-y-1">
            {problems.map(([path, message]) => (
              <li key={path} className="text-[13px] text-[#7A2B22]">
                {message}
              </li>
            ))}
          </ul>
          <button type="button" className={`${smallButton} mt-3`} onClick={() => onGoToStep(1)}>
            Go back and fix
          </button>
        </div>
      ) : null}

      {doc.coverLetter ? (
        <label className="mb-5 flex cursor-pointer gap-3 rounded border border-[#E2E5EA] bg-white p-3">
          <input
            type="checkbox"
            checked={combined}
            onChange={(event) => setCombined(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#C9A84C]"
          />
          <span className="text-[14px] leading-relaxed text-[#0D1B2A]">
            Download the CV and cover letter as one file. Either way, both files are also
            emailed to you as separate attachments.
          </span>
        </label>
      ) : null}

      <button type="button" className={primaryButton} onClick={onDownload} disabled={!complete || downloadState === "working"}>
        {downloadState === "working" ? "Preparing your PDF..." : "Download PDF"}
      </button>

      {!complete ? (
        <p className="mt-2 text-[13px] text-[#55616D]">
          Fill in the required fields above and the download will unlock.
        </p>
      ) : null}

      {downloadState === "done" ? (
        <p className="mt-3 text-[14px] font-medium text-[#1D9E75]" aria-live="polite">
          Downloaded. A copy is in your inbox, with a link to see or delete your data.
        </p>
      ) : null}

      {downloadError ? (
        <p role="alert" className="mt-3 text-[14px] font-medium text-[#B03A2E]">
          {downloadError}
        </p>
      ) : null}
    </>
  );
}
