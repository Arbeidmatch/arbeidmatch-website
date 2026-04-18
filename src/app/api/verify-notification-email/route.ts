import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { verifyEligibilityVerificationToken } from "@/lib/notificationToken";
import { buildInternalEmailHtml, emailParagraph, mailHeaders, wrapPremiumEmail } from "@/lib/emailPremiumTemplate";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function classifyVerificationError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("supabase")) return "supabase error";
  if (message.includes("smtp") || message.includes("mail")) return "smtp error";
  if (message.includes("token")) return "token invalid";
  return "verification flow error";
}

async function sendErrorReport(
  request: NextRequest,
  token: string,
  errorType: string,
  errorMessage: string,
) {
  try {
    const transporter = nodemailer.createTransport({
      host: "send.one.com",
      port: 465,
      secure: true,
      auth: {
        user: "no-replay@arbeidmatch.no",
        pass: process.env.SMTP_PASS,
      },
    });

    const tokenPreview = token ? `${token.slice(0, 20)}...` : "(missing token)";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const clientIp = getClientIp(request);
    const timestamp = new Date().toISOString();

    await transporter.sendMail({
      ...mailHeaders(),
      to: "post@arbeidmatch.no",
      subject: `Verification error: ${errorType}`,
      html: buildInternalEmailHtml({
        title: `Verification error: ${errorType}`,
        rows: [
          { label: "Timestamp (ISO)", value: timestamp },
          { label: "Error type", value: errorType },
          { label: "Error message", value: errorMessage || "—" },
          { label: "Token preview", value: tokenPreview },
          { label: "User agent", value: userAgent },
          { label: "Client IP", value: clientIp },
        ],
      }),
    });
  } catch (reportError) {
    const message = reportError instanceof Error ? reportError.message : "Unknown report error";
    console.error("[verify-notification-email] Failed to send support error report:", message);
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  console.log("[verify] token prefix:", token?.substring(0, 20));
  if (!token) {
    console.error("[verify-notification-email] Missing token query parameter.");
  }
  const result = verifyEligibilityVerificationToken(token);
  console.log("[verify] result:", result ? "valid" : "null/invalid");
  const payload = result;

  if (!payload) {
    console.error("[verify-notification-email] Token verification failed (invalid signature, payload, or expired token).");
    const invalidUrl = request.nextUrl.clone();
    invalidUrl.pathname = "/eligibility-assistance";
    invalidUrl.searchParams.set("verification", "invalid");
    return NextResponse.redirect(invalidUrl);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error("[verify-notification-email] Missing Supabase configuration.");
    void sendErrorReport(request, token, "supabase error", "Missing Supabase configuration");
    const failedUrl = request.nextUrl.clone();
    failedUrl.pathname = "/eligibility-assistance";
    failedUrl.searchParams.set("verification", "error");
    failedUrl.searchParams.set("reason", "supabase-config");
    return NextResponse.redirect(failedUrl);
  }

  try {
    const verifiedAt = new Date().toISOString();

    const existing = await supabase
      .from("guide_interest_signups")
      .select("id, email_verified")
      .eq("notify_email", payload.notifyEmail)
      .eq("target_region", payload.targetRegion || null)
      .eq("target_country", payload.targetCountry || null)
      .limit(1);

    if (existing.error) {
      console.error("[verify-notification-email] Lookup in guide_interest_signups failed:", existing.error.message);
      throw new Error(existing.error.message);
    }

    const row = existing.data?.[0];

    if (row?.email_verified === true) {
      const alreadyUrl = request.nextUrl.clone();
      alreadyUrl.pathname = "/verified";
      alreadyUrl.search = "";
      alreadyUrl.searchParams.set("status", "already-verified");
      return NextResponse.redirect(alreadyUrl);
    }

    if (row) {
      const { error: updateError } = await supabase
        .from("guide_interest_signups")
        .update({ email_verified: true, verified_at: verifiedAt })
        .eq("id", row.id);
      if (updateError) {
        console.error("[verify-notification-email] Update guide_interest_signups failed:", updateError.message);
        throw new Error(updateError.message);
      }
    } else {
      const { error: insertError } = await supabase.from("guide_interest_signups").insert({
        notify_email: payload.notifyEmail,
        wants_assistance: payload.wantsAssistance || null,
        target_region: payload.targetRegion || null,
        target_country: payload.targetCountry || null,
        email_verified: true,
        verified_at: verifiedAt,
      });
      if (insertError) {
        console.error("[verify-notification-email] Insert into guide_interest_signups failed:", insertError.message);
        throw new Error(insertError.message);
      }
    }

    try {
      const transporter = nodemailer.createTransport({
        host: "send.one.com",
        port: 465,
        secure: true,
        auth: {
          user: "no-replay@arbeidmatch.no",
          pass: process.env.SMTP_PASS,
        },
      });

      const internalHtml = buildInternalEmailHtml({
        title: `Verified guide notification signup: ${payload.notifyEmail}`,
        rows: [
          { label: "Email", value: payload.notifyEmail },
          { label: "Target region", value: payload.targetRegion || "—" },
          { label: "Target country", value: payload.targetCountry || "—" },
          { label: "Marketing consent", value: payload.marketingConsent || "No" },
          { label: "Verified at (ISO)", value: verifiedAt },
        ],
      });

      await transporter.sendMail({
        ...mailHeaders(),
        to: "post@arbeidmatch.no",
        subject: `Verified guide notification signup: ${payload.notifyEmail}`,
        html: internalHtml,
      });

      const userInner = [
        emailParagraph("Your email is now verified."),
        emailParagraph("You are now registered in our notification system."),
        emailParagraph("We will contact you by email when the updated guide is available."),
      ].join("");

      await transporter.sendMail({
        ...mailHeaders(),
        to: payload.notifyEmail,
        subject: "Email verified for notifications | ArbeidMatch",
        html: wrapPremiumEmail(userInner),
      });
    } catch (mailError) {
      const message = mailError instanceof Error ? mailError.message : "unknown mail error";
      console.error("[verify-notification-email] Verification succeeded, but follow-up email failed:", message);
    }

    const successUrl = request.nextUrl.clone();
    successUrl.pathname = "/verified";
    successUrl.search = "";
    return NextResponse.redirect(successUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[verify-notification-email] Verification flow failed:", message);
    void sendErrorReport(request, token, classifyVerificationError(error), message);
    const failedUrl = request.nextUrl.clone();
    failedUrl.pathname = "/eligibility-assistance";
    failedUrl.searchParams.set("verification", "error");
    failedUrl.searchParams.set("reason", "verify-flow");
    return NextResponse.redirect(failedUrl);
  }
}
