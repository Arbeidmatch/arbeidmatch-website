import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml, sanitizeStringRecord } from "@/lib/htmlSanitizer";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { getRateLimitResult, hasHoneypotValue, noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { notifyError } from "@/lib/errorNotifier";
import { logApiError } from "@/lib/secureLogger";
import {
  buildInternalEmailHtml,
  emailDataTable,
  emailParagraph,
  mailHeaders,
  premiumCtaButton,
  wrapPremiumEmail,
} from "@/lib/emailPremiumTemplate";

const requestSchema = z
  .object({
    company: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(200).optional().or(z.literal("")),
    full_name: z.string().trim().max(120).optional().or(z.literal("")),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    city: z.string().trim().max(120).optional().or(z.literal("")),
    position: z.string().trim().max(120).optional().or(z.literal("")),
    positionOther: z.string().trim().max(120).optional().or(z.literal("")),
    numberOfPositions: z.string().trim().max(20).optional().or(z.literal("")),
    startDate: z.string().trim().max(80).optional().or(z.literal("")),
    startDateOther: z.string().trim().max(80).optional().or(z.literal("")),
    howDidYouHear: z.string().trim().max(120).optional().or(z.literal("")),
    socialMediaPlatform: z.string().trim().max(120).optional().or(z.literal("")),
    socialMediaOther: z.string().trim().max(120).optional().or(z.literal("")),
    howDidYouHearOther: z.string().trim().max(120).optional().or(z.literal("")),
    referralCompanyName: z.string().trim().max(160).optional().or(z.literal("")),
    referralOrgNumber: z.string().trim().max(40).optional().or(z.literal("")),
    referralEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
    website: z.string().max(256).optional(),
    company_website: z.string().max(256).optional(),
    honeypot: z.string().max(256).optional(),
  })
  .passthrough();

export async function POST(request: NextRequest) {
  try {
    const rate = getRateLimitResult(request, "send-request-email", 6, 10 * 60 * 1000);
    if (rate.limited) {
      return noStoreJson(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }
    const parsed = await parseJsonBodyWithSchema(request, requestSchema, { maxBytes: 64 * 1024 });
    if (!parsed.ok) return parsed.response;
    const rawData = parsed.data as Record<string, unknown>;
    if (hasHoneypotValue(rawData)) {
      return noStoreJson({ success: true });
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

    const transporter = createSmtpTransporter();
    if (!transporter) {
      return noStoreJson({ success: false, error: "SMTP is not configured." }, { status: 500 });
    }

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

    return noStoreJson({ success: true });
  } catch (error) {
    logApiError("send-request-email", error);
    await notifyError({
      route: "/api/send-request-email",
      error,
      context: {
        recipient: "post@arbeidmatch.no",
        timestamp: new Date().toISOString(),
      },
    });
    return noStoreJson({ success: false, error: "Failed to send email." }, { status: 500 });
  }
}
