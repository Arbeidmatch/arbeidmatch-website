import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";

type SiteFeedbackPayload = {
  rating?: number;
  email?: string;
  note?: string;
  source?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SiteFeedbackPayload;
    if (hasHoneypotValue(body as Record<string, unknown>)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "site-feedback", 10, 10 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const rating = Number(body.rating);
    const email = (body.email || "").trim();
    const note = (body.note || "").trim();
    const source = (body.source || "site-feedback").trim();

    if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
      return NextResponse.json({ success: false, error: "Rating must be between 1 and 10." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "A valid email is required." }, { status: 400 });
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

    const submittedAt = new Date().toLocaleString("en-GB");

    await transporter.sendMail({
      from: '"ArbeidMatch Feedback" <no-replay@arbeidmatch.no>',
      to: "post@arbeidmatch.no",
      subject: `New site feedback - ${rating}/10`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E2E5EA;overflow:hidden;">
            <div style="background:#0D1B2A;color:#fff;padding:16px 20px;">
              <div style="font-size:22px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
              <div style="margin-top:6px;color:#DDE3ED;">New website feedback</div>
            </div>
            <div style="padding:20px;color:#0D1B2A;">
              <p style="margin:0 0 10px;"><strong>Rating:</strong> ${rating}/10</p>
              <p style="margin:0 0 10px;"><strong>Email:</strong> ${email}</p>
              <p style="margin:0 0 10px;"><strong>Source:</strong> ${source}</p>
              <p style="margin:0 0 10px;"><strong>Submitted:</strong> ${submittedAt}</p>
              <p style="margin:14px 0 6px;"><strong>Improvement note:</strong></p>
              <div style="border:1px solid #E2E5EA;border-radius:8px;padding:10px;background:#FAFBFD;">
                ${note || "No additional note provided."}
              </div>
            </div>
          </div>
        </div>
      `,
    });

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: email,
      subject: "Thank you for your feedback - ArbeidMatch",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E2E5EA;overflow:hidden;">
            <div style="background:#0D1B2A;color:#fff;padding:16px 20px;">
              <div style="font-size:22px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
              <div style="margin-top:6px;color:#DDE3ED;">Feedback confirmation</div>
            </div>
            <div style="padding:20px;color:#0D1B2A;">
              <p style="margin:0;">Thank you for sharing your feedback with us.</p>
              <p style="margin:10px 0 0;">We received your rating: <strong>${rating}/10</strong>.</p>
              <p style="margin:10px 0 0;">Your input helps us improve the candidate and employer experience.</p>
              <p style="margin:16px 0 0;">Best regards,<br />ArbeidMatch Team</p>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("site-feedback error", error);
    return NextResponse.json({ success: false, error: "Failed to send feedback." }, { status: 500 });
  }
}
