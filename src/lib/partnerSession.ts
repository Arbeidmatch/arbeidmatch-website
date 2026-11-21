import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Once a partner has opened the candidate list, the link works this much longer, never more. */
export const PARTNER_SESSION_WORKING_MS = 2 * 60 * 60 * 1000;

export type PartnerSession = { id: string; email: string; domain: string };

/**
 * The partner a candidate-page session token belongs to (ORDER 415, 21 November 2026).
 *
 * The token is the link mailed to one approved partner. It used to open the list for
 * anybody holding it, for its whole day, as often as they liked. Now it is bound to the
 * partner it was made for (their address, from the row, never from the browser), and the
 * first use shortens it to a working window, so a forwarded or leaked link stops soon.
 */
export async function partnerSessionFor(token: string, opts: { startWindow?: boolean } = {}): Promise<PartnerSession | null> {
  if (!UUID.test(token)) return null;
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const now = Date.now();
  const { data, error } = await supabase
    .from("partner_sessions")
    .select("id, email, expires_at")
    .eq("session_token", token)
    .eq("used", false)
    .gt("expires_at", new Date(now).toISOString())
    .maybeSingle();
  if (error || !data) return null;

  const email = String(data.email ?? "").trim().toLowerCase();
  const domain = email.split("@")[1] ?? "";
  if (!domain) return null;

  if (opts.startWindow) {
    const windowEnd = now + PARTNER_SESSION_WORKING_MS;
    if (new Date(data.expires_at).getTime() > windowEnd) {
      await supabase.from("partner_sessions").update({ expires_at: new Date(windowEnd).toISOString() }).eq("id", data.id);
    }
  }
  return { id: String(data.id), email, domain };
}
