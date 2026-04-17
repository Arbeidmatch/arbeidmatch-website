import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";

export async function POST(request: NextRequest) {
  try {
    const rawBody = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(rawBody)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "send-dsb-assistance", 8, 10 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const data = sanitizeStringRecord(rawBody);
    if (!data.email || !data.email.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid email is required." }, { status: 400 });
    }
    if (data.consent !== "Yes") {
      return NextResponse.json({ success: false, error: "Consent is required." }, { status: 400 });
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
      subject: `DSB Assistance Interest | ${data.email}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
          <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
            <div style="background:#0D1B2A;color:#fff;padding:18px 22px;">
              <div style="font-size:24px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
              <div style="margin-top:8px;color:#DDE3ED;">New DSB assistance request</div>
              <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
            </div>
            <div style="padding:20px;color:#0D1B2A;">
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Consent:</strong> ${data.consent}</p>
              <p><strong>Source:</strong> /dsb-assistance</p>
              <p><strong>Reference:</strong> DSB-${Date.now()}</p>
            </div>
            <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">
              ArbeidMatch Norge AS · Org.nr. 935 667 089 · post@arbeidmatch.no
            </div>
          </div>
        </div>
      `,
    });

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: data.email,
      subject: "DSB support notification registered | ArbeidMatch",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
          <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
            <div style="background:#0D1B2A;color:#fff;padding:20px 22px;">
              <h2 style="margin:0;">Thank you for your request</h2>
              <p style="margin:8px 0 0;color:#E7EDF8;">
                We registered your interest in DSB support for electricians.
              </p>
              <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
            </div>
            <div style="padding:20px;color:#0D1B2A;">
              <p>As soon as this assistance option becomes active, we will contact you with details by email.</p>
              <p><strong>Registered email:</strong> ${data.email}</p>
              <p style="margin-top:18px;">
                Help us improve your experience:
                <a href="https://arbeidmatch.no/feedback" style="color:#C9A84C;font-weight:600;text-decoration:none;"> Share feedback</a>
              </p>
            </div>
            <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">ArbeidMatch Norge AS</div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
