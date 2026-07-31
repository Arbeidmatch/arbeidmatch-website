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

/** Norwegian trades certificates, English first with the Norwegian term in brackets. */
export const CERTIFICATION_SUGGESTIONS = [
  "HSE card (HMS-kort)",
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
    .array(z.string().trim().min(1).max(220, "Keep each bullet under 220 characters"))
    .min(2, "Add at least 2 bullets")
    .max(6, "Use at most 6 bullets"),
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
    .array(z.string().trim().min(1).max(60))
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
