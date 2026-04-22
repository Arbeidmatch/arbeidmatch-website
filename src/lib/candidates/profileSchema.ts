import { z } from "zod";

import { isEeaCandidatePhone, isEeaResidenceCountryName } from "@/lib/candidates/euEeaCandidateGeo";

/** Same sector labels as employer `/request` flow — used for candidate prefs and employer job matching. */
export const EMPLOYER_JOB_WORK_TYPES = [
  "Construction & Civil",
  "Electrical & Technical",
  "Logistics & Transport",
  "Industry & Production",
  "Cleaning & Facility",
  "Hospitality & Healthcare",
] as const;

export type EmployerJobWorkType = (typeof EMPLOYER_JOB_WORK_TYPES)[number];

export const jobTypeSchema = z.enum(EMPLOYER_JOB_WORK_TYPES);
export const jobTypes = jobTypeSchema.options;

const LEGACY_FOUR_JOB_TYPES: Record<string, EmployerJobWorkType> = {
  offshore: "Industry & Production",
  onshore: "Construction & Civil",
  transport: "Logistics & Transport",
  automotive: "Electrical & Technical",
};

/** Normalized keys (trim + lower) → canonical work type. Covers `/request` token industry strings and variants. */
const JOB_CATEGORY_ALIAS_TO_WORK_TYPE: Record<string, EmployerJobWorkType> = {
  ...LEGACY_FOUR_JOB_TYPES,
  "construction & civil": "Construction & Civil",
  "electrical & technical": "Electrical & Technical",
  "logistics & transport": "Logistics & Transport",
  "industry & production": "Industry & Production",
  "cleaning & facility": "Cleaning & Facility",
  "hospitality & healthcare": "Hospitality & Healthcare",
  electrical: "Electrical & Technical",
  "plumbing and hvac (vvs)": "Electrical & Technical",
  "plumbing and hvac": "Electrical & Technical",
  construction: "Construction & Civil",
  "welding and metal": "Industry & Production",
  logistics: "Logistics & Transport",
  "industry and production": "Industry & Production",
  cleaning: "Cleaning & Facility",
  horeca: "Hospitality & Healthcare",
  healthcare: "Hospitality & Healthcare",
};

/**
 * Map stored job category / legacy job-type strings to a canonical work type, or null if unknown.
 * Used for employer_jobs.category, mapped_job_type, candidate drafts, and Recman-style categories.
 */
export function resolveWorkTypeFromCategoryString(raw: string): EmployerJobWorkType | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  for (const canon of EMPLOYER_JOB_WORK_TYPES) {
    if (canon.toLowerCase() === lower) return canon;
  }
  const alias = JOB_CATEGORY_ALIAS_TO_WORK_TYPE[lower];
  if (alias) return alias;

  // Heuristic fallbacks for free-text categories (job boards, imports)
  if (/(^|[^a-z])(construction|civil|bygg|anlegg)([^a-z]|$)/i.test(trimmed)) return "Construction & Civil";
  if (/(electric|elektro|automotive|vehicle|mechanic|tekniker|vvs|plumb|hvac|welder|welding|pipefitter)/i.test(trimmed)) {
    return "Electrical & Technical";
  }
  if (/(logistics|transport|truck|driver|warehouse|forklift|crane|lager|sjåfør)/i.test(trimmed)) return "Logistics & Transport";
  if (/(cleaning|facility|renhold|janitor|vaktmester|industrial cleaner)/i.test(trimmed)) return "Cleaning & Facility";
  if (
    /(?:^|[^a-z])(?:industry|production|offshore|manufactur|fabrikk|process)(?:[^a-z]|$)/i.test(trimmed) ||
    /steel worker|cnc/i.test(trimmed)
  ) {
    return "Industry & Production";
  }
  if (/(hospitality|healthcare|horeca|hotel|kitchen|chef|care|sykepleie|kokk)/i.test(trimmed)) return "Hospitality & Healthcare";

  return null;
}

function normalizeJobTypeInput(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const resolved = resolveWorkTypeFromCategoryString(value);
  return resolved ?? value;
}

export const experienceBandSchema = z.enum(["0_2", "2_5", "5_10", "10_plus"]);
export const experienceBands = experienceBandSchema.options;

const salaryHourlyEnum = z.enum([
  "200_250",
  "250_300",
  "300_350",
  "350_400",
  "400_450",
  "450_500",
  "500_550",
  "550_600",
  "600_plus",
]);

