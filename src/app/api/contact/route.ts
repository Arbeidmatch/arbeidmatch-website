import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { escapeHtml, sanitizeStringRecord } from "@/lib/htmlSanitizer";
import {
  buildInternalEmailHtml,
  emailParagraph,
  mailHeaders,
  premiumCtaButton,
  wrapPremiumEmail,
} from "@/lib/emailPremiumTemplate";

type ContactPayload = {
  name?: string;
  company?: string;
  email?: string;
  need?: string;
  message?: string;
};

export async function POST(request: NextRequest) {
  try {
    const rawBody = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(rawBody)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "contact-form", 8, 10 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const body = sanitizeStringRecord(rawBody) as ContactPayload;

    const name = (body.name || "").trim();
    const company = (body.company || "").trim();
    const email = (body.email || "").trim();
    const need = (body.need || "").trim();
    const message = (body.message || "").trim();

    if (!name || !company || !email || !email.includes("@") || !need || !message) {
      return NextResponse.json({ success: false, error: "Please fill in all required fields." }, { status: 400 });
    }

    const isSupportRequest = need === "Support";
    const supportRecipient = process.env.SUPPORT_EMAIL || "support@arbeidmatch.no";
    const recipient = isSupportRequest ? supportRecipient : "post@arbeidmatch.no";

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
      title: `${isSupportRequest ? "Support request" : "Contact message"}: ${name} from ${company}`,
      rows: [
        { label: "Name", value: name },
        { label: "Company", value: company },
        { label: "Email", value: email },
        { label: "Request type", value: need },
        { label: "Message", value: message },
      ],
    });

    await transporter.sendMail({
      ...mailHeaders(),
      to: recipient,
      subject: `${isSupportRequest ? "Support request" : "New contact message"}: ${name} from ${company}`,
      html: internalHtml,
    });

    const safeName = escapeHtml(name);
    const safeNeed = escapeHtml(need);
    const userInner = [
      emailParagraph(`Hi ${safeName},`),
      emailParagraph("Thank you for contacting us. We received your message and will respond shortly."),
      emailParagraph(`<strong>Request type:</strong> ${safeNeed}`),
      `<div style="text-align:center;margin:8px 0 0;">${premiumCtaButton("https://arbeidmatch.no/feedback", "Share feedback")}</div>`,
    ].join("");

    await transporter.sendMail({
      ...mailHeaders(),
      to: email,
      subject: "We received your message - ArbeidMatch",
      html: wrapPremiumEmail(userInner),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("contact route error", error);
    return NextResponse.json({ success: false, error: "Could not send message." }, { status: 500 });
  }
}
