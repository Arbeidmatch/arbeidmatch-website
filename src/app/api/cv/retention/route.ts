import { NextRequest } from "next/server";

import { noStoreJson } from "@/lib/apiSecurity";
import { logApiError } from "@/lib/secureLogger";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { removeObjects } from "@/lib/cv/storage";

export const dynamic = "force-dynamic";

/**
 * Daily retention sweep, run by the Vercel cron entry in vercel.json.
 *
 * `cv_run_retention()` deletes expired OTP rows, spent access tokens, old decline
 * counters and documents past 24 months, and returns the storage paths that belonged to
 * the deleted documents so they can be removed from the bucket here.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return noStoreJson({ error: "Server misconfiguration" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return noStoreJson({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return noStoreJson({ error: "Service unavailable" }, { status: 503 });
    }

    const { data, error } = await supabase.rpc("cv_run_retention");
    if (error) throw error;

    const paths = Array.isArray(data)
      ? (data as Array<{ storage_path?: string | null }>)
          .map((row) => row.storage_path)
          .filter((path): path is string => Boolean(path))
      : [];

    await removeObjects(supabase, paths);

    return noStoreJson({ success: true, storageObjectsRemoved: paths.length });
  } catch (error) {
    logApiError("cv/retention", error);
    return noStoreJson({ success: false, error: "Retention sweep failed." }, { status: 500 });
  }
}
