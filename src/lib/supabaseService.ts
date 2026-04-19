import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

/** Service-role client for server-side API routes only. */
export function getSupabaseServiceClient(): SupabaseClient | null {
  return getSupabaseAdminClient();
}
