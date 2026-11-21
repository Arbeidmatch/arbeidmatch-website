/**
 * Bridges production errors on arbeidmatch-website into the ATS's ODIN
 * self-healing intake and the owner's bell.
 *
 * Since ORDER 415 (21 November 2026) the site holds no ATS database key: the
 * error goes to the ATS's /api/public/website-relay, which files it through the
 * ATS's own incident intake (the same classify and dedupe rules every ATS error
 * takes, with no agent spawned for a source in this repository) and rings the
 * bell under Support once per new incident (his rule, 13 October 2026).
 *
 * Security rules (never relax without review):
 *   - No secrets, credentials, or raw stack traces in the message
 *   - No auto-deploy: whoever takes the incident diagnoses and proposes only
 */

import { atsRelay } from "@/lib/atsRelay";

export type IncidentAgent = "VULCAN" | "IRIS" | "HERMES" | "ARGUS" | "SENTINEL";

export type WebsiteIncidentParams = {
  route: string;
  message: string;
};

export type WebsiteIncidentResult = {
  incident_ref: string;
  assigned_agent: IncidentAgent;
  is_new: boolean;
  /** True when the ATS put the notice in the owner's bell. */
  belled: boolean;
};

/**
 * Reports a production error to the ATS. Returns null (never throws) when the
 * ATS cannot be reached or filed nothing: callers treat that as "no ODIN
 * visibility" and fall back to their own notification path.
 */
export async function reportWebsiteIncident(params: WebsiteIncidentParams): Promise<WebsiteIncidentResult | null> {
  const answer = await atsRelay<{
    incident?: { incident_ref?: unknown; assigned_agent?: unknown; is_new?: unknown } | null;
    belled?: unknown;
  }>("incident", { route: params.route, message: params.message.slice(0, 1000) });
  const incident = answer?.incident;
  if (!incident || typeof incident.incident_ref !== "string") return null;
  return {
    incident_ref: incident.incident_ref,
    assigned_agent: (typeof incident.assigned_agent === "string" ? incident.assigned_agent : "IRIS") as IncidentAgent,
    is_new: incident.is_new === true,
    belled: answer?.belled === true,
  };
}
