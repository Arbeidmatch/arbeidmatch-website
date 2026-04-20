import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { hasHoneypotValue } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";
import {
  emailDataTable,
  emailParagraph,
  emailSupportAfterCta,
  mailHeaders,
  premiumCtaButton,
} from "@/lib/emailPremiumTemplate";
import { createEligibilityVerificationToken } from "@/lib/notificationToken";
import { notifyError } from "@/lib/errorNotifier";
import { buildEmail } from "@/lib/emailTemplate";

export const dynamic = "force-dynamic";

const TWO_MIN_MS = 2 * 60 * 1000;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Returns seconds remaining until allowed, or 0 if OK. `null` = query error. */
async function getEmailDbRateLimitRetrySeconds(
  supabase: SupabaseClient,
  notifyEmail: string,
): Promise<number | null> {
  const { data: lastRow, error } = await supabase
    .from("guide_interest_signups")
    .select("created_at")
    .eq("notify_email", notifyEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[send-eligibility-assistance] DB rate-limit lookup failed:", error.message);
    return null;
  }
  if (!lastRow?.created_at) {
    return 0;
  }

  const created = new Date(lastRow.created_at as string).getTime();
  const elapsed = Date.now() - created;
  if (elapsed >= TWO_MIN_MS) {
    return 0;
  }
  return Math.ceil((TWO_MIN_MS - elapsed) / 1000);
}

/** Server-side Turnstile siteverify disabled (Vercel Hobby outbound); widget still gates submit on client. Re-enable when on Pro. */
async function verifyTurnstileToken(token: string | undefined): Promise<boolean> {
  void token;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const rawData = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(rawData)) {
      return NextResponse.json({ success: true });
    }

    const turnstileToken = typeof rawData.turnstileToken === "string" ? rawData.turnstileToken : "";
    const turnstileOk = await verifyTurnstileToken(turnstileToken);
    if (!turnstileOk) {
      const body = { success: false, error: "Bot detected" };
      return NextResponse.json(body, { status: 400 });
    }

    const data = sanitizeStringRecord(rawData);
    if (!data.notifyEmail || !data.notifyEmail.includes("@")) {
      const body = { success: false, error: "Valid email is required." };
      return NextResponse.json(body, { status: 400 });
    }
    if (data.marketingConsent !== "Yes") {
      const body = { success: false, error: "Marketing consent confirmation is required." };
      return NextResponse.json(body, { status: 400 });
    }

    const emailTrimmed = data.notifyEmail.trim();
    const countryTrimmed = data.targetCountry?.trim() ?? "";
    if (!countryTrimmed) {
      const body = { success: false, error: "Target country is required." };
      return NextResponse.json(body, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const retryAfter = await getEmailDbRateLimitRetrySeconds(supabase, emailTrimmed);
      if (retryAfter === null) {
        const body = { success: false, error: "Could not verify request timing. Please try again." };
        return NextResponse.json(body, { status: 500 });
      }
      if (retryAfter > 0) {
        const body = { success: false, rateLimited: true, retryAfter };
        return NextResponse.json(body, { status: 429 });
      }

      const { data: existing, error: existingError } = await supabase
        .from("guide_interest_signups")
        .select("id, email_verified")
        .eq("notify_email", emailTrimmed)
        .eq("target_country", countryTrimmed)
        .maybeSingle();

      if (existingError) {
        console.error("[send-eligibility-assistance] Supabase lookup email+country failed:", existingError.message);
        const body = { success: false, error: "Could not verify registration status. Please try again." };
        return NextResponse.json(body, { status: 500 });
      }

      if (existing?.email_verified === true) {
        const body = { success: true, alreadyRegistered: true };
        return NextResponse.json(body);
      }

      if (!existing) {
        const { data: anyVerifiedRow, error: anyVerifiedError } = await supabase
          .from("guide_interest_signups")
          .select("id")
          .eq("notify_email", emailTrimmed)
          .eq("email_verified", true)
          .limit(1)
          .maybeSingle();

        if (anyVerifiedError) {
          console.error("[send-eligibility-assistance] Supabase lookup any-verified failed:", anyVerifiedError.message);
          const body = { success: false, error: "Could not verify registration status. Please try again." };
          return NextResponse.json(body, { status: 500 });
        }

        if (anyVerifiedRow) {
          const verifiedAt = new Date().toISOString();
          const { error: insertError } = await supabase.from("guide_interest_signups").insert({
            notify_email: emailTrimmed,
            wants_assistance: data.wantsAssistance || null,
            target_region: data.targetRegion || null,
            target_country: countryTrimmed,
            email_verified: true,
            verified_at: verifiedAt,
          });
          if (insertError) {
            console.error("[send-eligibility-assistance] Direct insert failed:", insertError.message);
            const body = { success: false, error: "Could not save registration. Please try again." };
            return NextResponse.json(body, { status: 500 });
          }
          const body = { success: true, directlyRegistered: true };
          return NextResponse.json(body);
        }
      }
    }

    const transporter = nodemailer.createTransport({
      host: "send.one.com",
      port: 465,
      secure: true,
      auth: {
        user: "no-replay@arbeidmatch.no",
        pass: process.env.SMTP_PASS,
      },
    });

    const token = createEligibilityVerificationToken({
      source: "eligibility-assistance",
      notifyEmail: emailTrimmed,
      wantsAssistance: data.wantsAssistance,
      targetRegion: data.targetRegion,
      targetCountry: data.targetCountry,
      marketingConsent: data.marketingConsent,
    });
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://arbeidmatch.no";
    const verificationUrl = `${baseUrl}/api/verify-notification-email?token=${encodeURIComponent(token)}`;

    const candidateInner = [
      emailParagraph(
        "Please verify your email address to confirm consent and activate your notification subscription.",
      ),
      emailDataTable([
        { label: "Target region", value: data.targetRegion || "-" },
        { label: "Target country", value: data.targetCountry || "-" },
        { label: "Notification email", value: emailTrimmed },
        { label: "Marketing consent", value: data.marketingConsent || "No" },
      ]),
      `<div style="text-align:center;margin:8px 0 0;">${premiumCtaButton(verificationUrl, "Verify email and activate notifications")}</div>`,
      emailSupportAfterCta(),
      `<div style="text-align:center;margin:16px 0 0;">${premiumCtaButton("https://arbeidmatch.no/feedback", "Share feedback")}</div>`,
    ].join("");

    await transporter.sendMail({
      ...mailHeaders(),
      to: emailTrimmed,
      subject: "Verify your email for notifications | ArbeidMatch",
      text: `Please verify your email to activate notifications.

Open the HTML version of this message and use the verify button.

Target region: ${data.targetRegion || "-"}
Target country: ${data.targetCountry || "-"}

If the button does not work, reply to this email for help.`,
      html: buildEmail({
        title: "Verify your email for notifications",
        preheader: "Confirm consent and activate your subscription",
        body: candidateInner,
      }),
    });

    const okBody = { success: true, requiresVerification: true };
    return NextResponse.json(okBody);
  } catch (error) {
    await notifyError({ route: "/api/send-eligibility-assistance", error });
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-eligibility-assistance] catch:", message);
    const body = { success: false, error: message };
    return NextResponse.json(body, { status: 500 });
  }
}
