import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml, sanitizeStringRecord } from "@/lib/htmlSanitizer";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { getRateLimitResult, hasHoneypotValue, noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { notifyError } from "@/lib/errorNotifier";
import { logApiError } from "@/lib/secureLogger";
import { notifySlack } from "@/lib/slackNotifier";
import { buildEmail } from "@/lib/emailTemplate";
import {
  emailDataTable,
  emailParagraph,
  mailHeaders,
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
    const pushSlackField = (fields: Record<string, string>, label: string, value?: string) => {
      if (!hasValue(value)) return;
      fields[label] = String(value).trim();
    };

    const normalizeFieldValue = (value?: string) => {
      if (value === undefined || value === null) return null;
      const text = String(value).trim();
      return text ? text : "";
    };

    const renderValue = (value: string, isEmail = false) => {
      if (!value) {
        return '<span style="color: rgba(255,255,255,0.35); font-style: italic;">Not specified</span>';
      }
      const safe = escapeHtml(value);
      if (isEmail) {
        return `<a href="mailto:${safe}" style="color: #C9A84C; text-decoration: none;">${safe}</a>`;
      }
      return safe;
    };

    const rowHtml = (label: string, rawValue?: string, isEmail = false) => {
      const normalized = normalizeFieldValue(rawValue);
      if (normalized === null) return "";
      return `<div style="display:flex;justify-content:space-between;gap:20px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.03);">
        <div style="color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.5;">${escapeHtml(label)}</div>
        <div style="color: #ffffff; font-size: 13px; font-weight: 500; line-height: 1.5; text-align: right; max-width: 60%;">${renderValue(normalized, isEmail)}</div>
      </div>`;
    };

    const sectionHtml = (title: string, rows: string[], marginTop = 0) => {
      const visibleRows = rows.filter(Boolean);
      if (!visibleRows.length) return "";
      return `<div style="margin-top: ${marginTop}px;">
        <div style="color:#C9A84C;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:16px;">${escapeHtml(title)}</div>
        ${visibleRows.join("")}
      </div>`;
    };

    const companyName = data.company ?? "Unknown company";
    const cityLabel = data.city || "-";
    const nowLabel = new Date().toISOString();
    const adminUrl = "https://www.arbeidmatch.no/admin";
    const adminBody = `
      ${sectionHtml(
        "Contact details",
        [
          rowHtml("Company", data.company),
          rowHtml("Org.nr", data.orgNumber),
          rowHtml("Email", data.email, true),
          rowHtml("Full name", data.full_name),
          rowHtml("Phone", data.phone),
        ],
        0,
      )}
      ${sectionHtml(
        "Position details",
        [
          rowHtml("Category", data.category),
          rowHtml("Position", selectedPosition),
          rowHtml("Contract type", data.contractType),
          rowHtml("Qualification", data.qualification),
          rowHtml("Candidates needed", data.numberOfPositions),
          rowHtml("Certifications", data.certifications),
          rowHtml("Urgency", selectedStartDate),
        ],
        32,
      )}
      ${sectionHtml(
        "Conditions offered",
        [
          rowHtml("Salary", data.salary),
          rowHtml("Salary period", data.salaryPeriod),
          rowHtml("Overtime", data.overtime),
          rowHtml("Accommodation", data.accommodation),
          rowHtml("Transport", data.internationalTravel || data.localTravel),
          rowHtml("Rotation", data.hasRotation),
          rowHtml("Start date", selectedStartDate),
        ],
        32,
      )}
      ${sectionHtml(
        "Location",
        [
          rowHtml("City", data.city),
          rowHtml("Region", data.localTravelOther || data.city),
          rowHtml("Additional notes", data.notes || data.job_summary || leadSource),
        ],
        32,
      )}
    `;

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
      emailParagraph("<strong>Contact:</strong> post@arbeidmatch.no · +47 967 34 730"),
    ]
      .filter(Boolean)
      .join("");

    await transporter.sendMail({
      ...mailHeaders(),
      to: "post@arbeidmatch.no",
      subject: `New candidate request: ${companyName} from ${cityLabel}`,
      html: buildEmail({
        title: `New candidate request: ${companyName} from ${cityLabel}`,
        preheader: nowLabel,
        body: adminBody,
        ctaText: "View Full Request in Admin",
        ctaUrl: adminUrl,
      }),
    });

    if (data.email) {
      await transporter.sendMail({
        ...mailHeaders(),
        to: data.email,
        subject: `Thank you for your request | ${data.company ?? "ArbeidMatch"}`,
        html: buildEmail({
          title: "Thank you for your request",
          preheader: "We will get back to you within 24 hours",
          body: employerInner,
          ctaText: "Share feedback",
          ctaUrl: "https://arbeidmatch.no/feedback",
        }),
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
      ].join("");
      await transporter.sendMail({
        ...mailHeaders(),
        to: data.referralEmail,
        subject: "Thank you for the referral - ArbeidMatch Norge",
        html: buildEmail({
          title: "Thank you for the referral",
          preheader: "We appreciate your recommendation",
          body: referralInner,
          ctaText: "Contact us",
          ctaUrl: "https://arbeidmatch.no/contact",
        }),
      });
    }

    const slackFields: Record<string, string> = {};
    pushSlackField(slackFields, "Company name", data.company);
    pushSlackField(slackFields, "Contact name", data.full_name);
    pushSlackField(slackFields, "Email", data.email);
    pushSlackField(slackFields, "Phone", data.phone);
    pushSlackField(slackFields, "Job category", data.category);
    pushSlackField(slackFields, "Trade / position", selectedPosition);
    pushSlackField(slackFields, "Location / city", data.city);
    pushSlackField(slackFields, "Number of workers needed", data.numberOfPositions);
    pushSlackField(slackFields, "Contract type", data.contractType);
    pushSlackField(slackFields, "Start date", selectedStartDate);
    pushSlackField(
      slackFields,
      "Duration / rotation",
      [data.hasRotation, data.rotationWeeksOn, data.rotationWeeksOff].filter(hasValue).join(" | "),
    );
    pushSlackField(slackFields, "Salary", data.salary);
    pushSlackField(slackFields, "Accommodation", data.accommodation);
    pushSlackField(slackFields, "D-number status", data.dNumber || data.dNumberOther);
    pushSlackField(
      slackFields,
      "Language requirements",
      [data.norwegianLevel, data.englishLevel].filter(hasValue).join(" | "),
    );
    pushSlackField(slackFields, "Driver's license", data.driverLicense || data.driverLicenseOther);
    pushSlackField(slackFields, "How did you hear about us", leadSource);

    const coveredKeys = new Set([
      "company",
      "full_name",
      "email",
      "phone",
      "category",
      "position",
      "positionOther",
      "city",
      "numberOfPositions",
      "contractType",
      "startDate",
      "startDateOther",
      "hasRotation",
      "rotationWeeksOn",
      "rotationWeeksOff",
      "salary",
      "accommodation",
      "dNumber",
      "dNumberOther",
      "norwegianLevel",
      "englishLevel",
      "driverLicense",
      "driverLicenseOther",
      "howDidYouHear",
      "socialMediaPlatform",
      "socialMediaOther",
      "howDidYouHearOther",
      "referralCompanyName",
      "referralOrgNumber",
      "referralEmail",
      "website",
      "company_website",
      "honeypot",
    ]);

    for (const [key, value] of Object.entries(data)) {
      if (coveredKeys.has(key) || !hasValue(value)) continue;
      const label = key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
      pushSlackField(slackFields, label, value);
    }

    void notifySlack("employers", {
      title: "New Employer Request",
      fields: slackFields,
    });

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
