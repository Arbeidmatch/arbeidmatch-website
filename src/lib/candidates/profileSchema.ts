import { z } from "zod";

import { isEeaCandidatePhone, isEeaResidenceCountryName } from "@/lib/candidates/euEeaCandidateGeo";

export const jobTypeSchema = z.enum(["Offshore", "Onshore", "Transport", "Automotive"]);
export const jobTypes = jobTypeSchema.options;

export const experienceBandSchema = z.enum(["0_2", "2_5", "5_10", "10_plus"]);
export const experienceBands = experienceBandSchema.options;

export const salaryHourlySchema = z.enum([
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
export const salaryHourlyOptions = salaryHourlySchema.options;

export type SalaryHourlyBand = z.infer<typeof salaryHourlySchema>;

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

export const hoursPrefSchema = z.enum(["37.5", "48", "54_plus"]);
export const hoursPrefs = hoursPrefSchema.options;

export const rotationPrefSchema = z.enum(["1_2", "2_4", "flexible"]);
export const rotationPrefs = rotationPrefSchema.options;

export const housingPrefSchema = z.enum(["company", "self", "no_preference"]);
export const housingPrefs = housingPrefSchema.options;

export const travelPrefSchema = z.enum(["company", "personal"]);
export const travelPrefs = travelPrefSchema.options;

export const workExperienceSchema = z.object({
  companyName: z.string().trim().min(2),
  country: z.string().trim().min(2),
  orgNumber: z.string().trim().optional(),
  jobTitle: z.string().trim().min(2),
  fromMonth: z.string().trim().min(1),
  fromYear: z.string().trim().min(4),
  toMonth: z.string().trim().min(1),
  toYear: z.string().trim().min(4),
  responsibilities: z.string().trim().min(10),
});

export const jobPreferencesSchema = z.object({
  jobType: jobTypeSchema,
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
  videoUrl: z.string().trim().url(),
  experiences: z.array(workExperienceSchema).min(1).max(6),
  preferences: jobPreferencesSchema,
  shareWithEmployers: z.boolean(),
});

export type CandidateProfilePayload = z.infer<typeof candidateProfilePayloadSchema>;
export type WorkExperiencePayload = z.infer<typeof workExperienceSchema>;
export type JobPreferencesPayload = z.infer<typeof jobPreferencesSchema>;
