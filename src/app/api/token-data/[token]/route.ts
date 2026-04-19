import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { noStoreJson } from "@/lib/apiSecurity";
import { logApiError } from "@/lib/secureLogger";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const supabase = getSupabaseAdminClient();
  const { token } = await params;
  const validToken = z.string().uuid().safeParse(token).success;

  if (!supabase || !validToken) {
    return noStoreJson({ success: false, error: "Invalid request" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("request_tokens")
      .select("company, email, full_name, phone, job_summary, org_number")
      .eq("token", token)
      .single();

    if (error || !data) {
      return noStoreJson({ success: false, error: "Token not found" }, { status: 404 });
    }

    return noStoreJson({ success: true, data });
  } catch (error) {
    logApiError("token-data", error);
    return noStoreJson({ success: false, error: "Could not fetch token data." }, { status: 500 });
  }
}
