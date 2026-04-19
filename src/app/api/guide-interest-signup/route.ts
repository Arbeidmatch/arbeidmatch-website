import { NextRequest, NextResponse } from "next/server";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function specialtyLabel(s: string): string {
  if (s === "electrician") return "electrician";
  if (s === "welder") return "welder";
  return s;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(body)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "guide-interest-signup", 12, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const specialty = typeof body.specialty === "string" ? body.specialty.trim().toLowerCase() : "";
    const consent = body.consent === true;
    const guideWanted = body.guideWanted === true;

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: "Consent is required." }, { status: 400 });
    }
    if (!specialty) {
      return NextResponse.json({ error: "Specialty is required." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    }

    const wantsAssistance = `trade-signup|specialty=${specialty}|guideWanted=${guideWanted ? "1" : "0"}|consent=1`;

    const { error } = await supabase.from("guide_interest_signups").insert({
      notify_email: email,
      target_region: specialty.slice(0, 120),
      target_country: "trade-interest",
      wants_assistance: wantsAssistance,
      email_verified: true,
      verified_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[guide-interest-signup]", error.message);
      return NextResponse.json({ error: "Could not save signup." }, { status: 500 });
    }

    const transporter = createSmtpTransporter();
    if (transporter) {
      const label = specialtyLabel(specialty);
      try {
        await transporter.sendMail({
          from: `"ArbeidMatch" <no-replay@arbeidmatch.no>`,
          to: email,
          subject: "You are registered. We will be in touch.",
          text: `Hi, thank you for registering with ArbeidMatch. We have noted your interest as a ${label} looking for work in Norway. We will contact you when we have a matching opportunity. If you requested a guide notification, we will let you know when it becomes available.

Best regards,
ArbeidMatch Team
post@arbeidmatch.no`,
        });
      } catch (e) {
        console.error("[guide-interest-signup] email", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[guide-interest-signup]", message);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
