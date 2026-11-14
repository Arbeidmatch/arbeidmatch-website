import { NextRequest, NextResponse } from "next/server";
import { createSmtpTransporter, sendMailWithRetry, signedInMailHeaders } from "@/lib/createSmtpTransporter";
import { isPlausibleEmail, isRecipientRefused } from "@/lib/visitorMail";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { formatEmailTimestampCet } from "@/lib/emailPremiumTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { siteFeedbackNoticeLetter, siteFeedbackReceiptLetter } from "@/lib/emails/letters";
import { unsubscribeUrlFor } from "@/lib/emailSubscription";

type SiteFeedbackPayload = {
  rating?: number;
  email?: string;
  note?: string;
  siteRelated?: string;
  issueCategory?: string;
  issueDetails?: string;
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
    const emailRaw = (body.email || "").trim();
    const noteRaw = (body.note || "").trim();
    const siteRelatedRaw = (body.siteRelated || "").trim();
    const issueCategoryRaw = (body.issueCategory || "").trim();
    const issueDetailsRaw = (body.issueDetails || "").trim();
    const sourceRaw = (body.source || "site-feedback").trim();

    if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
      return NextResponse.json({ success: false, error: "Rating must be between 1 and 10." }, { status: 400 });
    }
    if (!isPlausibleEmail(emailRaw)) {
      return NextResponse.json({ success: false, error: "A valid email is required." }, { status: 400 });
    }

    const transporter = createSmtpTransporter();
    if (!transporter) {
      return NextResponse.json({ success: false, error: "Email service is not configured." }, { status: 500 });
    }

    const submittedAt = formatEmailTimestampCet();

    const notice = siteFeedbackNoticeLetter({
      rating,
      email: emailRaw,
      source: sourceRaw,
      submittedAt,
      siteRelated: siteRelatedRaw,
      category: issueCategoryRaw,
      note: noteRaw,
      issueDetails: issueDetailsRaw,
    });
    await sendMailWithRetry(transporter, {
      ...signedInMailHeaders(),
      to: "post@arbeidmatch.no",
      subject: notice.subject,
      html: notice.html,
    });

    // The notice above is the feedback. The receipt goes to the address typed, and
    // a refusal of it must not turn a received message into an error (the visitor
    // would send it again): it is told to #errors only when it is not the visitor's
    // address that was refused.
    try {
      const receipt = siteFeedbackReceiptLetter({
        rating,
        to: emailRaw,
        unsubscribeUrl: await unsubscribeUrlFor(emailRaw, "site-feedback"),
      });
      await sendMailWithRetry(transporter, {
        ...signedInMailHeaders(),
        to: emailRaw,
        subject: receipt.subject,
        html: receipt.html,
      });
    } catch (error) {
      if (!isRecipientRefused(error)) await notifyError({ route: "/api/site-feedback (receipt)", error });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/site-feedback", error });
    console.error("site-feedback error", error);
    return NextResponse.json({ success: false, error: "Failed to send feedback." }, { status: 500 });
  }
}
