import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";
import { notifyError } from "@/lib/errorNotifier";
import { notifySlack } from "@/lib/slackNotifier";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { contactNoticeLetter, contactReceiptLetter } from "@/lib/emails/letters";
import { getOrCreateSubscription, isUnsubscribed } from "@/lib/emailSubscription";
import { lookupBrregCompany } from "@/lib/brreg";
import { CANDIDATE_NEED, EMPLOYER_NEED } from "@/lib/contactNeeds";
import { formatOrgNumber, isValidOrgNumber, normalizeOrgNumber } from "@/lib/orgNumber";

type ContactPayload = {
  name?: string;
  company?: string;
  email?: string;
  need?: string;
  message?: string;
  orgNumber?: string;
};

/** Server-side Turnstile siteverify disabled (Vercel Hobby outbound); widget still gates submit on client. Re-enable when on Pro. */
async function verifyTurnstileToken(token: string | undefined): Promise<boolean> {
  void token;
  return true;
}

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
    const turnstileToken = typeof rawBody.turnstileToken === "string" ? rawBody.turnstileToken : "";
    if (!(await verifyTurnstileToken(turnstileToken))) {
      return NextResponse.json({ success: false, error: "Bot detected" }, { status: 400 });
    }
    // Slack gets the escaped copy, as before. The letters escape what they print,
    // so they are given the words as typed: escaped twice, "Bygg & Anlegg AS"
    // arrived as "Bygg &amp; Anlegg AS", in the mail and in the ATS proposal.
    const body = sanitizeStringRecord(rawBody) as ContactPayload;
    const typed = (key: keyof ContactPayload) => (typeof rawBody[key] === "string" ? (rawBody[key] as string).trim() : "");

    const name = typed("name");
    const companyRaw = typed("company");
    const company = companyRaw || "Not provided";
    const email = typed("email");
    // Anything but a candidate's message or a support request is a client's, and
    // needs the organisation number below, whatever the request says it is.
    const typedNeed = typed("need");
    const need = typedNeed === CANDIDATE_NEED || typedNeed === "Support" ? typedNeed : EMPLOYER_NEED;
    const message = typed("message");

    if (!name || !email || !email.includes("@") || !message) {
      return NextResponse.json({ success: false, error: "Please fill in all required fields." }, { status: 400 });
    }

    // His rule, 28 September 2026: a client writes with the company's
    // organisation number, found in Brreg. The ATS intake reads the notice by
    // its labels, so the number travels inside the Company value, not as a new label.
    let companyLine = company;
    if (need === EMPLOYER_NEED) {
      const orgNumber = normalizeOrgNumber(typed("orgNumber"));
      if (!isValidOrgNumber(orgNumber)) {
        return NextResponse.json({ success: false, error: "Organisation number required." }, { status: 400 });
      }
      const registered = await lookupBrregCompany(orgNumber);
      if (registered.status === "missing") {
        return NextResponse.json({ success: false, error: "Organisation number not found." }, { status: 400 });
      }
      // When Brreg cannot be reached, a number with a valid check digit is enough.
      const registeredName = registered.status === "found" ? registered.company.name : companyRaw;
      companyLine = `${registeredName || "Not provided"} (org.nr ${formatOrgNumber(orgNumber)})`;
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

    // Read back by the ATS intake: see contactNoticeLetter before changing a label.
    const notice = contactNoticeLetter({ name, company: companyLine, email, need, message, isSupport: isSupportRequest, to: recipient });
    await transporter.sendMail({
      ...mailHeaders(),
      to: recipient,
      subject: notice.subject,
      html: notice.html,
    });

    if (!(await isUnsubscribed(email))) {
      const unsubToken = await getOrCreateSubscription(email, "contact");
      const receipt = contactReceiptLetter({
        name,
        need,
        to: email,
        unsubscribeUrl: `https://arbeidmatch.no/api/unsubscribe?token=${encodeURIComponent(unsubToken)}`,
      });
      await transporter.sendMail({
        ...mailHeaders(),
        to: email,
        subject: receipt.subject,
        html: receipt.html,
      });
    }

    void notifySlack("contacts", {
      title: "Mesaj nou prin formularul de contact",
      fields: {
        Nume: (body.name || "").trim(),
        Email: (body.email || "").trim(),
        Mesaj: (body.message || "").trim().slice(0, 100),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/contact", error });
    return NextResponse.json({ success: false, error: "Could not send message." }, { status: 500 });
  }
}
