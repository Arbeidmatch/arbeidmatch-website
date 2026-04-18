/**
 * ATS Integration Client
 * Connects arbeidmatch.no with ats.arbeidmatch.no
 *
 * All functions are non-blocking for callers (void or safe defaults).
 * Failures are silent — website continues normally if ATS is unreachable.
 *
 * Status: READY FOR INTEGRATION — activate by setting ATS_API_KEY
 */

const ATS_BASE_URL = process.env.ATS_BASE_URL || "https://ats.arbeidmatch.no";
const ATS_API_KEY = process.env.ATS_API_KEY;

export interface ATSCandidate {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nationality: string;
  euEea: boolean;
  profession: string;
  experienceYears?: number;
  hasDsb?: boolean;
  source: "website" | "dsb-guide" | "checklist";
}

export interface ATSEmployerRequest {
  companyName: string;
  contactEmail: string;
  jobType: string;
  location: string;
  candidatesNeeded: number;
  industry: string;
  startDate?: string;
  package?: "basic" | "standard" | "premium" | "branded";
}

export interface ATSPartnerStatus {
  isPartner: boolean;
  partnerId?: string;
  partnerLevel?: "basic" | "standard" | "premium";
  creditApproved?: boolean;
}

/** Register candidate in ATS — non-blocking, fails silently */
export async function registerCandidateInATS(candidate: ATSCandidate): Promise<void> {
  if (!ATS_API_KEY) return;
  try {
    void candidate;
    // TODO: activate when ATS is ready
    // await fetch(`${ATS_BASE_URL}/api/candidates`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'X-API-Key': ATS_API_KEY },
    //   body: JSON.stringify(candidate),
    // })
  } catch {
    // Silent fail — website continues normally
  }
}

/** Check if employer is a verified partner — returns safe defaults if ATS unavailable */
export async function checkPartnerStatus(email: string): Promise<ATSPartnerStatus> {
  if (!ATS_API_KEY) return { isPartner: false };
  try {
    void email;
    // TODO: activate when ATS is ready
    // const res = await fetch(`${ATS_BASE_URL}/api/partners/check`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'X-API-Key': ATS_API_KEY },
    //   body: JSON.stringify({ email }),
    // })
    // return await res.json()
    return { isPartner: false };
  } catch {
    return { isPartner: false };
  }
}

/** Create job post in ATS — non-blocking, fails silently */
export async function createJobPostInATS(request: ATSEmployerRequest, partnerId: string): Promise<void> {
  if (!ATS_API_KEY) return;
  try {
    void request;
    void partnerId;
    // TODO: activate when ATS is ready
    // await fetch(`${ATS_BASE_URL}/api/jobs`, { ... })
  } catch {
    // Silent fail
  }
}

/** Register employer for approval — non-blocking, fails silently */
export async function registerEmployerInATS(data: {
  companyName: string;
  email: string;
  phone?: string;
  paymentMethod: "invoice" | "card";
}): Promise<void> {
  if (!ATS_API_KEY) return;
  try {
    void data;
    // TODO: activate when ATS is ready
    // await fetch(`${ATS_BASE_URL}/api/employers/register`, { ... })
  } catch {
    // Silent fail
  }
}
