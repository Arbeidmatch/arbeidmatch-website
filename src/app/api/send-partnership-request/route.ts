import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as Record<string, string>;
    if (hasHoneypotValue(data as Record<string, unknown>)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "send-partnership-request", 8, 10 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

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
    const section = (title: string, rows: Array<[string, string | undefined]>) => {
      const filtered = rows.filter(([, value]) => hasValue(value));
      if (!filtered.length) return "";
      return `
        <div style="border:1px solid #E2E5EA;border-radius:10px;padding:14px 16px;margin-top:14px;">
          <div style="border-left:4px solid #C9A84C;padding-left:10px;font-weight:700;color:#0D1B2A;margin-bottom:10px;">
            ${title}
          </div>
          ${filtered
            .map(
              ([label, value]) =>
                `<div style="margin:6px 0;color:#0D1B2A;"><span style="font-weight:600;">${label}:</span> ${value}</div>`,
            )
            .join("")}
        </div>
      `;
    };

    const adminHtml = `
      <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
        <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
          <div style="background:#0D1B2A;color:#fff;padding:18px 22px;">
            <div style="font-size:24px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
            <div style="margin-top:8px;color:#DDE3ED;">New non-partner request received via arbeidmatch.no</div>
            <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
            <div style="margin-top:10px;font-size:13px;color:#C7D1DF;">${new Date().toLocaleString("en-GB")}</div>
          </div>
          <div style="padding:20px;">
            ${section("Company Contact", [
              ["Company", data.company],
              ["Org.nr.", data.orgNumber],
              ["Email", data.email],
              ["Requested location", data.requestedLocation],
            ])}
            ${section("Request Overview", [
              ["Partnership status", partnershipLabel],
              ["Initial summary", data.job_summary],
              ["Engagement model", data.engagementModel],
            ])}
            ${section("Submission Metadata", [
              ["Source channel", "Website form: https://www.arbeidmatch.no/request"],
              ["Purpose", "Employer candidate request"],
              ["Reference ID", referenceId],
            ])}
            ${section("Lead Source Details", [
              ["How did you hear about us", leadSource],
              ["Referral company", data.referralCompanyName],
              ["Referral company org.nr", data.referralOrgNumber],
              ["Referral contact email", data.referralEmail],
            ])}
          </div>
          <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">
            ArbeidMatch Norge AS · Org.nr. 935 667 089 · post@arbeidmatch.no
          </div>
        </div>
      </div>
    `;

    const employerHtml = `
      <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
        <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
          <div style="background:#0D1B2A;color:#fff;padding:20px 22px;">
            <h2 style="margin:0;">Thank you for your request, ${data.company || "team"}!</h2>
            <p style="margin:8px 0 0;color:#E7EDF8;">
              We received your request and our team will send you an offer as soon as possible.
            </p>
            <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
          </div>
          <div style="padding:20px;color:#0D1B2A;">
            <h3 style="margin:0 0 8px;">Request summary</h3>
            <p><strong>Engagement model:</strong> ${data.engagementModel || "-"}</p>
            <p><strong>Location:</strong> ${data.requestedLocation || "-"}</p>
            <p><strong>Needs:</strong> ${data.job_summary || "-"}</p>
            <p><strong>Reference ID:</strong> ${referenceId}</p>
            <p><strong>Source channel:</strong> Website form (arbeidmatch.no/request)</p>
            <p style="margin-top:18px;">
              Help us improve your experience:
              <a href="https://arbeidmatch.no/feedback" style="color:#C9A84C;font-weight:600;text-decoration:none;"> Share feedback</a>
            </p>
            <p style="margin-top:18px;"><strong>Contact:</strong> post@arbeidmatch.no · +47 967 34 730</p>
          </div>
          <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">ArbeidMatch Norge AS</div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: "post@arbeidmatch.no",
      subject: `New Partnership Request | ${data.company ?? "Unknown company"} | ${referenceId}`,
      html: adminHtml,
    });

    if (data.email) {
      await transporter.sendMail({
        from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
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
