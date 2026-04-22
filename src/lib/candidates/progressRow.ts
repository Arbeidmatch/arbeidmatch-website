import type { JobPreferencesPayload, WorkExperiencePayload } from "@/lib/candidates/profileSchema";
import {
  experienceBands,
  hoursPrefs,
  housingPrefs,
  jobTypes,
  rotationPrefs,
  salaryHourlyOptions,
  travelPrefs,
} from "@/lib/candidates/profileSchema";

function s(d: Record<string, unknown>, key: string, fallback: string): string {
  const v = d[key];
  return typeof v === "string" ? v : fallback;
}

function jobPrefsFromDraft(d: Record<string, unknown>): JobPreferencesPayload {
  const jobType = jobTypes.includes(d.jobType as JobPreferencesPayload["jobType"])
    ? (d.jobType as JobPreferencesPayload["jobType"])
    : "Onshore";
  const experienceBand = experienceBands.includes(d.experienceBand as JobPreferencesPayload["experienceBand"])
    ? (d.experienceBand as JobPreferencesPayload["experienceBand"])
    : "2_5";
  const salaryHourly = salaryHourlyOptions.includes(d.salaryHourly as JobPreferencesPayload["salaryHourly"])
    ? (d.salaryHourly as JobPreferencesPayload["salaryHourly"])
    : "500_600";
  const hoursPerWeek = hoursPrefs.includes(d.hoursPerWeek as JobPreferencesPayload["hoursPerWeek"])
    ? (d.hoursPerWeek as JobPreferencesPayload["hoursPerWeek"])
    : "40";
  const rotation = rotationPrefs.includes(d.rotation as JobPreferencesPayload["rotation"])
    ? (d.rotation as JobPreferencesPayload["rotation"])
    : "flexible";
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
