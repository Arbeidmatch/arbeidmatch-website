import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const email = (request.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase unavailable." }, { status: 503 });

  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan,status,requests_used,requests_limit,current_period_end,cancel_at_period_end")
    .eq("employer_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Could not load usage." }, { status: 500 });
  if (!data) {
    return NextResponse.json({
      plan: "trial",
      requests_used: 0,
      requests_limit: 1,
      requests_remaining: 1,
      period_end: null,
      status: "trialing",
      cancel_at_period_end: false,
    });
  }

  const used = Number(data.requests_used ?? 0);
  const limit = data.requests_limit === null ? null : Number(data.requests_limit ?? 0);

  return NextResponse.json({
    plan: data.plan,
    status: data.status,
    requests_used: used,
    requests_limit: limit,
    requests_remaining: limit === null ? null : Math.max(limit - used, 0),
    period_end: data.current_period_end,
    cancel_at_period_end: Boolean(data.cancel_at_period_end),
  });
}
