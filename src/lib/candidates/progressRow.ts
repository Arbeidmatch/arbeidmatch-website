import type { JobPreferencesPayload, WorkExperiencePayload } from "@/lib/candidates/profileSchema";
import {
  experienceBands,
  hoursPrefs,
  housingPrefs,
  resolveWorkTypeFromCategoryString,
  rotationPrefs,
  salaryHourlyOptions,
  travelPrefs,
} from "@/lib/candidates/profileSchema";

function s(d: Record<string, unknown>, key: string, fallback: string): string {
  const v = d[key];
  return typeof v === "string" ? v : fallback;
}

function jobPrefsFromDraft(d: Record<string, unknown>): JobPreferencesPayload {
  const rawJobType = typeof d.jobType === "string" ? d.jobType.trim() : "";
  const jobType = rawJobType
    ? (resolveWorkTypeFromCategoryString(rawJobType) ?? "Construction & Civil")
    : "Construction & Civil";
  const experienceBand = experienceBands.includes(d.experienceBand as JobPreferencesPayload["experienceBand"])
    ? (d.experienceBand as JobPreferencesPayload["experienceBand"])
    : "2_5";
  const rawSalary = d.salaryHourly;
  const salaryMapped =
    typeof rawSalary === "string" && rawSalary.trim() === "400_500"
      ? "400_450"
      : typeof rawSalary === "string" && rawSalary.trim() === "500_600"
        ? "500_550"
        : rawSalary;
  const salaryHourly = salaryHourlyOptions.includes(salaryMapped as JobPreferencesPayload["salaryHourly"])
    ? (salaryMapped as JobPreferencesPayload["salaryHourly"])
    : "400_450";
  const rawHours = d.hoursPerWeek;
  const hoursCoerced =
    rawHours === 37.5 || rawHours === "37,5"
      ? "37.5"
      : rawHours === 48
        ? "48"
        : typeof rawHours === "string" && (rawHours.trim() === "54+" || rawHours.trim() === "54 +")
          ? "54_plus"
          : rawHours;
  const hoursPerWeek = hoursPrefs.includes(hoursCoerced as JobPreferencesPayload["hoursPerWeek"])
    ? (hoursCoerced as JobPreferencesPayload["hoursPerWeek"])
    : "37.5";
  const rawRot = d.rotation;
  const rotationMapped =
    typeof rawRot === "string" && rawRot.trim() === "4_weeks_on_2_weeks_off"
      ? "4on_2off"
      : typeof rawRot === "string" && rawRot.trim() === "6_weeks_on_2_weeks_off"
        ? "6on_2off"
        : typeof rawRot === "string" && (rawRot.trim() === "1_2" || rawRot.trim() === "2_4" || rawRot.trim() === "flexible")
          ? "4on_2off"
          : rawRot;
  const rotation = rotationPrefs.includes(rotationMapped as JobPreferencesPayload["rotation"])
    ? (rotationMapped as JobPreferencesPayload["rotation"])
    : "4on_2off";
  const housing = housingPrefs.includes(d.housing as JobPreferencesPayload["housing"])
    ? (d.housing as JobPreferencesPayload["housing"])
    : "no_preference";
  const travel = travelPrefs.includes(d.travel as JobPreferencesPayload["travel"])
    ? (d.travel as JobPreferencesPayload["travel"])
    : "personal";
  return {
    jobType,
    experienceBand,
    salaryHourly,
    hoursPerWeek,
    rotation,
    hasPermit: Boolean(d.hasPermit),
    permitCategories: typeof d.permitCategories === "string" ? d.permitCategories : undefined,
    housing,
    travel,
  };
}

function experiencesFromDraft(d: Record<string, unknown>): WorkExperiencePayload[] {
  if (!Array.isArray(d.experiences)) return [];
  return d.experiences.filter((x): x is WorkExperiencePayload => x !== null && typeof x === "object");
}

/** Maps wizard draft JSON into a candidates row for upsert (incomplete profile). */
export function draftToIncompleteCandidateRow(emailKey: string, lastCompletedStep: number, draft: Record<string, unknown>) {
  const videoUrl = s(draft, "videoUrl", "").trim();
  const exps = experiencesFromDraft(draft);
  const prefs = jobPrefsFromDraft(draft);

  return {
    email: emailKey,
    first_name: s(draft, "firstName", "Friend").trim() || "Friend",
    last_name: s(draft, "lastName", "Candidate").trim() || "Candidate",
    phone: s(draft, "phone", "0000000").trim() || "0000000",
    current_country: s(draft, "currentCountry", "Norway").trim() || "Norway",
    city: s(draft, "city", "-").trim() || "-",
    gdpr_entry_accepted: Boolean(draft.gdprEntryAccepted),
    privacy_policy_version: "2026-04-22",
    video_link: videoUrl || null,
    experiences: exps.length ? exps : [],
    job_preferences: prefs,
    experience_years: null as number | null,
    salary_min: null as number | null,
    hours_pref: prefs.hoursPerWeek,
    rotation_pref: prefs.rotation,
    housing_pref: prefs.housing,
    travel_pref: prefs.travel,
    job_type_pref: prefs.jobType,
    has_permit: prefs.hasPermit,
    permit_categories: prefs.permitCategories ?? null,
    share_with_employers: false,
    can_apply: false,
    profile_completed_at: null as string | null,
    profile_completion_step: lastCompletedStep,
    profile_draft: draft,
    updated_at: new Date().toISOString(),
  };
}
