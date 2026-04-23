import { NextResponse } from "next/server";
import { z } from "zod";

import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const valid = z.string().uuid().safeParse(token).success;
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid token." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Service unavailable." }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("request_tokens")
      .select("token,email,expires_at,used,job_summary")
      .eq("token", token)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ success: false, error: "Token not found." }, { status: 404 });
    }

    if (data.used === true) {
      return NextResponse.json({ success: false, error: "Token already used." }, { status: 410 });
    }
    if (new Date(data.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ success: false, error: "Token expired." }, { status: 410 });
    }
    if ((data.job_summary || "").trim().toLowerCase() !== "employer_trial") {
      return NextResponse.json({ success: false, error: "Invalid trial token." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        token: data.token,
        email: data.email,
      },
    });
  } catch (error) {
    await notifyError({ route: "/api/employer/trial/token/[token]", error });
    return NextResponse.json({ success: false, error: "Could not validate token." }, { status: 500 });
  }
}

