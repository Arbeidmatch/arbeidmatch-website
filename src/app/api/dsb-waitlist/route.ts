import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { hasHoneypotValue } from "@/lib/requestProtection";
import { isRateLimited } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";

export const dynamic = "force-dynamic";

type Body = {
  first_name?: string;
  email?: string;
  country?: string;
  applicant_type?: string;
  gdpr_consent?: string | boolean;
};

export async function POST(request: NextRequest) {
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(raw)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "dsb-waitlist", 10, 15 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const gdprRaw = raw["gdpr_consent"];
    const gdpr =
      gdprRaw === true ||
      gdprRaw === "true" ||
      gdprRaw === "on" ||
      gdprRaw === "yes";

    const body = sanitizeStringRecord(raw) as Body;
    const firstName = (body.first_name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const country = (body.country || "").trim();
    const applicantType = (body.applicant_type || "").trim();

    if (!firstName || !email || !email.includes("@") || !country) {
      return NextResponse.json({ success: false, error: "Please fill in all required fields." }, { status: 400 });
    }
    if (applicantType !== "eu" && applicantType !== "non-eu") {
      return NextResponse.json({ success: false, error: "Please select applicant type." }, { status: 400 });
    }
    if (!gdpr) {
      return NextResponse.json({ success: false, error: "Consent is required." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database is not configured." }, { status: 500 });
    }

    const { error } = await supabase.from("dsb_waitlist").insert({
      first_name: firstName,
      email,
      country,
      applicant_type: applicantType,
      gdpr_consent: true,
    });

    if (error) {
      console.error("[dsb-waitlist]", error.message);
      return NextResponse.json({ success: false, error: "Could not save. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
