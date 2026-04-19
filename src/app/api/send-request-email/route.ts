import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { escapeHtml, sanitizeStringRecord } from "@/lib/htmlSanitizer";
import {
  buildInternalEmailHtml,
  emailDataTable,
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
    if (isRateLimited(request, "send-request-email", 6, 10 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const data = sanitizeStringRecord(rawData);

    const selectedPosition =
      data.position === "Other" ? data.positionOther || "Other" : data.position;
    const selectedStartDate =
      data.startDate === "Other" ? data.startDateOther || "Other" : data.startDate;
    const leadSource =
      data.howDidYouHear === "Social media" && data.socialMediaPlatform === "Other"
        ? data.socialMediaOther || "Social media"
        : data.howDidYouHear === "Social media"
          ? `Social media (${data.socialMediaPlatform || "-"})`
          : data.howDidYouHear === "Other"
            ? data.howDidYouHearOther || "Other"
            : data.howDidYouHear;
    const socialMediaPlatformValue =
      data.howDidYouHear === "Social media" ? data.socialMediaPlatform : "";
    const socialMediaOtherValue =
      data.howDidYouHear === "Social media" && data.socialMediaPlatform === "Other"
        ? data.socialMediaOther
        : "";
    const howDidYouHearOtherValue = data.howDidYouHear === "Other" ? data.howDidYouHearOther : "";
    const referralCompanyValue =
      data.howDidYouHear === "Referral from another company" ? data.referralCompanyName : "";
    const referralOrgNumberValue =
      data.howDidYouHear === "Referral from another company" ? data.referralOrgNumber : "";
    const referralEmailValue =
      data.howDidYouHear === "Referral from another company" ? data.referralEmail : "";

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
    push(adminRows, "Full name", data.full_name);
    push(adminRows, "Phone", data.phone);
    push(adminRows, "Hiring type", data.hiringType);
    push(adminRows, "Category", data.category);
    push(adminRows, "Position", selectedPosition);
    push(adminRows, "Initial summary", data.job_summary);
    push(adminRows, "Qualification", data.qualification);
    push(adminRows, "Candidates needed", data.numberOfPositions);
    push(adminRows, "Experience", data.experience);
    push(adminRows, "Norwegian level", data.norwegianLevel);
    push(adminRows, "English level", data.englishLevel);
    push(adminRows, "Certifications", data.certifications);
    push(adminRows, "Certifications (other)", data.certificationsOther);
    push(adminRows, "Driver license", data.driverLicense);
    push(adminRows, "Driver license (other)", data.driverLicenseOther);
    push(adminRows, "D-number", data.dNumber);
    push(adminRows, "D-number (other)", data.dNumberOther);
    push(adminRows, "Deal breakers", data.requirements);
    push(adminRows, "Contract type", data.contractType);
    push(adminRows, "Salary", data.salary);
    push(adminRows, "Hours unit", data.hoursUnit);
    push(adminRows, "Hours amount", data.hoursAmount);
    push(adminRows, "Overtime", data.overtime);
    push(adminRows, "Max overtime/week", data.maxOvertimeHours);
    push(adminRows, "Has rotation", data.hasRotation);
    push(adminRows, "Rotation weeks on", data.rotationWeeksOn);
    push(adminRows, "Rotation weeks off", data.rotationWeeksOff);
    push(adminRows, "International travel", data.internationalTravel);
    push(adminRows, "Local travel", data.localTravel);
    push(adminRows, "Local travel (other)", data.localTravelOther);
    push(adminRows, "Accommodation", data.accommodation);
    push(adminRows, "Accommodation cost", data.accommodationCost);
    push(adminRows, "Accommodation (other)", data.accommodationOther);
    push(adminRows, "Equipment", data.equipment);
    push(adminRows, "Equipment (other)", data.equipmentOther);
    push(adminRows, "Tools", data.tools);
    push(adminRows, "Tools (other)", data.toolsOther);
    push(adminRows, "City", data.city);
    push(adminRows, "Start date", selectedStartDate);
    push(adminRows, "How did you hear (resolved)", leadSource);
    push(adminRows, "Subscribe", data.subscribe);
    push(adminRows, "Notes", data.notes);
    push(adminRows, "How did you hear (raw)", data.howDidYouHear);
    push(adminRows, "Social media platform", socialMediaPlatformValue);
    push(adminRows, "Social media other", socialMediaOtherValue);
    push(adminRows, "How did you hear (other)", howDidYouHearOtherValue);
    push(adminRows, "Referral company", referralCompanyValue);
    push(adminRows, "Referral company org.nr", referralOrgNumberValue);
    push(adminRows, "Referral contact email", referralEmailValue);

    const companyName = data.company ?? "Unknown company";
    const cityLabel = data.city || "-";
    const adminHtml = buildInternalEmailHtml({
      title: `New candidate request: ${companyName} from ${cityLabel}`,
      rows: adminRows,
    });

    const employerRows = [
      { label: "Position", value: selectedPosition },
      { label: "Number of candidates", value: data.numberOfPositions },
      { label: "Location", value: data.city },
      { label: "Preferred start", value: selectedStartDate },
    ].filter((r) => hasValue(r.value));

    const safeCo = escapeHtml(data.company || "team");
    const employerInner = [
      emailParagraph(`Thank you for your request, <strong>${safeCo}</strong>!`),
      emailParagraph("We have received your candidate request and will get back to you within 24 hours."),
      employerRows.length ? emailDataTable(employerRows) : "",
      emailParagraph("<strong>What happens next</strong>"),
      emailParagraph("1. We review your request"),
      emailParagraph("2. We match suitable candidates"),
      emailParagraph("3. We contact you within 24 hours"),
      `<div style="text-align:center;margin:8px 0 0;">${premiumCtaButton("https://arbeidmatch.no/feedback", "Share feedback")}</div>`,
      emailParagraph("<strong>Contact:</strong> post@arbeidmatch.no · +47 967 34 730"),
    ]
      .filter(Boolean)
      .join("");

    const employerHtml = wrapPremiumEmail(employerInner);

    await transporter.sendMail({
      ...mailHeaders(),
      to: "post@arbeidmatch.no",
      subject: `New candidate request: ${companyName} from ${cityLabel}`,
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

    if (data.referralEmail) {
      const safeRefCo = escapeHtml(data.company || "-");
      const referralInner = [
        emailParagraph("Thank you for recommending ArbeidMatch!"),
        emailParagraph(
          `We received a request from <strong>${safeRefCo}</strong> and they mentioned your recommendation.`,
        ),
        emailParagraph("We appreciate your trust. If we can support your hiring needs in the future, we would be happy to help."),
        `<div style="text-align:center;margin:8px 0 0;">${premiumCtaButton("https://arbeidmatch.no/contact", "Contact us")}</div>`,
      ].join("");
      const referralHtml = wrapPremiumEmail(referralInner);

      await transporter.sendMail({
        ...mailHeaders(),
        to: data.referralEmail,
        subject: "Thank you for the referral - ArbeidMatch Norge",
        html: referralHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("send-request-email failed:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