/** Accept legacy / alternate keys from drafts and normalize to canonical bands. */
function normalizeSalaryHourlyInput(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const v = value.trim();
  if (v === "400_500") return "400_450";
  if (v === "500_600") return "500_550";
  return v;
}

export const salaryHourlySchema = z.preprocess(normalizeSalaryHourlyInput, salaryHourlyEnum);
export const salaryHourlyOptions = salaryHourlyEnum.options;

export type SalaryHourlyBand = z.infer<typeof salaryHourlyEnum>;

/** Human-readable labels for UI (wizard, summaries). */
export const salaryHourlyHumanLabels = {
  "200_250": "200 to 250 NOK per hour",
  "250_300": "250 to 300 NOK per hour",
  "300_350": "300 to 350 NOK per hour",
  "350_400": "350 to 400 NOK per hour",
  "400_450": "400 to 450 NOK per hour",
  "450_500": "450 to 500 NOK per hour",
  "500_550": "500 to 550 NOK per hour",
  "550_600": "550 to 600 NOK per hour",
  "600_plus": "600+ NOK per hour",
} as const satisfies Record<SalaryHourlyBand, string>;

/** Midpoint NOK/hour for matching and derived annual hints. */
export const salaryHourlyBandMidNok = {
  "200_250": 225,
  "250_300": 275,
  "300_350": 325,
  "350_400": 375,
  "400_450": 425,
  "450_500": 475,
  "500_550": 525,
  "550_600": 575,
  "600_plus": 650,
} as const satisfies Record<SalaryHourlyBand, number>;

/** Pre–50 NOK increment bands (stored snapshots / drafts). */
const LEGACY_SALARY_MID_NOK: Record<string, number> = {
  "400_500": 450,
  "500_600": 550,
};

export function resolveSalaryHourlyMidNok(band: string): number {
  if (Object.prototype.hasOwnProperty.call(salaryHourlyBandMidNok, band)) {
    return salaryHourlyBandMidNok[band as SalaryHourlyBand];
  }
  return LEGACY_SALARY_MID_NOK[band] ?? 425;
}

/** Employer-facing line e.g. "NOK 400 to 450 per hour (preference band)". */
export function salaryHourlyEmployerBandLabel(band: SalaryHourlyBand): string {
  const h = salaryHourlyHumanLabels[band];
  const range = h.match(/^(\d+) to (\d+) NOK per hour$/);
  if (range) return `NOK ${range[1]} to ${range[2]} per hour (preference band)`;
  const plus = h.match(/^(\d+)\+ NOK per hour$/);
  if (plus) return `NOK ${plus[1]}+ per hour (preference band)`;
  return `${h} (preference band)`;
}

const LEGACY_SALARY_EMPLOYER_LABEL: Record<string, string> = {
  "400_500": "NOK 400 to 500 per hour (preference band)",
  "500_600": "NOK 500 to 600 per hour (preference band)",
};

/** Safe for JSON snapshots that may predate current band keys. */
export function salaryHourlyEmployerBandLabelResolved(band: string): string {
  if (Object.prototype.hasOwnProperty.call(salaryHourlyHumanLabels, band)) {
    return salaryHourlyEmployerBandLabel(band as SalaryHourlyBand);
  }
  return LEGACY_SALARY_EMPLOYER_LABEL[band] ?? "Not specified";
}

const hoursPrefEnum = z.enum(["37.5", "48", "54_plus"]);

/** JSON may send 37.5 as a number; drafts may use alternate spellings. */
function normalizeHoursPrefInput(value: unknown): unknown {
  if (value === 37.5 || value === "37,5") return "37.5";
  if (value === 48) return "48";
  if (typeof value === "string") {
    const t = value.trim();
    if (t === "37,5") return "37.5";
    if (t === "54+" || t === "54 +") return "54_plus";
  }
  return value;
}

/** Norwegian working-time context: 37.5 h normal week, 48 h overtime cap, 54+ h exceptional. */
export const hoursPrefSchema = z.preprocess(normalizeHoursPrefInput, hoursPrefEnum);
export const hoursPrefs = hoursPrefEnum.options;

const rotationPrefEnum = z.enum(["4on_2off", "6on_2off"]);

/** Long-form keys and legacy wizard values map onto canonical rotation prefs. */
function normalizeRotationPrefInput(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const v = value.trim();
  if (v === "4_weeks_on_2_weeks_off") return "4on_2off";
  if (v === "6_weeks_on_2_weeks_off") return "6on_2off";
  if (v === "1_2" || v === "2_4" || v === "flexible") return "4on_2off";
  return v;
}

