import { NextRequest, NextResponse } from "next/server";

import { computeHasAccess, fetchSubscriberByEmail } from "@/lib/premium/subscribers";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { isRateLimited } from "@/lib/requestProtection";
import { notifyError } from "@/lib/errorNotifier";

export const dynamic = "force-dynamic";

interface Body {
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, "premium-check-email", 30, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }
    const body = (await request.json()) as Body;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    }

    const row = await fetchSubscriberByEmail(supabase, email);
    const isNew = !row;
    const hasAccess = computeHasAccess(row);

    return NextResponse.json({
      isNew,
      status: row?.status ?? null,
      trialEndsAt: row?.trial_ends_at ?? null,
      hasAccess,
    });
  } catch (e) {
    await notifyError({ route: "/api/premium/check-email", error: e });
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[premium/check-email]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
