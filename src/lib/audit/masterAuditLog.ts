import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { logApiError } from "@/lib/secureLogger";

export type AuditActor = "system" | "employer" | "candidate" | "admin";

export type AuditEntityType = "job" | "candidate" | "application" | "employer" | "payment" | "email" | "branding" | "other";

export async function insertAuditLog(input: {
  eventType: string;
  entityType: AuditEntityType;
  entityId?: string | null;
  actor: AuditActor;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const { error } = await supabase.from("master_audit_log").insert({
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    actor: input.actor,
    metadata: input.metadata ?? {},
  });

  if (error) {
    logApiError("insertAuditLog", error, { eventType: input.eventType });
  }
}
