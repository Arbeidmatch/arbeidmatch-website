import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const supabase = getSupabaseClient();
  const { token } = await params;

  if (!supabase || !token) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("request_tokens")
    .select("company, email, full_name, phone, job_summary, org_number")
    .eq("token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Token not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}
