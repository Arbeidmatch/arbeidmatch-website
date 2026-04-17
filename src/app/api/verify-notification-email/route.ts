import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { verifyEligibilityVerificationToken } from "@/lib/notificationToken";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const payload = verifyEligibilityVerificationToken(token);

  if (!payload) {
    const invalidUrl = request.nextUrl.clone();
    invalidUrl.pathname = "/eligibility-assistance";
    invalidUrl.searchParams.set("verification", "invalid");
    return NextResponse.redirect(invalidUrl);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const failedUrl = request.nextUrl.clone();
    failedUrl.pathname = "/eligibility-assistance";
    failedUrl.searchParams.set("verification", "error");
    return NextResponse.redirect(failedUrl);
  }

  try {
    const existing = await supabase
      .from("guide_interest_signups")
      .select("id")
      .eq("notify_email", payload.notifyEmail)
      .eq("target_region", payload.targetRegion || null)
      .eq("target_country", payload.targetCountry || null)
      .limit(1);

    if (!existing.data || existing.data.length === 0) {
      const { error } = await supabase.from("guide_interest_signups").insert({
        notify_email: payload.notifyEmail,
        wants_assistance: payload.wantsAssistance || null,
        target_region: payload.targetRegion || null,
        target_country: payload.targetCountry || null,
      });
      if (error) throw new Error(error.message);
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

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: "post@arbeidmatch.no",
      subject: `Verified guide notification signup | ${payload.notifyEmail}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
          <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:14px;border:1px solid #E2E5EA;">
            <div style="background:#0D1B2A;color:#fff;padding:18px 22px;">
              <div style="font-size:24px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
              <div style="margin-top:8px;color:#DDE3ED;">Email verified for guide notifications</div>
            </div>
            <div style="padding:20px;color:#0D1B2A;">
              <p><strong>Email:</strong> ${payload.notifyEmail}</p>
              <p><strong>Target region:</strong> ${payload.targetRegion || "-"}</p>
              <p><strong>Target country:</strong> ${payload.targetCountry || "-"}</p>
              <p><strong>Marketing consent:</strong> ${payload.marketingConsent || "No"}</p>
            </div>
          </div>
        </div>
      `,
    });

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: payload.notifyEmail,
      subject: "Email verified for notifications | ArbeidMatch",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
          <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:14px;border:1px solid #E2E5EA;">
            <div style="background:#0D1B2A;color:#fff;padding:20px 22px;">
              <h2 style="margin:0;">Your email is now verified</h2>
              <p style="margin:8px 0 0;color:#E7EDF8;">You are now registered in our notification system.</p>
            </div>
            <div style="padding:20px;color:#0D1B2A;">
              <p>We will contact you by email when the updated guide is available.</p>
            </div>
          </div>
        </div>
      `,
    });

    const successUrl = request.nextUrl.clone();
    successUrl.pathname = "/eligibility-assistance";
    successUrl.searchParams.set("verification", "success");
    return NextResponse.redirect(successUrl);
  } catch {
    const failedUrl = request.nextUrl.clone();
    failedUrl.pathname = "/eligibility-assistance";
    failedUrl.searchParams.set("verification", "error");
    return NextResponse.redirect(failedUrl);
  }
}
