import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";
import { notifyError } from "@/lib/errorNotifier";
import { notifySlack } from "@/lib/slackNotifier";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { contactNoticeLetter, contactReceiptLang, contactReceiptLetter } from "@/lib/emails/letters";
import { getOrCreateSubscription, isUnsubscribed } from "@/lib/emailSubscription";
import { lookupBrregCompany } from "@/lib/brreg";
import { CANDIDATE_NEED, EMPLOYER_NEED } from "@/lib/contactNeeds";
import { formatOrgNumber, isValidOrgNumber, normalizeOrgNumber } from "@/lib/orgNumber";
import { EEA_COUNTRIES, judgeForeignCompany } from "@/lib/foreignCompany";
import { checkVies } from "@/lib/vies";

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

const MAX_CV_BYTES = 5 * 1024 * 1024;

/** A CV is a PDF or a Word document, judged by its first bytes, not by its name. */
function cvKind(bytes: Uint8Array): "pdf" | "docx" | "doc" | null {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return "docx";
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) return "doc";
  return null;
}

/** The form arrives as JSON, or as multipart when a candidate attaches a CV. */
async function readForm(request: NextRequest): Promise<{ fields: Record<string, unknown>; cv: File | null }> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("multipart/form-data")) {
    const fd = await request.formData();
    const fields: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) if (typeof v === "string") fields[k] = v;
    const cv = fd.get("cv");
    return { fields, cv: cv instanceof File && cv.size > 0 ? cv : null };
  }
  return { fields: (await request.json()) as Record<string, unknown>, cv: null };
}

/**
 * The contact form (ORDER 44, 5 October 2026), three doors:
 *
 *  - a Norwegian company, found in Brønnøysund by name or number;
 *  - a job seeker, with phone, trade and an optional CV, sent to the
 *    candidate side: with a CV to cv@, where the CV import makes the
 *    candidate; without one as a Candidate inquiry, which the ATS routes to
 *    the candidate side without a decision card;
 *  - a company from another EU/EEA country, with its VAT number checked in
 *    VIES, a company e-mail and an EU/EEA phone.
 *
 * Refusals are answered to the page (the popup), never by mail, and nothing
 * is sent for them.
 */
export async function POST(request: NextRequest) {
  try {
    const { fields: rawBody, cv } = await readForm(request);
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
    const body = sanitizeStringRecord(rawBody) as Record<string, string | undefined>;
    const typed = (key: string) => (typeof rawBody[key] === "string" ? (rawBody[key] as string).trim() : "");

    const name = typed("name");
    const companyRaw = typed("company");
    const company = companyRaw || "Not provided";
    const email = typed("email");
    // Anything but a candidate's message or a support request is a client's, and
    // needs the organisation number below, whatever the request says it is.
    const typedNeed = typed("need");
    const need = typedNeed === CANDIDATE_NEED || typedNeed === "Support" ? typedNeed : EMPLOYER_NEED;
    const foreign = need === EMPLOYER_NEED && typed("foreign") === "1";
    let message = typed("message");

    if (!name || !email || !email.includes("@") || !message) {
      return NextResponse.json({ success: false, error: "Please fill in all required fields." }, { status: 400 });
    }

    // His rule, 28 September 2026: a client writes with the company's
    // organisation number, found in Brreg. The ATS intake reads the notice by
    // its labels, so the number travels inside the Company value, not as a new label.
    let companyLine = company;
    if (need === EMPLOYER_NEED && !foreign) {
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

    // A company from another EU/EEA country: only a verified one is sent.
    if (foreign) {
      const phone = typed("phone");
      const country = typed("country").toUpperCase();
      if (!companyRaw || !phone) {
        return NextResponse.json({ success: false, error: "Please fill in all required fields." }, { status: 400 });
      }
      const verdict = judgeForeignCompany({ country, email, phone, vatNumber: typed("vatNumber") });
      if (!verdict.ok) {
        if (verdict.reason === "phone_unreadable") {
          return NextResponse.json({ success: false, error: "Phone with country code required.", code: "phone_format" }, { status: 400 });
        }
        return NextResponse.json({ success: false, refused: "policy", reason: verdict.reason }, { status: 422 });
      }
      let registeredName: string | null = null;
      if (verdict.viesCountry) {
        const vies = await checkVies(verdict.viesCountry, verdict.vat);
        if (vies.status === "unreachable") {
          return NextResponse.json({ success: false, error: "VIES unreachable.", code: "vies_unreachable" }, { status: 503 });
        }
        if (vies.status === "invalid") {
          return NextResponse.json({ success: false, refused: "policy", reason: "vies_invalid" }, { status: 422 });
        }
        registeredName = vies.name;
      }
      const countryName = EEA_COUNTRIES.find((c) => c.code === country)?.name ?? country;
      const vatLabel = verdict.viesCountry ? `VAT ${verdict.viesCountry}${verdict.vat}, VIES checked` : `VAT ${verdict.vat}`;
      companyLine = `${registeredName || companyRaw} (${vatLabel}, ${countryName})`;
      message = `${message}\n\nPhone: ${phone}`;
    }

    // A job seeker: phone and trade, and the CV when there is one.
    let attachment: { filename: string; content: Buffer } | null = null;
    if (need === CANDIDATE_NEED) {
      const phone = typed("phone");
      const trade = typed("trade");
      if (!phone || phone.replace(/\D/g, "").length < 6 || !trade) {
        return NextResponse.json({ success: false, error: "Please fill in all required fields." }, { status: 400 });
      }
      message = `${message}\n\nPhone: ${phone}\nTrade: ${trade}`;
      if (cv) {
        if (cv.size > MAX_CV_BYTES) {
          return NextResponse.json({ success: false, error: "CV too large.", code: "cv_too_large" }, { status: 400 });
        }
        const bytes = new Uint8Array(await cv.arrayBuffer());
        const kind = cvKind(bytes);
        if (!kind) {
          return NextResponse.json({ success: false, error: "CV must be a PDF or Word file.", code: "cv_type" }, { status: 400 });
        }
        const safeName = (name.replace(/[^\p{L}\p{N} ._-]/gu, "").trim() || "candidate").slice(0, 60);
        attachment = { filename: `CV ${safeName}.${kind}`, content: Buffer.from(bytes) };
      }
    }

    const smtp = getSmtpConfig();
    if (!smtp) {
      return NextResponse.json({ success: false, error: "SMTP not configured" }, { status: 500 });
    }

    const isSupportRequest = need === "Support";
    const supportRecipient = process.env.SUPPORT_EMAIL || "support@arbeidmatch.no";
    // A CV goes to the CV mailbox, where the import turns it into a candidate;
    // cv@ takes CVs only (his rule, 30 September 2026).
    const recipient = isSupportRequest ? supportRecipient : attachment ? "cv@arbeidmatch.no" : "post@arbeidmatch.no";

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
      ...(attachment ? { attachments: [attachment] } : {}),
    });

    if (!(await isUnsubscribed(email))) {
      const unsubToken = await getOrCreateSubscription(email, "contact");
      const receipt = contactReceiptLetter({
        name,
        need,
        lang: contactReceiptLang(rawBody.lang, need === EMPLOYER_NEED && !foreign ? "nb" : "en"),
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
