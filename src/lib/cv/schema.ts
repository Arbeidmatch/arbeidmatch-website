import { z } from "zod";

/**
 * Single source of truth for the CV builder: form validation, live preview,
 * PDF rendering, the ATS payload and the `cv_documents.payload` jsonb column.
 */

export const TEMPLATE_IDS = [
  "classic-linear",
  "modern-header",
  "two-column-right",
  "label-left",
  "compact-sidebar",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type AtsBadge = "best" | "good" | "acceptable";

export const TEMPLATE_META: Record<
  TemplateId,
  { name: string; bestFor: string; badge: AtsBadge; warning?: string }
> = {
  "classic-linear": {
    name: "Classic",
    bestFor: "Any trade. The safest choice when you do not know which system reads your CV.",
    badge: "best",
  },
  "modern-header": {
    name: "Modern header",
    bestFor: "Experienced candidates who want the job title to stand out at the top.",
    badge: "best",
  },
  "two-column-right": {
    name: "Skills rail",
    bestFor: "Candidates with many certificates and licences to show next to the experience.",
    badge: "good",
  },
  "label-left": {
    name: "Label gutter",
    bestFor: "Long work histories that need clear separation between sections.",
    badge: "good",
  },
  "compact-sidebar": {
    name: "Compact sidebar",
    bestFor: "A more designed look. Some older parsers read sidebars less reliably.",
    badge: "acceptable",
    warning: "Some recruitment systems read sidebar layouts less reliably. Classic is safer.",
  },
};

/** MM/YYYY, month 01-12. */
export const MONTH_YEAR_RE = /^(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
const monthYear = z.string().regex(MONTH_YEAR_RE, "Use MM/YYYY, for example 03/2021");
const endMonthYear = z.union([monthYear, z.literal("Present")]);

/** International format, 8-15 digits after the plus. */
export const PHONE_RE = /^\+[1-9]\d{7,14}$/;

export const WORK_PERMITS = ["eu-eea", "norwegian-citizen", "other-permit", "prefer-not-to-say"] as const;
export const WORK_PERMIT_LABELS: Record<(typeof WORK_PERMITS)[number], string> = {
  "eu-eea": "EU/EEA citizen",
  "norwegian-citizen": "Norwegian citizen",
  "other-permit": "Other valid work permit",
  "prefer-not-to-say": "Prefer not to say",
};

export const DRIVING_LICENCES = ["B", "BE", "C", "CE", "D"] as const;

export const LANGUAGE_LEVELS = ["Native", "Fluent", "Professional", "Intermediate", "Basic"] as const;

/**
 * Norwegian trades certificates, English first with the Norwegian term in brackets.
 *
 * NO HMS-KORT HERE, and the owner said so on 12 August looking at this list. An
 * HMS card is not a qualification somebody earns and carries to an interview: it
 * is an identity card the employer orders once a person is hired onto a site, so
 * a candidate writing his CV either does not have one yet or has one that says
 * nothing about what he can do. Offering it as a chip invites him to claim a
 * document he is not the holder of and teaches the reader nothing.
 */
export const CERTIFICATION_SUGGESTIONS = [
  "Hot work certificate (varme arbeider)",
  "Scaffolding course (stillaskurs)",
  "Forklift licence (truckforerbevis)",
  "Working at heights",
  "Wet room certification (vatromssertifisering)",
  "Asbestos course",
  "First aid",
] as const;

const trimmed = (max: number, label: string) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be at most ${max} characters`);

export const personalSchema = z.object({
  firstName: trimmed(60, "First name"),
  lastName: trimmed(60, "Last name"),
  headline: trimmed(60, "Headline"),
  email: z.string().trim().email("Enter a valid email address").max(200),
  phone: z.string().trim().regex(PHONE_RE, "Use international format, for example +47 96734730"),
  city: trimmed(80, "City"),
  country: trimmed(80, "Country"),
  streetAddress: z.string().trim().max(160).optional(),
  linkedin: z.string().trim().url("Enter a full https:// address").max(300).optional(),
  portfolio: z.string().trim().url("Enter a full https:// address").max(300).optional(),
  workPermit: z.enum(WORK_PERMITS),
  drivingLicence: z.array(z.enum(DRIVING_LICENCES)).max(5).optional(),
});

export const experienceSchema = z.object({
  jobTitle: trimmed(90, "Job title"),
  company: trimmed(90, "Company"),
  city: trimmed(80, "City"),
  country: trimmed(80, "Country"),
  startDate: monthYear,
  endDate: endMonthYear,
  bullets: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Write what you did here, or remove this line")
        .max(220, "Keep each line under 220 characters"),
    )
    .min(2, "Add at least 2 lines")
    .max(6, "Use at most 6 lines"),
});

export const educationSchema = z.object({
  qualification: trimmed(120, "Qualification"),
  institution: trimmed(120, "Institution"),
  city: trimmed(80, "City"),
  country: trimmed(80, "Country"),
  startDate: monthYear,
  endDate: endMonthYear,
  details: z.string().trim().max(300).optional(),
});

export const certificationSchema = z.object({
  name: trimmed(120, "Certificate name"),
  issuer: z.string().trim().max(120).optional(),
  issued: monthYear.optional(),
  expires: monthYear.optional(),
});

export const languageSchema = z.object({
  language: trimmed(60, "Language"),
  level: z.enum(LANGUAGE_LEVELS),
});

export const coverLetterSchema = z.object({
  recipientName: z.string().trim().max(120).optional(),
  recipientTitle: z.string().trim().max(120).optional(),
  companyName: z.string().trim().max(120).optional(),
  companyCity: z.string().trim().max(120).optional(),
  body: z.string().trim().min(200, "Write at least 3 short paragraphs").max(3000),
});

export const cvDocumentSchema = z.object({
  version: z.literal(1),
  templateId: z.enum(TEMPLATE_IDS),
  locale: z.literal("en"),
  personal: personalSchema,
  summary: z
    .string()
    .trim()
    .min(1, "Write a short professional summary")
    .max(800, "Keep the summary under 800 characters"),
  experience: z.array(experienceSchema).min(1, "Add at least one role").max(12),
  education: z.array(educationSchema).max(8),
  certifications: z.array(certificationSchema).max(20),
  skills: z
    .array(z.string().trim().min(1, "Write the skill, or remove it").max(60, "Keep each skill under 60 characters"))
    .min(6, "List at least 6 skills")
    .max(20, "Use at most 20 skills"),
  languages: z.array(languageSchema).min(1, "Add at least one language").max(10),
  coverLetter: coverLetterSchema.optional(),
});

export type CvDocument = z.infer<typeof cvDocumentSchema>;
export type CvPersonal = z.infer<typeof personalSchema>;
export type CvExperience = z.infer<typeof experienceSchema>;
export type CvEducation = z.infer<typeof educationSchema>;
export type CvCertification = z.infer<typeof certificationSchema>;
export type CvLanguage = z.infer<typeof languageSchema>;
export type CvCoverLetter = z.infer<typeof coverLetterSchema>;

/** Section headings, identical across every template so parsers see one vocabulary. */
export const SECTION_HEADINGS = {
  summary: "SUMMARY",
  experience: "WORK EXPERIENCE",
  education: "EDUCATION",
  certifications: "CERTIFICATIONS",
  skills: "SKILLS",
  languages: "LANGUAGES",
} as const;

export const SECTION_ORDER = [
  SECTION_HEADINGS.summary,
  SECTION_HEADINGS.experience,
  SECTION_HEADINGS.education,
  SECTION_HEADINGS.certifications,
  SECTION_HEADINGS.skills,
  SECTION_HEADINGS.languages,
] as const;

/**
 * Loose detector for national identity numbers (Norwegian fodselsnummer, Romanian CNP,
 * Polish PESEL). Used for a non-blocking warning, never to reject input.
 */
export function looksLikeNationalId(value: string): boolean {
  const digitsOnly = value.replace(/[\s.-]/g, "");
  return /(?:^|\D)(\d{11}|\d{13})(?:\D|$)/.test(digitsOnly);
}

export function fullName(personal: Pick<CvPersonal, "firstName" | "lastName">): string {
  return `${personal.firstName} ${personal.lastName}`.trim();
}

export function dateRange(startDate: string, endDate: string): string {
  return `${startDate} - ${endDate}`;
}

/** Months since year zero, so two MM/YYYY dates can be compared and subtracted. */
function monthNumber(value: string): number | null {
  const match = /^(\d{1,2})\s*[/.-]\s*(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return null;
  return Number(match[2]) * 12 + (month - 1);
}

function currentMonthNumber(): number {
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth();
}

/** True for the word the End field accepts instead of a date. */
function isPresent(value: string): boolean {
  return /^present$/i.test(value.trim());
}

/**
 * Length of a role in months. Counted as the distance between the two dates, so
 * 01/2025 to 01/2026 is one year rather than thirteen months, and a role that starts
 * and ends inside the same month still counts as one.
 */
export function monthsBetween(startDate: string, endDate: string): number | null {
  const start = monthNumber(startDate);
  if (start === null) return null;
  const end = isPresent(endDate) ? currentMonthNumber() : monthNumber(endDate);
  if (end === null || end < start) return null;
  return Math.max(1, end - start);
}

/** "2 years 11 months", "1 year", "5 months". Empty when the dates cannot be read. */
export function durationLabel(startDate: string, endDate: string): string {
  const months = monthsBetween(startDate, endDate);
  if (months === null) return "";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (rest > 0) parts.push(`${rest} ${rest === 1 ? "month" : "months"}`);
  return parts.join(" ");
}

/** The date range an employer reads, with how long it lasted: "03/2021 - Present (4 years)". */
export function dateRangeWithDuration(startDate: string, endDate: string): string {
  const label = durationLabel(startDate, endDate);
  return label ? `${dateRange(startDate, endDate)} (${label})` : dateRange(startDate, endDate);
}

/**
 * Most recent role first, which is the order every recruiter and every parser expects.
 * Ranked on the end date, then the start date. Roles whose dates cannot be read yet keep
 * their own order and sit at the bottom, so nothing a candidate is still typing jumps away.
 */
export function sortExperienceByDate<T extends { startDate: string; endDate: string }>(
  entries: T[],
): T[] {
  const ranked = entries.map((entry, index) => {
    const start = monthNumber(entry.startDate);
    const end = isPresent(entry.endDate) ? Number.MAX_SAFE_INTEGER : monthNumber(entry.endDate);
    return { entry, index, start, end: end ?? start };
  });

  ranked.sort((a, b) => {
    const aDated = a.start !== null;
    const bDated = b.start !== null;
    if (aDated !== bDated) return aDated ? -1 : 1;
    if (!aDated || !bDated) return a.index - b.index;
    if (a.end !== b.end) return (b.end ?? 0) - (a.end ?? 0);
    if (a.start !== b.start) return (b.start ?? 0) - (a.start ?? 0);
    return a.index - b.index;
  });

  return ranked.map((item) => item.entry);
}

/** ASCII transliteration for filenames. Keeps Romanian and Norwegian names readable. */
export function transliterate(value: string): string {
  const map: Record<string, string> = {
    æ: "ae", ø: "o", å: "a", ß: "ss",
    ș: "s", ş: "s", ț: "t", ţ: "t", ă: "a", â: "a", î: "i",
    ł: "l", ż: "z", ź: "z", ć: "c", ń: "n", ę: "e", ą: "a", ś: "s",
  };
  return value
    .toLowerCase()
    .replace(/[æøåßșşțţăâîłżźćńęąś]/g, (ch) => map[ch] ?? ch)
    .normalize("NFD")
    // Combining marks left by NFD fall away with the alphanumeric filter below.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cvFileName(personal: Pick<CvPersonal, "firstName" | "lastName">, kind: "cv" | "cover_letter" | "combined"): string {
  const last = transliterate(personal.lastName).toUpperCase();
  const first = transliterate(personal.firstName).replace(/^./, (c) => c.toUpperCase());
  const suffix = kind === "cv" ? "CV" : kind === "cover_letter" ? "CoverLetter" : "CV-and-CoverLetter";
  return `${last}_${first}_${suffix}.pdf`;
}
