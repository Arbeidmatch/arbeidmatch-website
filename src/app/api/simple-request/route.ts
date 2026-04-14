// v2
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

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("SERVICE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      throw new Error("Supabase configuration missing");
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
      throw new Error("Missing required fields");
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
      throw error;
    }

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("simple-request POST failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
