import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { buildInternalEmailHtml, emailParagraph, formatEmailTimestampCet, mailHeaders, wrapPremiumEmail } from "@/lib/emailPremiumTemplate";

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
    if (!emailRaw || !emailRaw.includes("@")) {
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

    const submittedAt = formatEmailTimestampCet();

    await transporter.sendMail({
      ...mailHeaders(),
      to: "post@arbeidmatch.no",
      subject: `New site feedback: ${rating}/10 from ${emailRaw}`,
      html: buildInternalEmailHtml({
        title: `New site feedback: ${rating}/10 from ${emailRaw}`,
        rows: [
          { label: "Rating", value: `${rating}/10` },
          { label: "Email", value: emailRaw },
          { label: "Source", value: sourceRaw },
          { label: "Submitted (CET)", value: submittedAt },
          { label: "Related to website", value: siteRelatedRaw || "-" },
          { label: "Category", value: issueCategoryRaw || "-" },
          { label: "Improvement note", value: noteRaw || "-" },
          { label: "Issue details", value: issueDetailsRaw || "-" },
        ],
      }),
    });

    const userInner = [
      emailParagraph("Thank you for sharing your feedback with us."),
      emailParagraph(`We received your rating: <strong>${rating}/10</strong>.`),
      emailParagraph("Your input helps us improve the candidate and employer experience."),
    ].join("");

    await transporter.sendMail({
      ...mailHeaders(),
      to: emailRaw,
      subject: "Thank you for your feedback - ArbeidMatch",
      html: wrapPremiumEmail(userInner),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("site-feedback error", error);
    return NextResponse.json({ success: false, error: "Failed to send feedback." }, { status: 500 });
  }
}
