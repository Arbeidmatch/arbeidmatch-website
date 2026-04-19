import { NextRequest, NextResponse } from "next/server";

import { signPremiumJwt } from "@/lib/premium/jwt";
import {
  computeHasAccess,
  fetchSubscriberByEmail,
  insertTrialSubscriber,
} from "@/lib/premium/subscribers";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { isRateLimited } from "@/lib/requestProtection";

export const dynamic = "force-dynamic";

interface Body {
  email?: string;
}

function cookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSec,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, "premium-start-trial", 20, 10 * 60 * 1000)) {
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

    let row = await fetchSubscriberByEmail(supabase, email);

    if (!row) {
      const inserted = await insertTrialSubscriber(email);
      if (!inserted) {
        return NextResponse.json({ error: "Could not start trial." }, { status: 500 });
      }
      row = inserted;
    }

    if (row.status === "active") {
      const token = await signPremiumJwt({
        email,
        plan: row.plan ?? "active",
        expiresIn: "30d",
      });
      const res = NextResponse.json({ hasAccess: true, status: row.status });
      res.cookies.set("premium_token", token, cookieOptions(60 * 60 * 24 * 30));
      return res;
    }

    if (row.status === "trialing" && row.trial_ends_at) {
      const trialEnd = new Date(row.trial_ends_at).getTime();
      if (trialEnd > Date.now()) {
        const maxAgeSec = Math.max(120, Math.ceil((trialEnd - Date.now()) / 1000));
        const token = await signPremiumJwt({
          email,
          plan: "trialing",
          expiresAt: new Date(row.trial_ends_at),
        });
        const res = NextResponse.json({ ok: true, status: "trialing", trialEndsAt: row.trial_ends_at });
        res.cookies.set("premium_token", token, cookieOptions(maxAgeSec));
        return res;
      }
      return NextResponse.json({
        requiresPayment: true,
        message: "Trial has ended. Choose a plan to continue.",
      });
    }

    if (computeHasAccess(row)) {
      const token = await signPremiumJwt({ email, plan: row.plan ?? "active", expiresIn: "30d" });
      const res = NextResponse.json({ hasAccess: true, status: row.status });
      res.cookies.set("premium_token", token, cookieOptions(60 * 60 * 24 * 30));
      return res;
    }

    return NextResponse.json({
      requiresPayment: true,
      message: "Your free trial has ended. Choose a plan to continue.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[premium/start-trial]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
