import { createHash } from "crypto";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

type PartnerSessionRow = {
  session_token: string;
  request_token: string | null;
  email: string | null;
  expires_at: string;
  used: boolean;
};

type RequestTokenRow = {
  token: string;
  email: string | null;
  company: string | null;
  expires_at: string;
  used: boolean | null;
};

export type PartnerAuthContext = {
  sessionToken: string;
  requestToken: string | null;
  email: string | null;
  company: string | null;
};

export type PartnerCandidateRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  job_type_pref: string | null;
  experience_years: number | null;
  english_level: string | null;
  has_permit: boolean | null;
  profile_score: number | null;
  certifications: unknown;
  experiences: unknown;
  available: boolean | null;
  deleted_at: string | null;
  gdpr_consent: boolean | null;
};

function normalize(input: string | null | undefined): string {
  return (input ?? "").trim().toLowerCase();
}

export function makeCandidateHash(sessionToken: string, candidateId: string): string {
  return createHash("sha256").update(`${sessionToken}:${candidateId}`).digest("hex");
}

export function initials(firstName: string | null, lastName: string | null): string {
  const a = normalize(firstName).charAt(0).toUpperCase();
  const b = normalize(lastName).charAt(0).toUpperCase();
  if (a && b) return `${a}${b}`;
  return a || b || "C";
}

function toEnglishBandScore(level: string | null): number {
  const v = normalize(level);
  if (!v) return 0;
  if (["c2", "c1", "b2", "advanced", "fluent"].some((k) => v.includes(k))) return 3;
  if (["b1", "intermediate"].some((k) => v.includes(k))) return 2;
  if (["a2", "a1", "basic"].some((k) => v.includes(k))) return 1;
  return 0;
}

function skillListFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && "jobTitle" in item && typeof (item as { jobTitle?: unknown }).jobTitle === "string") {
        return ((item as { jobTitle: string }).jobTitle || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

export function skillsPreview(candidate: PartnerCandidateRow): string[] {
  const fromCert = skillListFromUnknown(candidate.certifications);
  if (fromCert.length >= 3) return fromCert.slice(0, 3);
  const fromExperience = skillListFromUnknown(candidate.experiences);
  return [...fromCert, ...fromExperience].filter(Boolean).slice(0, 3);
}

export function computeCompatibilityScore(input: {
  candidate: PartnerCandidateRow;
  jobCategory: string;
  experienceMin: number;
  drivingLicenseRequired: boolean;
  languages: string[];
}): number {
  const categoryMatch = normalize(input.candidate.job_type_pref) === normalize(input.jobCategory);
  const experienceOk = Number(input.candidate.experience_years ?? 0) >= input.experienceMin;
  const englishBand = toEnglishBandScore(input.candidate.english_level);
  const needsEnglish = input.languages.map(normalize).some((lang) => ["en", "eng", "english"].includes(lang));
  const languageOk = !needsEnglish || englishBand >= 3;
  const drivingOk = !input.drivingLicenseRequired || input.candidate.has_permit === true;
  const profileScorePart = Math.min(15, Math.max(0, Number(input.candidate.profile_score ?? 0) / 10));

  let score = 0;
  if (categoryMatch) score += 40;
  if (experienceOk) score += 20;
  if (languageOk) score += 15;
  if (drivingOk) score += 10;
  score += profileScorePart;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function validatePartnerSessionOrToken(rawToken: string): Promise<PartnerAuthContext | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;
  const token = rawToken.trim();
  if (!token) return null;
  const nowIso = new Date().toISOString();

  const partnerSessionRes = await supabase
    .from("partner_sessions")
    .select("session_token,request_token,email,expires_at,used")
    .eq("session_token", token)
    .maybeSingle();
  const partnerSession = partnerSessionRes.data as PartnerSessionRow | null;
  if (!partnerSessionRes.error && partnerSession && !partnerSession.used && partnerSession.expires_at > nowIso) {
    let company: string | null = null;
    if (partnerSession.request_token) {
      const reqRes = await supabase.from("request_tokens").select("company").eq("token", partnerSession.request_token).maybeSingle();
      company = (reqRes.data as { company?: string } | null)?.company ?? null;
    }
    return {
      sessionToken: partnerSession.session_token,
      requestToken: partnerSession.request_token,
      email: partnerSession.email,
      company,
    };
  }

  const requestTokenRes = await supabase
    .from("request_tokens")
    .select("token,email,company,expires_at,used")
    .eq("token", token)
    .maybeSingle();
  const requestToken = requestTokenRes.data as RequestTokenRow | null;
  if (!requestTokenRes.error && requestToken && (requestToken.used ?? false) === false && requestToken.expires_at > nowIso) {
    return {
      sessionToken: requestToken.token,
      requestToken: requestToken.token,
      email: requestToken.email,
      company: requestToken.company,
    };
  }

  return null;
}
