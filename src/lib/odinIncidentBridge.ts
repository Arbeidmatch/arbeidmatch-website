/**
 * Bridges production errors on arbeidmatch-website into the ATS's ODIN
 * self-healing intake (odin_incidents / odin_agents), so the VPS orchestrator
 * can pick them up the same way it does for ATS-side errors.
 *
 * This is a same-shape port of ats-recruitment's src/lib/odin/incident-intake.ts
 * (classify → dedupe → odin_incidents row → odin_agents row), scoped to this
 * repo's error surface. Cross-repo import isn't possible (separate deployments),
 * so the logic is duplicated intentionally — keep behavior in sync if either
 * side's classification/dedupe rules change.
 *
 * Security rules (mirrors incident-intake.ts — never relax without review):
 *   - No secrets, credentials, or raw stack traces in any stored row
 *   - No auto-deploy — the assigned agent diagnoses and proposes only
 */

import { createClient } from "@supabase/supabase-js";

export type WebsiteIncidentType = "email_error" | "database_error" | "unknown_error";
export type IncidentAgent = "VULCAN" | "IRIS" | "HERMES" | "SENTINEL";

export type WebsiteIncidentParams = {
  route: string;
  message: string;
  dedupeWindowMinutes?: number;
};

export type WebsiteIncidentResult = {
  incident_ref: string;
  assigned_agent: IncidentAgent;
  is_new: boolean;
  occurrence_count: number;
};

function getClient() {
  const url = process.env.ATS_SUPABASE_URL;
  const key = process.env.ATS_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function classify(route: string, message: string): WebsiteIncidentType {
  const r = route.toLowerCase();
  const m = message.toLowerCase();
  if (r.includes("smtp") || r.includes("email") || m.includes("smtp") || m.includes("mail")) return "email_error";
  if (m.includes("schema cache") || m.includes("relation") || m.includes("supabase") || m.includes("postgres") || m.includes("table"))
    return "database_error";
  return "unknown_error";
}

function routeToAgent(type: WebsiteIncidentType): IncidentAgent {
  if (type === "email_error") return "HERMES";
  return "IRIS";
}

function buildDedupeKey(route: string, message: string): string {
  const routeNorm = route.toLowerCase().replace(/[^a-z0-9/_-]/g, "_").slice(0, 80);
  const msgNorm = message.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 100);
  return `website:${routeNorm}:${msgNorm}`;
}

function generateIncidentRef(): string {
  const year = new Date().getFullYear();
  const hex = Math.random().toString(16).slice(2, 8).toUpperCase().padEnd(6, "0");
  return `INC-${year}-${hex}`;
}

function buildObjective(params: { incident_ref: string; route: string; message: string; assigned_agent: IncidentAgent }): string {
  return [
    `[INCIDENT ${params.incident_ref}] arbeidmatch-website production error — assigned to ${params.assigned_agent}`,
    "",
    `Source         : arbeidmatch-website${params.route}`,
    `Error (safe)   : ${params.message}`,
    "",
    "This error originates in the arbeidmatch-website repo (public marketing site), a separate",
    "deployment from the ats-recruitment app. Diagnosis and any fix must be made in that repo.",
    "",
    "Suggested First Diagnostic Steps:",
    "  1. Reproduce the route/handler in arbeidmatch-website/src/app" + params.route,
    "  2. Check for a missing DB table/column referenced by the handler (common cause: a",
    "     prepared supabase/*.sql script that was never applied — check supabase/ and",
    "     supabase/migrations/ in that repo for a matching, unapplied script)",
    "  3. Confirm which Supabase project the route actually targets (NEXT_PUBLIC_SUPABASE_URL",
    "     in arbeidmatch-website/.env.local) before applying any migration",
    "  4. Apply the missing schema change directly via Supabase migration tooling",
    "  5. Re-trigger the failing route and confirm the error no longer occurs",
    "",
    "Repair Policy (always enforced):",
    "  - Read-only diagnosis: allowed automatically",
    "  - Code patch on dev/branch: allowed automatically",
    "  - Production deploy: requires Mirel approval",
    "  - Production SQL / migrations: requires Mirel approval",
    "  - Do NOT log, store, or transmit secrets, tokens, or credentials",
    "",
    "IMPORTANT: Do NOT claim the error is fixed until you've verified the route no longer errors.",
  ].join("\n");
}

/**
 * Reports a production error into the ATS's odin_incidents/odin_agents tables.
 * Returns null (never throws) if credentials are missing or the write fails —
 * callers should treat that as "no ODIN visibility" and fall back to their
 * own notification path, not block on it.
 */
export async function reportWebsiteIncident(params: WebsiteIncidentParams): Promise<WebsiteIncidentResult | null> {
  const client = getClient();
  if (!client) return null;

  const dedupeWindowMinutes = params.dedupeWindowMinutes ?? 60;
  const message = params.message.slice(0, 1000);

  try {
    const incidentType = classify(params.route, message);
    const assignedAgent = routeToAgent(incidentType);
    const dedupeKey = buildDedupeKey(params.route, message);
    const windowStart = new Date(Date.now() - dedupeWindowMinutes * 60 * 1000).toISOString();

    const { data: existing } = await client
      .from("odin_incidents")
      .select("id, incident_ref, occurrence_count")
      .eq("dedupe_key", dedupeKey)
      .gte("last_occurred_at", windowStart)
      .not("status", "in", '("resolved","false_positive")')
      .order("last_occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date().toISOString();

    if (existing) {
      const newCount = (existing.occurrence_count ?? 1) + 1;
      await client
        .from("odin_incidents")
        .update({ occurrence_count: newCount, last_occurred_at: now })
        .eq("id", existing.id);
      return { incident_ref: existing.incident_ref, assigned_agent: assignedAgent, is_new: false, occurrence_count: newCount };
    }

    const incidentRef = generateIncidentRef();
    const { data: newIncident, error: incidentErr } = await client
      .from("odin_incidents")
      .insert({
        incident_ref: incidentRef,
        incident_type: incidentType,
        severity: "critical",
        source: `arbeidmatch-website${params.route}`,
        message,
        source_link: `https://arbeidmatch.no${params.route}`,
        affected_module: "arbeidmatch-website",
        dedupe_key: dedupeKey,
        dedupe_window_minutes: dedupeWindowMinutes,
        occurrence_count: 1,
        first_occurred_at: now,
        last_occurred_at: now,
        assigned_agent: assignedAgent,
        status: "open",
        verified_by_agent: false,
        diagnostic_steps: [],
        metadata: { created_by: "arbeidmatch-website/errorNotifier", route: params.route },
      })
      .select("id")
      .single();

    if (incidentErr || !newIncident) return null;

    const objective = buildObjective({ incident_ref: incidentRef, route: params.route, message, assigned_agent: assignedAgent });
    const { data: agentRow } = await client
      .from("odin_agents")
      .insert({
        objective,
        status: "planning",
        type: assignedAgent,
        metadata: {
          incident_id: newIncident.id,
          incident_ref: incidentRef,
          incident_type: incidentType,
          assigned_agent: assignedAgent,
          source: `arbeidmatch-website${params.route}`,
          affected_module: "arbeidmatch-website",
          created_by: "arbeidmatch-website/errorNotifier",
          spawned_at: now,
        },
      })
      .select("id")
      .single();

    if (agentRow) {
      await client.from("odin_incidents").update({ odin_agent_id: agentRow.id, status: "investigating" }).eq("id", newIncident.id);
    }

    return { incident_ref: incidentRef, assigned_agent: assignedAgent, is_new: true, occurrence_count: 1 };
  } catch {
    return null;
  }
}
