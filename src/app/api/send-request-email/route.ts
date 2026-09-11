import { NextRequest } from "next/server";
import { z } from "zod";
import { escapeHtml } from "@/lib/htmlSanitizer";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { getRateLimitResult, hasHoneypotValue, noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { notifyError } from "@/lib/errorNotifier";
import { logApiError } from "@/lib/secureLogger";
import { notifySlack } from "@/lib/slackNotifier";
import { buildArbeidmatchLetter, letterFacts, letterHeading, letterParagraph } from "@/lib/arbeidmatchEmailShell";
import { getOrCreateSubscription, isUnsubscribed } from "@/lib/emailSubscription";
import { roleDetailsEmailSection, roleDetailsFromRequest, stripRoleDetailsBlock } from "@/lib/request-role-details-email";
import {
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
    referenceId: z.string().trim().max(40).optional().or(z.literal("")),
    website: z.string().max(256).optional(),
    company_website: z.string().max(256).optional(),
    honeypot: z.string().max(256).optional(),
  })
  .passthrough();

/**
 * The labels of the internal copy, and their order, are read back by the ATS.
 *
 * The Gmail intake (ats-recruitment `src/lib/intake/form-notification-parser.ts`,
 * STACKED_LABELS) recognises this mail by its subject, "New candidate request:",
 * and finds each answer by the label in front of it. A label renamed here, or a
 * new one it does not know, runs into the value before it. Add a row only after
 * adding its label there.
 */
const INTERNAL_SECTIONS = ["Contact details", "Position details", "Conditions offered", "Location"] as const;
// After these comes "Role details" (11 September 2026), built in
// src/lib/request-role-details-email.ts from the labels in
// src/lib/request-role-questions.ts. It is last on purpose: its labels are new
// to the ATS, and a section it does not know yet must not sit between two it does.

/** The service the client chose (the ATS's own keys), in the words the form showed him. */
function serviceLabel(value: string): string {
  if (value === "staffing") return "Staffing (bemanning)";
  if (value === "recruitment") return "Recruitment";
  if (value === "advertising") return "Job advertising";
  return value;
}

