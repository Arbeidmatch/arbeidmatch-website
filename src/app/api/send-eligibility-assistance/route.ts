import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const rawData = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(rawData)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "send-eligibility-assistance", 8, 10 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const data = sanitizeStringRecord(rawData);

    const supabase = getSupabaseClient();

    const transporter = nodemailer.createTransport({
      host: "send.one.com",
      port: 465,
      secure: true,
      auth: {
        user: "no-replay@arbeidmatch.no",
        pass: process.env.SMTP_PASS,
      },
    });

    const section = (title: string, rows: Array<[string, string | undefined]>) => `
      <div style="border:1px solid #E2E5EA;border-radius:10px;padding:14px 16px;margin-top:14px;">
        <div style="border-left:4px solid #C9A84C;padding-left:10px;font-weight:700;color:#0D1B2A;margin-bottom:10px;">
          ${title}
        </div>
        ${rows
          .filter(([, value]) => value && String(value).trim())
          .map(
            ([label, value]) =>
              `<div style="margin:6px 0;color:#0D1B2A;"><span style="font-weight:600;">${label}:</span> ${value}</div>`,
          )
          .join("")}
      </div>
    `;

    const adminHtml = `
      <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
        <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
          <div style="background:#0D1B2A;color:#fff;padding:18px 22px;">
            <div style="font-size:24px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
            <div style="margin-top:8px;color:#DDE3ED;">New work eligibility assistance request</div>
            <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
            <div style="margin-top:10px;font-size:13px;color:#C7D1DF;">${new Date().toLocaleString("en-GB")}</div>
          </div>
          <div style="padding:20px;">
            ${section("Guide Request", [
              ["Wants assistance", data.wantsAssistance],
              ["Target region", data.targetRegion],
              ["Target country", data.targetCountry],
              ["Notification email", data.notifyEmail],
              ["Marketing consent", data.marketingConsent],
            ])}
          </div>
          <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">
            ArbeidMatch Norge AS · Org.nr. 935 667 089 · post@arbeidmatch.no
          </div>
        </div>
      </div>
    `;

    const candidateHtml = `
      <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
        <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
          <div style="background:#0D1B2A;color:#fff;padding:20px 22px;">
            <h2 style="margin:0;">Thank you for your interest!</h2>
            <p style="margin:8px 0 0;color:#E7EDF8;">
              We received your notification request and will email you when the updated guide is available.
            </p>
            <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
          </div>
          <div style="padding:20px;color:#0D1B2A;">
            <p><strong>Target region:</strong> ${data.targetRegion || "-"}</p>
            <p><strong>Target country:</strong> ${data.targetCountry || "-"}</p>
            <p><strong>Notification email:</strong> ${data.notifyEmail || "-"}</p>
            <p><strong>Marketing consent:</strong> ${data.marketingConsent || "No"}</p>
            <p style="margin-top:18px;">
              Help us improve your experience:
              <a href="https://arbeidmatch.no/feedback" style="color:#C9A84C;font-weight:600;text-decoration:none;"> Share feedback</a>
            </p>
            <p style="margin-top:18px;"><strong>Contact:</strong> post@arbeidmatch.no · +47 967 34 730</p>
          </div>
          <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">ArbeidMatch Norge AS</div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: "post@arbeidmatch.no",
      subject: `Guide Notification Request | ${data.notifyEmail ?? "Unknown email"}`,
      html: adminHtml,
    });

    if (data.notifyEmail) {
      await transporter.sendMail({
        from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
        to: data.notifyEmail,
        subject: "Guide notification registered | ArbeidMatch",
        html: candidateHtml,
      });
    }

    if (supabase && data.notifyEmail) {
      const { error } = await supabase.from("guide_interest_signups").insert({
        notify_email: data.notifyEmail,
        wants_assistance: data.wantsAssistance || null,
        target_region: data.targetRegion || null,
        target_country: data.targetCountry || null,
      });
      if (error) {
        console.error("guide_interest_signups insert error:", error.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
