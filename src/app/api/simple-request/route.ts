import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ success: false }, { status: 500 });
  }

  const body = await request.json();
  const { full_name, company, email, phone, job_summary } = body as {
    full_name?: string;
    company?: string;
    email?: string;
    phone?: string;
    job_summary?: string;
  };

  if (!full_name || !company || !email || !phone || !job_summary) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("request_tokens").insert({
    token,
    full_name,
    company,
    email,
    phone,
    job_summary,
    expires_at: expiresAt,
    used: false,
  });

  if (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true, token });
}
