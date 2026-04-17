import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

type FeedbackPayload = {
  source?: string;
  score?: number;
  note?: string;
  email?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FeedbackPayload;
    const score = Number(body.score);
    if (!Number.isFinite(score) || score < 1 || score > 10) {
      return NextResponse.json({ success: false, error: "Score must be between 1 and 10." }, { status: 400 });
    }

    const source = (body.source || "unknown").trim();
    const note = (body.note || "").trim();
    const email = (body.email || "").trim();
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
      subject: `Confirmation feedback (${source}) - Score ${score}/10`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E2E5EA;overflow:hidden;">
            <div style="background:#0D1B2A;color:#fff;padding:16px 20px;">
              <div style="font-size:22px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
              <div style="margin-top:6px;color:#DDE3ED;">New confirmation feedback received</div>
            </div>
            <div style="padding:20px;color:#0D1B2A;">
              <p style="margin:0 0 10px;"><strong>Source:</strong> ${source}</p>
              <p style="margin:0 0 10px;"><strong>Score:</strong> ${score}/10</p>
              <p style="margin:0 0 10px;"><strong>Email:</strong> ${email || "-"}</p>
              <p style="margin:0 0 10px;"><strong>Submitted:</strong> ${submittedAt}</p>
              <p style="margin:14px 0 6px;"><strong>Improvement notes:</strong></p>
              <div style="border:1px solid #E2E5EA;border-radius:8px;padding:10px;background:#FAFBFD;">
                ${note || "No additional notes provided."}
              </div>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("confirmation-feedback error", error);
    return NextResponse.json({ success: false, error: "Could not send feedback." }, { status: 500 });
  }
}