/** The wizard stores the travel answer as a code; a letter says it in words. */
function travelLabel(value: string): string {
  if (value === "company_covered") return "Covered by the company";
  if (value === "own_responsibility") return "The candidate's own responsibility";
  return value;
}

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
    /**
     * Plain text, escaped once, at the point it enters HTML.
     *
     * This used to be `sanitizeStringRecord`, which HTML-escapes every value up
     * front. The letter escapes what it prints as well, so "Bygg & Anlegg AS"
     * reached the office as "Bygg &amp;amp; Anlegg AS", and the ATS intake stored
     * the company under that name. The values stay plain here; the letter escapes
     * them, and Slack gets the escaped form it always got, in pushSlackField.
     */
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawData)) {
      data[key] =
        typeof value === "string" ? value.trim() : typeof value === "number" || typeof value === "boolean" ? String(value) : "";
    }

    const categoryValue = data.category || data.industry || "";
    const numberOfPositionsValue = data.numberOfPositions || data.candidates || "";
    const contractTypeValue = data.contractType || data.contract_type || "";
    const cityValue = data.city || data.location || "";
    const selectedPosition =
      data.position === "Other" ? data.positionOther || "Other" : data.position || data.workerType || "";
    const selectedStartDate =
      data.startDate === "Other" ? data.startDateOther || "Other" : data.startDate || data.urgency || "";
    const leadSource =
      data.howDidYouHear === "Social media" && data.socialMediaPlatform === "Other"
        ? data.socialMediaOther || "Social media"
        : data.howDidYouHear === "Social media"
          ? `Social media (${data.socialMediaPlatform || "-"})`
          : data.howDidYouHear === "Other"
            ? data.howDidYouHearOther || "Other"
            : data.howDidYouHear;

    const transporter = createSmtpTransporter();
    if (!transporter) {
      return noStoreJson({ success: false, error: "SMTP is not configured." }, { status: 500 });
    }

    const hasValue = (value?: string) => value !== undefined && value !== null && String(value).trim() !== "";
    const pushSlackField = (fields: Record<string, string>, label: string, value?: string) => {
      if (!hasValue(value)) return;
      fields[label] = escapeHtml(String(value).trim());
    };
    const text = (value?: string) => (hasValue(value) ? String(value).trim() : "");

    const companyName = data.company ?? "Unknown company";
    const cityLabel = cityValue || "-";
    const referenceId = text(data.referenceId);
    // Job advertising only: the contact the advert will carry, in one line.
    const adContactLine =
      text(data.hiringType) === "advertising"
        ? [text(data.adContactName), text(data.adContactEmail), text(data.adContactPhone)].filter(Boolean).join(", ")
        : "";
    // What the client told us about the role: language, trade, and how the
    // assignment or the hiring is run. Rebuilt from the raw answers with our own
    // labels, never from text composed in the browser.
    const roleDetails = roleDetailsFromRequest({
      service: text(data.hiringType),
      industry: text(categoryValue),
      position: text(selectedPosition),
      answers: rawData.roleAnswers,
    });

    // The internal copy: to post@, read by the owner and by the ATS intake.
    const internalRows: Record<(typeof INTERNAL_SECTIONS)[number], { label: string; value: string }[]> = {
      "Contact details": [
        { label: "Company", value: text(data.company) },
        { label: "Org.nr", value: text(data.orgNumber) },
        { label: "Email", value: text(data.email) },
        { label: "Full name", value: text(data.full_name) },
        { label: "Phone", value: text(data.phone) },
      ],
      "Position details": [
        { label: "Category", value: text(categoryValue) },
        { label: "Position", value: text(selectedPosition) },
        { label: "Contract type", value: text(contractTypeValue) },
        { label: "Qualification", value: text(data.qualification) },
        { label: "Candidates needed", value: text(numberOfPositionsValue) },
        { label: "Certifications", value: text(data.certifications) },
        { label: "Urgency", value: text(selectedStartDate) },
      ],
      "Conditions offered": [
        { label: "Salary", value: text(data.salary) },
        { label: "Salary period", value: text(data.salaryPeriod) },
        { label: "Overtime", value: text(data.overtime) },
        { label: "Accommodation", value: text(data.accommodation) },
        { label: "Transport", value: travelLabel(text(data.internationalTravel || data.localTravel)) },
        { label: "Rotation", value: text(data.hasRotation) },
        { label: "Start date", value: text(selectedStartDate) },
      ],
      Location: [
        { label: "City", value: text(cityValue) },
        { label: "Region", value: text(data.localTravelOther || cityValue) },
        { label: "Additional notes", value: text(data.notes || data.job_summary || leadSource) },
      ],
    };
    const internalInner = [
      referenceId ? letterParagraph(`Reference: <strong>${escapeHtml(referenceId)}</strong>`) : "",
      // Above the first section on purpose: the ATS intake reads fields by the
      // labels inside the sections, and a line before them is not one of its fields.
      text(data.hiringType) ? letterParagraph(`Service: <strong>${escapeHtml(serviceLabel(text(data.hiringType)))}</strong>`) : "",
      adContactLine ? letterParagraph(`Contact on the advert: <strong>${escapeHtml(adContactLine)}</strong>`) : "",
      ...INTERNAL_SECTIONS.map((title) => {
        const facts = letterFacts(internalRows[title]);
        return facts ? `${letterHeading(title)}${facts}` : "";
      }),
      roleDetailsEmailSection(roleDetails.en),
    ].join("");

    const internalTitle = `New candidate request: ${companyName} from ${cityLabel}`;
    await transporter.sendMail({
      ...mailHeaders(),
      to: "post@arbeidmatch.no",
      subject: internalTitle,
      html: buildArbeidmatchLetter({
        title: internalTitle,
        innerHtml: internalInner,
        cta: { href: "https://ats.arbeidmatch.no/command-center/intake-proposals", label: "Open in the ATS" },
        lang: "en",
        internal: true,
        recipient: "post@arbeidmatch.no",
      }),
    });

    // The client's confirmation. The form is in English, so the letter is too.
    if (data.email && !(await isUnsubscribed(data.email))) {
      const unsubToken = await getOrCreateSubscription(data.email, "employer-request");
      const safeCo = escapeHtml(data.company || "your company");
      const clientInner = [
        letterParagraph(`Thank you, <strong>${safeCo}</strong>. We have received your request.`),
        letterFacts([
          { label: "Reference", value: referenceId },
          { label: "Service", value: serviceLabel(text(data.hiringType)) },
          { label: "Contact on the advert", value: adContactLine },
          { label: "Position", value: text(selectedPosition) },
          { label: "Number of candidates", value: text(numberOfPositionsValue) },
          { label: "Location", value: text(cityValue) },
          { label: "Preferred start", value: text(selectedStartDate) },
        ]),
        letterParagraph(
          "We analyse your request and send you a detailed offer by email for the service you chose, usually within 1 to 2 business days. If anything in the summary is wrong, reply to this email and we will correct it.",
        ),
      ].join("");
      await transporter.sendMail({
        ...mailHeaders(),
        to: data.email,
        subject: referenceId ? `We received your request - ${referenceId}` : "We received your request - ArbeidMatch",
        html: buildArbeidmatchLetter({
          title: "Request received",
          innerHtml: clientInner,
          lang: "en",
          recipient: data.email,
          unsubscribeUrl: `https://arbeidmatch.no/api/unsubscribe?token=${encodeURIComponent(unsubToken)}`,
        }),
      });
    }

    if (data.referralEmail && !(await isUnsubscribed(data.referralEmail))) {
      const referralUnsubToken = await getOrCreateSubscription(data.referralEmail, "employer-request");
      const safeRefCo = escapeHtml(data.company || "-");
      const referralInner = [
        letterParagraph("Thank you for recommending ArbeidMatch."),
        letterParagraph(`We received a request from <strong>${safeRefCo}</strong>, and they mentioned your recommendation.`),
        letterParagraph("If we can support your own hiring in the future, we would be glad to help."),
      ].join("");
      await transporter.sendMail({
        ...mailHeaders(),
        to: data.referralEmail,
        subject: "Thank you for the referral - ArbeidMatch",
        html: buildArbeidmatchLetter({
          title: "Thank you for the referral",
          innerHtml: referralInner,
          lang: "en",
          recipient: data.referralEmail,
          unsubscribeUrl: `https://arbeidmatch.no/api/unsubscribe?token=${encodeURIComponent(referralUnsubToken)}`,
        }),
      });
    }

    /**
     * The owner's message on Slack, in Romanian.
     *
     * HIS INSTRUCTION, 10 September 2026: the Slack messages he receives are in
     * Romanian. The old card was English, and it printed every field the wizard
     * sent under its code name: "Token", "Phone Prefix", "Salary Mode", the
     * salary three times, "has_d_number", "company_covered". Now an explicit
     * list, in the order he reads a request, with the coded answers in words.
     * The client's own free text (the requirements he wrote) stays as he wrote it.
     */
    const ro = (value: string, words: Record<string, string>) => words[value] ?? value;
    const slackFields: Record<string, string> = {};
    pushSlackField(slackFields, "Referință", referenceId);
    pushSlackField(slackFields, "Serviciu", ro(text(data.hiringType), { staffing: "Staffing (bemanning)", recruitment: "Recrutare", advertising: "Anunț de angajare" }));
    pushSlackField(slackFields, "Firmă", data.company);
    pushSlackField(slackFields, "Nr. org.", data.orgNumber);
    pushSlackField(slackFields, "Persoană de contact", data.full_name);
    pushSlackField(slackFields, "Email", data.email);
    pushSlackField(slackFields, "Telefon", data.phone);
    pushSlackField(slackFields, "Contact pe anunț", adContactLine);
    pushSlackField(slackFields, "Domeniu", categoryValue);
    pushSlackField(slackFields, "Post", selectedPosition);
    pushSlackField(slackFields, "Oraș", cityValue);
    pushSlackField(slackFields, "Număr de oameni", numberOfPositionsValue);
    pushSlackField(slackFields, "Tip contract", ro(text(contractTypeValue), { "Permanent employment": "Angajare permanentă", "Temporary hire": "Angajare temporară", "Project-based": "Pe proiect" }));
    pushSlackField(slackFields, "Început", ro(text(selectedStartDate), { Immediate: "Imediat" }));
    pushSlackField(
      slackFields,
      "Salariu",
      text(data.salary)
        ? `${text(data.salary)} NOK${text(data.salaryPeriod) === "Per month" ? " / lună" : text(data.salaryPeriod) === "Per hour" ? " / oră" : ""}`
        : "",
    );
    pushSlackField(slackFields, "Experiență", data.qualification);
    pushSlackField(slackFields, "Permis de conducere", ro(text(data.driverLicense || data.driverLicenseOther), { "No driving license required": "Nu e necesar" }));
    pushSlackField(slackFields, "D-nummer", ro(text(data.dNumber || data.dNumberOther), { has_d_number: "Are deja D-nummer", we_handle: "Ne ocupăm noi de procedură" }));
    pushSlackField(slackFields, "Cazare", ro(text(data.accommodation), { "Candidate finds own": "Își găsește singur", "We help find accommodation": "Ajutăm noi să găsească" }));
    pushSlackField(slackFields, "Călătoria internațională", ro(text(data.internationalTravel), { company_covered: "Plătită de firmă", own_responsibility: "Pe cont propriu" }));
    pushSlackField(slackFields, "Transport local", ro(text(data.localTravel), { Covered: "Asigurat", "Not covered": "Neasigurat" }));
    pushSlackField(slackFields, "Certificări", data.certifications);
    for (const row of roleDetails.ro) pushSlackField(slackFields, row.label, row.value);
    pushSlackField(slackFields, "Cerințe (scrise de client)", stripRoleDetailsBlock(data.requirements || data.notes || "", roleDetails.en));
    pushSlackField(slackFields, "Cum a aflat de noi", leadSource);
    pushSlackField(slackFields, "Recomandat de", data.referralCompanyName);
    pushSlackField(slackFields, "Vrea noutăți despre candidați", data.subscribe ? "Da" : "");
    pushSlackField(slackFields, "Deschide în ATS", "https://ats.arbeidmatch.no/command-center/intake-proposals");

    void notifySlack("employers", {
      title: "Cerere nouă de la un angajator",
      fields: slackFields,
    });

    return noStoreJson({ success: true });
  } catch (error) {
    console.error("[/api/send-request-email] failed to send email", error);
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
