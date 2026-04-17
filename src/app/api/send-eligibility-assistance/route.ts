import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { hasHoneypotValue } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";
import { createEligibilityVerificationToken } from "@/lib/notificationToken";

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

async function verifyTurnstileToken(token: string | undefined, request: NextRequest): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return true;
  }
  if (!token?.trim()) {
    return false;
  }
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token.trim());
  const forwarded =
    request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) {
    body.set("remoteip", forwarded);
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v1/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const json = (await res.json()) as { success?: boolean };
  return json.success === true;
}

export async function POST(request: NextRequest) {
  try {
    const rawData = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(rawData)) {
      return NextResponse.json({ success: true });
    }

    const turnstileToken = typeof rawData.turnstileToken === "string" ? rawData.turnstileToken : "";
    const turnstileOk = await verifyTurnstileToken(turnstileToken, request);
    console.log("[send-eligibility-assistance] turnstile:", { ok: turnstileOk, tokenLength: turnstileToken.length });
    if (!turnstileOk) {
      const body = { success: false, error: "Bot detected" };
      console.log("[send-eligibility-assistance] response:", JSON.stringify({ status: 400, ...body }));
      return NextResponse.json(body, { status: 400 });
    }

    const data = sanitizeStringRecord(rawData);
    console.log("[send-eligibility] called at:", Date.now());
    console.log("[send-eligibility] email:", data.notifyEmail);
    if (!data.notifyEmail || !data.notifyEmail.includes("@")) {
      const body = { success: false, error: "Valid email is required." };
      console.log("[send-eligibility-assistance] response:", JSON.stringify({ status: 400, ...body }));
      return NextResponse.json(body, { status: 400 });
    }
    if (data.marketingConsent !== "Yes") {
      const body = { success: false, error: "Marketing consent confirmation is required." };
      console.log("[send-eligibility-assistance] response:", JSON.stringify({ status: 400, ...body }));
      return NextResponse.json(body, { status: 400 });
    }

    const emailTrimmed = data.notifyEmail.trim();
    const countryTrimmed = data.targetCountry?.trim() ?? "";
    if (!countryTrimmed) {
      const body = { success: false, error: "Target country is required." };
      console.log("[send-eligibility-assistance] response:", JSON.stringify({ status: 400, ...body }));
      return NextResponse.json(body, { status: 400 });
    }

    console.log("[send-eligibility-assistance] request:", { emailTrimmed, countryTrimmed });

    const supabase = getSupabaseClient();
    if (supabase) {
      const retryAfter = await getEmailDbRateLimitRetrySeconds(supabase, emailTrimmed);
      console.log("[send-eligibility-assistance] db rate-limit (seconds to wait, 0=ok):", retryAfter);
      if (retryAfter === null) {
        const body = { success: false, error: "Could not verify request timing. Please try again." };
        console.log("[send-eligibility-assistance] response:", JSON.stringify({ status: 500, ...body }));
        return NextResponse.json(body, { status: 500 });
      }
      if (retryAfter > 0) {
        const body = { success: false, rateLimited: true, retryAfter };
        console.log("[send-eligibility-assistance] response:", JSON.stringify({ status: 429, ...body }));
        return NextResponse.json(body, { status: 429 });
      }

      const { data: existing, error: existingError } = await supabase
        .from("guide_interest_signups")
        .select("id, email_verified")
        .eq("notify_email", emailTrimmed)
        .eq("target_country", countryTrimmed)
        .single();

      if (existingError && existingError.code !== "PGRST116") {
        console.error("[send-eligibility-assistance] Supabase lookup failed:", existingError.message);
        const body = { success: false, error: "Could not verify registration status. Please try again." };
        console.log("[send-eligibility-assistance] response:", JSON.stringify({ status: 500, ...body }));
        return NextResponse.json(body, { status: 500 });
      }

      if (existing?.email_verified === true) {
        const body = { success: true, alreadyRegistered: true };
        console.log("[send-eligibility-assistance] response:", JSON.stringify({ status: 200, ...body }));
        return NextResponse.json(body);
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

    const candidateHtml = `
      <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
        <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
          <div style="background:#0D1B2A;color:#fff;padding:20px 22px;">
            <h2 style="margin:0;">Confirm your email to activate notifications</h2>
            <p style="margin:8px 0 0;color:#E7EDF8;">
              Please verify your email address to confirm consent and activate your notification subscription.
            </p>
            <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
          </div>
          <div style="padding:20px;color:#0D1B2A;">
            <p><strong>Target region:</strong> ${data.targetRegion || "-"}</p>
            <p><strong>Target country:</strong> ${data.targetCountry || "-"}</p>
            <p><strong>Notification email:</strong> ${emailTrimmed || "-"}</p>
            <p><strong>Marketing consent:</strong> ${data.marketingConsent || "No"}</p>
            <p style="margin-top:14px;">
              <a
                href="${verificationUrl}"
                style="display:inline-block;background:#C9A84C;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;"
              >
                Verify email and activate notifications
              </a>
            </p>
            <p style="margin-top:10px;font-size:13px;color:#5F6C80;">
              If the button does not work, copy and paste this link in your browser:<br />
              <a href="${verificationUrl}" style="color:#0D1B2A;">${verificationUrl}</a>
            </p>
            <p style="margin-top:18px;">
              Help us improve your experience:
              <a href="https://arbeidmatch.no/feedback" style="color:#C9A84C;font-weight:600;text-decoration:none;"> Share feedback</a>
            </p>
            <p style="margin-top:18px;"><strong>Contact:</strong> support@arbeidmatch.no</p>
          </div>
          <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">ArbeidMatch Norge AS</div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: emailTrimmed,
      subject: "Verify your email for notifications | ArbeidMatch",
      html: candidateHtml,
    });

    const okBody = { success: true, requiresVerification: true };
    console.log("[send-eligibility-assistance] response:", JSON.stringify({ status: 200, ...okBody }));
    return NextResponse.json(okBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-eligibility-assistance] catch:", message);
    const body = { success: false, error: message };
    console.log("[send-eligibility-assistance] response:", JSON.stringify({ status: 500, ...body }));
    return NextResponse.json(body, { status: 500 });
  }
}
