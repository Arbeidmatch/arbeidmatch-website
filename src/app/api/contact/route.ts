import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ContactPayload = {
  name?: string;
  company?: string;
  email?: string;
  need?: string;
  message?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactPayload;
    const name = (body.name || "").trim();
    const company = (body.company || "").trim();
    const email = (body.email || "").trim();
    const need = (body.need || "").trim();
    const message = (body.message || "").trim();

    if (!name || !company || !email || !email.includes("@") || !need || !message) {
      return NextResponse.json({ success: false, error: "Please fill in all required fields." }, { status: 400 });
    }

    const isSupportRequest = need === "Support";
    const recipient = isSupportRequest ? "support@arbeidmatcgh.no" : "post@arbeidmatch.no";
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
      from: '"ArbeidMatch Contact" <no-replay@arbeidmatch.no>',
      to: recipient,
      subject: `${isSupportRequest ? "Support request" : "New contact message"} - ${company}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E2E5EA;overflow:hidden;">
            <div style="background:#0D1B2A;color:#fff;padding:16px 20px;">
              <div style="font-size:22px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
              <div style="margin-top:6px;color:#DDE3ED;">${isSupportRequest ? "Support message" : "Contact message"} from website</div>
            </div>
            <div style="padding:20px;color:#0D1B2A;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Company:</strong> ${company}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Request type:</strong> ${need}</p>
              <p><strong>Submitted:</strong> ${submittedAt}</p>
              <p style="margin-top:14px;"><strong>Message:</strong></p>
              <div style="border:1px solid #E2E5EA;border-radius:8px;padding:10px;background:#FAFBFD;">
                ${message}
              </div>
            </div>
          </div>
        </div>
      `,
    });

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: email,
      subject: "We received your message - ArbeidMatch",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E2E5EA;overflow:hidden;">
            <div style="background:#0D1B2A;color:#fff;padding:16px 20px;">
              <div style="font-size:22px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
              <div style="margin-top:6px;color:#DDE3ED;">Contact confirmation</div>
            </div>
            <div style="padding:20px;color:#0D1B2A;">
              <p>Hi ${name},</p>
              <p>Thank you for contacting us. We received your message and will respond shortly.</p>
              <p><strong>Request type:</strong> ${need}</p>
              <p style="margin-top:16px;">Best regards,<br />ArbeidMatch Team</p>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("contact route error", error);
    return NextResponse.json({ success: false, error: "Could not send message." }, { status: 500 });
  }
}
