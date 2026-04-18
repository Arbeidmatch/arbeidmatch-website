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

export async function POST(request: NextRequest) {
  try {
    const rawData = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(rawData)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "send-partnership-request", 8, 10 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const data = sanitizeStringRecord(rawData);

    const referenceId = `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const partnershipLabel =
      data.partnershipStatus === "new" ? "No, we are not a partner yet" : "Yes, we are already a partner";
    const leadSource =
      data.howDidYouHear === "Social media" && data.socialMediaPlatform === "Other"
        ? `Social media (${data.socialMediaOther || "Other"})`
        : data.howDidYouHear === "Social media"
          ? `Social media (${data.socialMediaPlatform || "-"})`
          : data.howDidYouHear === "Other"
            ? data.howDidYouHearOther || "Other"
            : data.howDidYouHear;

    const transporter = nodemailer.createTransport({
      host: "send.one.com",
      port: 465,
      secure: true,
      auth: {
        user: "no-replay@arbeidmatch.no",
        pass: process.env.SMTP_PASS,
      },
    });

    const hasValue = (value?: string) => value !== undefined && value !== null && String(value).trim() !== "";
    const push = (rows: { label: string; value: string }[], label: string, v?: string) => {
      if (!hasValue(v)) return;
      rows.push({ label, value: String(v).trim() });
    };

    const adminRows: { label: string; value: string }[] = [];
    push(adminRows, "Company", data.company);
    push(adminRows, "Org.nr.", data.orgNumber);
    push(adminRows, "Email", data.email);
    push(adminRows, "Requested location", data.requestedLocation);
    push(adminRows, "Partnership status", partnershipLabel);
    push(adminRows, "Initial summary", data.job_summary);
    push(adminRows, "Engagement model", data.engagementModel);
    push(adminRows, "Source channel", "Website form (arbeidmatch.no/request)");
    push(adminRows, "Purpose", "Employer candidate request");
    push(adminRows, "Reference ID", referenceId);
    push(adminRows, "How did you hear (resolved)", leadSource);
    push(adminRows, "Referral company", data.referralCompanyName);
    push(adminRows, "Referral company org.nr", data.referralOrgNumber);
    push(adminRows, "Referral contact email", data.referralEmail);

    const companyName = data.company ?? "Unknown company";
    const adminHtml = buildInternalEmailHtml({
      title: `New partnership request: ${companyName} · ${referenceId}`,
      rows: adminRows,
    });

    const safeCo = escapeHtml(data.company || "team");
    const employerInner = [
      emailParagraph(`Thank you for your request, <strong>${safeCo}</strong>!`),
      emailParagraph("We received your request and our team will send you an offer as soon as possible."),
      emailParagraph(`<strong>Engagement model:</strong> ${escapeHtml(data.engagementModel || "—")}`),
      emailParagraph(`<strong>Location:</strong> ${escapeHtml(data.requestedLocation || "—")}`),
      emailParagraph(`<strong>Needs:</strong> ${escapeHtml(data.job_summary || "—")}`),
      emailParagraph(`<strong>Reference ID:</strong> ${escapeHtml(referenceId)}`),
      emailParagraph("<strong>Source:</strong> Website form (arbeidmatch.no/request)"),
      `<div style="text-align:center;margin:8px 0 0;">${premiumCtaButton("https://arbeidmatch.no/feedback", "Share feedback")}</div>`,
      emailParagraph("<strong>Contact:</strong> post@arbeidmatch.no · +47 967 34 730"),
    ].join("");

    const employerHtml = wrapPremiumEmail(employerInner);

    await transporter.sendMail({
      ...mailHeaders(),
      to: "post@arbeidmatch.no",
      subject: `New partnership request: ${companyName} · ${referenceId}`,
      html: adminHtml,
    });

    if (data.email) {
      await transporter.sendMail({
        ...mailHeaders(),
        to: data.email,
        subject: `Thank you for your request | ${data.company ?? "ArbeidMatch"}`,
        html: employerHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
