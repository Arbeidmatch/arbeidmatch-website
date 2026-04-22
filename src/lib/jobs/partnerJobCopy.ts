import type { JobRecord } from "@/lib/jobs/types";

/** Partner / client listings: neutral employer voice. ArbeidMatch-only listings may use "we". */
export function isPartnerNeutralJobCopy(job: Pick<JobRecord, "source" | "companyName">): boolean {
  if (job.source === "employer_board") return true;
  const n = (job.companyName || "").trim().toLowerCase();
  return Boolean(n) && n !== "arbeidmatch";
}

export function benefitsSectionTitleForJob(job: Pick<JobRecord, "source" | "companyName">): string {
  return isPartnerNeutralJobCopy(job) ? "About the offer" : "We offer";
}

/**
 * Rewrites first-person / ArbeidMatch-style phrases in stored markdown for partner listings.
 * Order: longest phrases first; headings and bold handled before generic "We offer".
 */
export function neutralWordingForPartnerJobMarkdown(markdown: string): string {
  if (!markdown) return markdown;
  let s = markdown;

  const phrasePairs: [RegExp, string][] = [
    [/We['']re looking for/gi, "The employer is looking for"],
    [/We are looking for/gi, "The employer is looking for"],
    [/We provide\b/gi, "The employer provides"],
    [/What we offer/gi, "About the offer"],
    [/Our team/gi, "The team"],
    [/Join us/gi, "About this role"],
  ];
  for (const [re, to] of phrasePairs) {
    s = s.replace(re, to);
  }

  s = s.replace(/(^#{1,6}\s*)We offer\b/gim, "$1About the offer");
  s = s.replace(/\*\*We offer\*\*/gi, "**About the offer**");
  s = s.replace(/\*\*What we offer\*\*/gi, "**About the offer**");
  s = s.replace(/\bWe offer\b/g, "The employer offers");
  s = s.replace(/\bwe offer\b/g, "the employer offers");

  return s;
}

/** Extra scrub for wizard-generated drafts (employer_requests → job post): avoid first-person "we". */
export function applyGeneratedEmployerJobTone(text: string): string {
  let s = neutralWordingForPartnerJobMarkdown(text);
  const extra: [RegExp, string][] = [
    [/We will\b/gi, "The employer will"],
    [/We want\b/gi, "The employer wants"],
    [/We need\b/gi, "This role needs"],
    [/We expect\b/gi, "The employer expects"],
    [/We require\b/gi, "The employer requires"],
    [/We value\b/gi, "The employer values"],
    [/We seek\b/gi, "The employer seeks"],
    [/We welcome\b/gi, "Candidates are welcome"],
  ];
  for (const [re, to] of extra) s = s.replace(re, to);
  return s;
}
