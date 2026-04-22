import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { escapeHtml, sanitizeStringRecord } from "@/lib/htmlSanitizer";
import { notifyError } from "@/lib/errorNotifier";
import { notifySlack } from "@/lib/slackNotifier";
import { buildEmail, emailBodyParagraph, emailFieldRows } from "@/lib/emailTemplate";
import { mailHeaders, premiumCtaButton } from "@/lib/emailPremiumTemplate";
import { logEmailSent } from "@/lib/audit/masterAuditLog";
import { getOrCreateSubscription, isUnsubscribed } from "@/lib/emailSubscription";

type ContactPayload = {
  name?: string;
  company?: string;
  email?: string;
  need?: string;
  message?: string;
};

function getSmtpConfig(): { host: string; port: number; user: string; pass: string } | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 465;
  if (!host || !user || !pass) return null;
  if (!Number.isFinite(port)) return null;
  return { host, port, user, pass };
}

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

    const smtp = getSmtpConfig();
    if (!smtp) {
      return NextResponse.json({ success: false, error: "SMTP not configured" }, { status: 500 });
    }

    const isSupportRequest = need === "Support";
    const supportRecipient = process.env.SUPPORT_EMAIL || "support@arbeidmatch.no";
    const recipient = isSupportRequest ? supportRecipient : "post@arbeidmatch.no";

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    const internalBody = emailFieldRows([
      { label: "Name", value: name },
      { label: "Company", value: company },
      { label: "Email", value: email },
      { label: "Request type", value: need },
      { label: "Message", value: message },
    ]);

    await transporter.sendMail({
      ...mailHeaders(),
      to: recipient,
      subject: `${isSupportRequest ? "Support request" : "New contact message"}: ${name} from ${company}`,
      html: buildEmail({
        title: `${isSupportRequest ? "Support request" : "Contact message"}: ${name} from ${company}`,
        preheader: "New inbound contact form submission",
        body: internalBody,
      }),
    });
    logEmailSent("contact_form_internal", { recipient, isSupportRequest });

    const safeName = escapeHtml(name);
    const safeNeed = escapeHtml(need);
    const userInner = [
      emailBodyParagraph(`Hi ${safeName},`),
      emailBodyParagraph("Thank you for contacting us. We received your message and will respond shortly."),
      emailBodyParagraph(`<strong>Request type:</strong> ${safeNeed}`),
      `<p style="margin:8px 0 0;text-align:center;">${premiumCtaButton("https://arbeidmatch.no/feedback", "Share feedback")}</p>`,
    ].join("");

    if (!(await isUnsubscribed(email))) {
      const unsubToken = await getOrCreateSubscription(email, "contact");
      await transporter.sendMail({
        ...mailHeaders(),
        to: email,
        subject: "We received your message - ArbeidMatch",
        html: buildEmail({
          title: "We received your message",
          preheader: "Our team will respond shortly",
          body: userInner,
          unsubscribeToken: unsubToken,
        }),
      });
      logEmailSent("contact_form_ack", { toDomain: email.includes("@") ? email.split("@")[1] ?? "" : "" });
    }

    void notifySlack("contacts", {
      title: "New Contact Form Submission",
      fields: {
        Name: name,
        Email: email,
        Message: message.slice(0, 100),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/contact", error });
    console.error("contact route error", error);
    return NextResponse.json({ success: false, error: "Could not send message." }, { status: 500 });
  }
}
