import { z } from "zod";

export const jobTypeSchema = z.enum(["Offshore", "Onshore", "Transport", "Automotive"]);
export const jobTypes = jobTypeSchema.options;

export const experienceBandSchema = z.enum(["0_2", "2_5", "5_10", "10_plus"]);
export const experienceBands = experienceBandSchema.options;

export const salaryHourlySchema = z.enum(["400_500", "500_600", "600_plus"]);
export const salaryHourlyOptions = salaryHourlySchema.options;

export const hoursPrefSchema = z.enum(["40", "48", "60_plus"]);
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
  phone: z.string().trim().min(6),
  currentCountry: z.string().trim().min(2),
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