export const rotationPrefSchema = z.preprocess(normalizeRotationPrefInput, rotationPrefEnum);
export const rotationPrefs = rotationPrefEnum.options;

export type RotationPref = z.infer<typeof rotationPrefEnum>;

export const rotationHumanLabels = {
  "4on_2off": "4 weeks on, 2 weeks off",
  "6on_2off": "6 weeks on, 2 weeks off",
} as const satisfies Record<RotationPref, string>;

const LEGACY_ROTATION_LABELS: Record<string, string> = {
  "1_2": "1 to 2 weeks",
  "2_4": "2 to 4 weeks",
  flexible: "Flexible",
};

/** Human label for UI and employer views; supports legacy snapshot keys. */
export function rotationPrefLabelResolved(rot: string): string {
  if (Object.prototype.hasOwnProperty.call(rotationHumanLabels, rot)) {
    return rotationHumanLabels[rot as RotationPref];
  }
  return LEGACY_ROTATION_LABELS[rot] ?? rot;
}

/** For matching: true when the candidate chose a fixed cycle (current or legacy), not “flexible”. */
export function prefersConcreteRotationCycle(rot: string): boolean {
  if (rot === "flexible") return false;
  return (
    rot === "4on_2off" ||
    rot === "6on_2off" ||
    rot === "1_2" ||
    rot === "2_4"
  );
}

export const housingPrefSchema = z.enum(["company", "self", "no_preference"]);
export const housingPrefs = housingPrefSchema.options;

export const travelPrefSchema = z.enum(["company", "personal"]);
export const travelPrefs = travelPrefSchema.options;

/** Pasted intro links often omit https://; Zod .url() requires an absolute URL. */
export function normalizeCandidateVideoUrlInput(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const t = value.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  const candidate = `https://${t}`;
  try {
    const host = new URL(candidate).hostname.toLowerCase();
    if (
      host.includes("youtube.com") ||
      host.includes("youtu.be") ||
      host.includes("vimeo.com") ||
      host.includes("loom.com") ||
      host.endsWith("tiktok.com")
    ) {
      return candidate;
    }
  } catch {
    return t;
  }
  return t;
}

export const workExperienceSchema = z.object({
  companyName: z.string().trim().min(2),
  country: z.string().trim().min(2),
  orgNumber: z.preprocess((v) => {
    if (v === null || v === undefined || v === "") return undefined;
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t.length ? t : undefined;
  }, z.string().min(1).optional()),
  jobTitle: z.string().trim().min(2),
  fromMonth: z.string().trim().min(1),
  fromYear: z.string().trim().min(4),
  toMonth: z.string().trim().min(1),
  toYear: z.string().trim().min(4),
  responsibilities: z.string().trim().min(10),
});

export const jobPreferencesSchema = z.object({
  jobType: z.preprocess(normalizeJobTypeInput, jobTypeSchema),
  experienceBand: experienceBandSchema,
  salaryHourly: salaryHourlySchema,
  hoursPerWeek: hoursPrefSchema,
  rotation: rotationPrefSchema,
  hasPermit: z.boolean(),
  permitCategories: z.string().trim().optional(),
  housing: housingPrefSchema,
  travel: travelPrefSchema,
});

export const candidateProfilePayloadSchema = z.object({
  email: z.string().trim().email(),
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  phone: z
    .string()
    .trim()
    .refine((v) => v.replace(/[\s-]/g, "").length >= 8, { message: "Phone is too short." })
    .refine(isEeaCandidatePhone, { message: "Phone must use an EU/EEA country code." }),
  currentCountry: z
    .string()
    .trim()
    .refine(isEeaResidenceCountryName, { message: "Country of residence must be in the EU or EEA." }),
  city: z.string().trim().min(2),
  gdprEntryAccepted: z.literal(true),
  privacyPolicyVersion: z.string().trim().min(1).optional(),
  videoUrl: z.preprocess(normalizeCandidateVideoUrlInput, z.string().trim().url()),
  experiences: z.array(workExperienceSchema).min(1).max(6),
  preferences: jobPreferencesSchema,
  shareWithEmployers: z.boolean(),
});

export type CandidateProfilePayload = z.infer<typeof candidateProfilePayloadSchema>;
export type WorkExperiencePayload = z.infer<typeof workExperienceSchema>;
export type JobPreferencesPayload = z.infer<typeof jobPreferencesSchema>;
