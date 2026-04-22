import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { logApiError } from "@/lib/secureLogger";

export type AuditActor = "system" | "employer" | "candidate" | "admin";

/** Stored as text; prefer lowercase snake_case labels. */
export type AuditEntityType =
  | "job"
  | "candidate"
  | "application"
  | "employer"
  | "employer_request"
  | "partner"
  | "request_token"
  | "payment"
  | "email"
  | "branding"
  | "other";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeUuid(entity_id: string | null | undefined): { id: string | null; extraMeta: Record<string, unknown> } {
  if (entity_id == null || entity_id === "") return { id: null, extraMeta: {} };
  const t = String(entity_id).trim();
  if (UUID_RE.test(t)) return { id: t, extraMeta: {} };
  return { id: null, extraMeta: { entity_ref: t } };
}

/**
 * Append one row to master_audit_log (non-throwing).
 * Non-UUID entity ids use null entity_id and `entity_ref` in metadata.
 */
export async function logAuditEvent(
  event_type: string,
  entity_type: string,
  entity_id: string | null | undefined,
  actor: AuditActor,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const { id, extraMeta } = normalizeUuid(entity_id);
  const meta = { ...(metadata ?? {}), ...extraMeta };

  const { error } = await supabase.from("master_audit_log").insert({
    event_type,
    entity_type,
    entity_id: id,
    actor,
    metadata: meta,
  });

  if (error) {
    logApiError("logAuditEvent", error, { event_type });
  }
}

/** Outbound transactional email (template name in metadata). */
export function logEmailSent(template: string, metadata?: Record<string, unknown>): void {
  void logAuditEvent("email_sent", "email", null, "system", { template, ...(metadata ?? {}) });
}

export type InsertAuditLogInput = {
  eventType: string;
  entityType: AuditEntityType | string;
  entityId?: string | null;
  actor: AuditActor;
  metadata?: Record<string, unknown>;
};

/** Camel-case alias for logAuditEvent (legacy call sites). */
export async function insertAuditLog(input: InsertAuditLogInput): Promise<void> {
  return logAuditEvent(input.eventType, input.entityType, input.entityId ?? null, input.actor, input.metadata);
}
