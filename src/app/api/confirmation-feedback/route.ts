import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { escapeHtml } from "@/lib/htmlSanitizer";

type FeedbackPayload = {
  source?: string;
  purpose?: string;
  pageUrl?: string;
  score?: number;
  note?: string;
  email?: string;
};

function normalizePageUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "https://arbeidmatch.no";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `https://arbeidmatch.no${trimmed}`;
  return `https://arbeidmatch.no/${trimmed}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FeedbackPayload;
    if (hasHoneypotValue(body as Record<string, unknown>)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "confirmation-feedback", 15, 10 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const score = Number(body.score);
    if (!Number.isFinite(score) || score < 1 || score > 10) {
      return NextResponse.json({ success: false, error: "Score must be between 1 and 10." }, { status: 400 });
    }

    const source = escapeHtml((body.source || "unknown").trim());
    const purpose = escapeHtml((body.purpose || "Candidate feedback").trim());
    const pageUrl = escapeHtml(normalizePageUrl(body.pageUrl || ""));
    const note = escapeHtml((body.note || "").trim());
    const email = escapeHtml((body.email || "").trim());
    const submittedAt = new Date().toLocaleString("en-GB");

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
      from: '"ArbeidMatch Feedback" <no-replay@arbeidmatch.no>',
      to: "post@arbeidmatch.no",
      subject: `Feedback ${score}/10 | ${source}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E2E5EA;overflow:hidden;color:#0D1B2A;">
            <div style="background:#0D1B2A;color:#fff;padding:16px 20px;">
              <div style="font-size:22px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
              <div style="margin-top:6px;color:#DDE3ED;">New anonymous feedback</div>
            </div>
            <div style="padding:20px;">
              <p style="margin:0 0 10px;"><strong>Source:</strong> ${source}</p>
              <p style="margin:0 0 10px;"><strong>Purpose:</strong> ${purpose}</p>
              <p style="margin:0 0 10px;"><strong>Page:</strong> <a href="${pageUrl}" style="color:#0D1B2A;">${pageUrl}</a></p>
              <p style="margin:0 0 10px;"><strong>Score:</strong> ${score}/10</p>
              <p style="margin:0 0 10px;"><strong>Submitted:</strong> ${submittedAt}</p>
              ${
                note
                  ? `<p style="margin:14px 0 6px;"><strong>Note:</strong></p>
              <div style="border:1px solid #E2E5EA;border-radius:8px;padding:10px;background:#FAFBFD;">${note}</div>`
                  : ""
              }
            </div>
          </div>
        </div>
      `,
    });

    if (email && email.includes("@")) {
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
                <p style="margin:0;">Thank you for sharing your feedback.</p>
                <p style="margin:10px 0 0;">We received your score: <strong>${score}/10</strong>.</p>
                <p style="margin:10px 0 0;">Source: <strong>${source}</strong></p>
                <p style="margin:16px 0 0;">Best regards,<br />ArbeidMatch Team</p>
              </div>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("confirmation-feedback error", error);
    return NextResponse.json({ success: false, error: "Could not send feedback." }, { status: 500 });
  }
}
