import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() || "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ credits_balance: 0, premium_active: false });
  }

  const res = await supabase
    .from("credit_accounts")
    .select("credits_balance,premium_active")
    .eq("email", email)
    .maybeSingle();

  if (res.error) {
    return NextResponse.json({ error: res.error.message }, { status: 500 });
  }

  return NextResponse.json({
    credits_balance: Number((res.data as { credits_balance?: number | null } | null)?.credits_balance ?? 0),
    premium_active: Boolean((res.data as { premium_active?: boolean | null } | null)?.premium_active ?? false),
  });
}
