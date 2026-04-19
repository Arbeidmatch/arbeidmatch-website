import { NextRequest, NextResponse } from "next/server";

import { verifyPremiumJwt } from "@/lib/premium/jwt";
import { computeHasAccess, fetchSubscriberByEmail } from "@/lib/premium/subscribers";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("premium_token")?.value;
    if (!token) {
      return NextResponse.json({
        hasAccess: false,
        plan: null as string | null,
        status: null as string | null,
        trialEndsAt: null as string | null,
      });
    }

    let email: string;
    try {
      ({ email } = await verifyPremiumJwt(token));
    } catch {
      return NextResponse.json(
        { hasAccess: false, plan: null, status: null, trialEndsAt: null },
        { status: 401 },
      );
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    }

    const row = await fetchSubscriberByEmail(supabase, email);
    const hasAccess = computeHasAccess(row);

    return NextResponse.json({
      hasAccess,
      plan: row?.plan ?? null,
      status: row?.status ?? null,
      trialEndsAt: row?.trial_ends_at ?? null,
      email,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[premium/verify]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
