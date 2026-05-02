import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedAtsClient: SupabaseClient | null = null;

/** Service-role client for the ATS Supabase project (server-only). */
export function getSupabaseAtsClient(): SupabaseClient | null {
  if (cachedAtsClient) return cachedAtsClient;
  const url = process.env.SUPABASE_ATS_URL?.trim() || process.env.ATS_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_ATS_SERVICE_KEY?.trim() || process.env.ATS_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  cachedAtsClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAtsClient;
}
