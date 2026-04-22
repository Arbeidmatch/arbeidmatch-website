import {
  salaryHourlyHumanLabels,
  type CandidateProfilePayload,
  type JobPreferencesPayload,
  type WorkExperiencePayload,
} from "@/lib/candidates/profileSchema";

function experienceBandApproxYears(band: JobPreferencesPayload["experienceBand"]): number {
  switch (band) {
    case "0_2":
      return 1;
    case "2_5":
      return 3;
    case "5_10":
      return 7;
    case "10_plus":
      return 12;
    default:
      return 3;
  }
}

function experienceBandLabel(band: JobPreferencesPayload["experienceBand"]): string {
  switch (band) {
    case "0_2":
      return "0 to 2 years";
    case "2_5":
      return "2 to 5 years";
    case "5_10":
      return "5 to 10 years";
    case "10_plus":
      return "10+ years";
    default:
      return "experience band";
  }
}

export function buildSyntheticExperiences(prefs: JobPreferencesPayload, residenceCountry: string): WorkExperiencePayload[] {
  const y = new Date().getFullYear();
  const start = y - experienceBandApproxYears(prefs.experienceBand);
  const bandText = experienceBandLabel(prefs.experienceBand);
  const licenseLine = prefs.hasPermit
    ? `Driving licence: yes${prefs.permitCategories?.trim() ? ` (${prefs.permitCategories.trim()})` : ""}.`
    : "Driving licence: no.";
  return [
    {
      companyName: "Various employers",
      country: residenceCountry.trim() || "Norway",
      orgNumber: "",
      jobTitle: `${prefs.jobType} specialist`,
      fromMonth: "Jan",
      fromYear: String(start),
      toMonth: "Dec",
      toYear: String(y),
      responsibilities: `${prefs.jobType} work across relevant projects. Declared experience band: ${bandText}. Expected hourly band: ${salaryHourlyHumanLabels[prefs.salaryHourly]}. Weekly hours ${prefs.hoursPerWeek}, rotation ${prefs.rotation}. Housing preference ${prefs.housing}. ${licenseLine}`,
    },
  ];
}

export function buildJobPreferences(params: {
  jobType: JobPreferencesPayload["jobType"];
  experienceBand: JobPreferencesPayload["experienceBand"];
  salaryHourly: JobPreferencesPayload["salaryHourly"];
  hoursPerWeek: JobPreferencesPayload["hoursPerWeek"];
  rotation: JobPreferencesPayload["rotation"];
  hasPermit: boolean;
  permitCategories?: string;
  housing: JobPreferencesPayload["housing"];
}): JobPreferencesPayload {
  return {
    jobType: params.jobType,
    experienceBand: params.experienceBand,
    salaryHourly: params.salaryHourly,
    hoursPerWeek: params.hoursPerWeek,
    rotation: params.rotation,
    hasPermit: params.hasPermit,
    permitCategories: params.permitCategories?.trim() || undefined,
    housing: params.housing,
    travel: "personal",
  };
}

export function buildCandidateProfilePayload(input: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  currentCountry: string;
  city: string;
  preferences: JobPreferencesPayload;
  videoUrl: string;
  shareWithEmployers: boolean;
}): CandidateProfilePayload {
  return {
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone.trim(),
    currentCountry: input.currentCountry.trim(),
    city: input.city.trim(),
    gdprEntryAccepted: true,
    privacyPolicyVersion: "2026-04-22",
    videoUrl: input.videoUrl.trim(),
    experiences: buildSyntheticExperiences(input.preferences, input.currentCountry),
    preferences: input.preferences,
    shareWithEmployers: input.shareWithEmployers,
  };
}
