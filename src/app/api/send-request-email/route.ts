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
import { realContactValue } from "@/lib/request-contact-placeholders";
import { roleDetailsEmailSection, roleDetailsFromRequest, stripRoleDetailsBlock } from "@/lib/request-role-details-email";
import { contactRoleFrom, notesLists } from "@/lib/request-notes-sections";
import { positionNb } from "@/lib/request-position-nb";
import { clientReceiptSections, REQUEST_RECEIPT_FROM, REQUEST_RECEIPT_REPLY_TO } from "@/lib/request-client-receipt";
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
  if (value === "sourcing") return "Sourcing";
  if (value === "advertising") return "Job advertising";
  return value;
}

/** The wizard stores the travel answer as a code; a letter says it in words. */
function travelLabel(value: string): string {
  if (value === "company_covered") return "Covered by the company";
  if (value === "own_responsibility") return "The candidate's own responsibility";
  return value;
}

/** The D-number answer is a code too. */
function dNumberLabel(value: string, other: string): string {
  if (value === "has_d_number") return "Already has a D-number";
  if (value === "we_handle") return "We can handle the procedure";
  return other || value;
}

/**
 * The person a client answers to after sending a request (the owner, 24
 * September 2026: "Mirel Manoliu contact person", not "Kontoret"). The same
 * person the ATS names on its first letters to a firm.
 */
const REQUEST_CONTACT_PERSON = { name: "Mirel Manoliu", phone: "+47 967 34 730", email: "mirel@arbeidmatch.no" };

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

    const companyName = realContactValue(data.company) || "Unknown company";
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

    // Placeholders from old request tokens ("To be completed", "Employer
    // Request", "000000") are not answers and are never printed.
    const companyReal = realContactValue(data.company);
    const fullNameReal = realContactValue(data.full_name);
    const phoneReal = realContactValue(data.phone);
    // Only when it says something the city does not: it used to repeat the city.
    const regionValue = text(data.localTravelOther);
    const regionDiffers = regionValue !== "" && regionValue.toLowerCase() !== text(cityValue).toLowerCase();
    // What the client wrote in the free-text field, and nothing else. The
    // wizard's `notes` is a dump of every answer, already printed above it.
    const clientNote = text(data.clientNote);
    // The lists the wizard keeps only inside its notes, and the contact's role
    // it keeps only inside the requirements: everything the client filled in
    // reaches the office copy (his ask, 24 September 2026). A request becomes an
    // advert later, so nothing the client answered may stop at the website.
    const lists = notesLists(data.notes || data.requirements);
    const contactRole = contactRoleFrom(data.requirements);
    const accommodationCost = text(data.accommodationCost || data.accommodationOther);

    // The internal copy: to post@, read by the owner and by the ATS intake.
    const internalRows: Record<(typeof INTERNAL_SECTIONS)[number], { label: string; value: string }[]> = {
      "Contact details": [
        { label: "Company", value: companyReal },
        { label: "Org.nr", value: text(data.orgNumber) },
        { label: "Email", value: text(data.email) },
        { label: "Full name", value: fullNameReal },
        { label: "Contact's role", value: contactRole },
        { label: "Phone", value: phoneReal },
      ],
      "Position details": [
        { label: "Category", value: text(categoryValue) },
        { label: "Position", value: text(selectedPosition) },
        { label: "Job summary", value: text(data.job_summary) },
        { label: "Contract type", value: text(contractTypeValue) },
        { label: "Qualification", value: text(data.qualification) },
        { label: "Candidates needed", value: text(numberOfPositionsValue) },
        { label: "Certifications", value: text(data.certifications) },
        { label: "Driving licence", value: text(data.driverLicense || data.driverLicenseOther) },
        { label: "D-number", value: dNumberLabel(text(data.dNumber), text(data.dNumberOther)) },
        { label: "Work tasks", value: lists.workTasks.join("; ") },
        { label: "Personal qualities", value: lists.personalQualities.join(", ") },
      ],
      "Conditions offered": [
        { label: "Salary", value: text(data.salary) },
        { label: "Salary period", value: text(data.salaryPeriod) },
        { label: "Overtime", value: text(data.overtime) },
        { label: "Accommodation", value: text(data.accommodation) },
        { label: "Accommodation cost", value: accommodationCost },
        // Two separate answers in the form, and two rows here (his correction,
        // 24 September 2026): one "Transport" row printed only one of them.
        { label: "Local travel", value: text(data.localTravel === "Other" ? data.localTravelOther : data.localTravel) },
        { label: "International travel", value: travelLabel(text(data.internationalTravel)) },
        {
          label: "Rotation",
          value:
            text(data.hasRotation) === "Yes" && text(data.rotationWeeksOn)
              ? `${text(data.rotationWeeksOn)} weeks on / ${text(data.rotationWeeksOff) || "?"} weeks off`
              : text(data.hasRotation),
        },
        { label: "We offer", value: lists.weOffer.join(", ") },
        // One row for when to start. "Urgency" printed the same value a second time.
        { label: "Start date", value: text(selectedStartDate) },
      ],
      Location: [
        { label: "City", value: text(cityValue) },
        { label: "Region", value: regionDiffers ? regionValue : "" },
      ],
    };
    const internalInner = [
      referenceId ? letterParagraph(`Reference: <strong>${escapeHtml(referenceId)}</strong>`) : "",
      // Above the first section on purpose: the ATS intake reads fields by the
      // labels inside the sections, and a line before them is not one of its fields.
      text(data.hiringType) ? letterParagraph(`Service: <strong>${escapeHtml(serviceLabel(text(data.hiringType)))}</strong>`) : "",
      data.requesterKind === "agency" ? letterParagraph("Requester: <strong>Staffing or recruitment agency</strong>") : "",
      adContactLine ? letterParagraph(`Contact on the advert: <strong>${escapeHtml(adContactLine)}</strong>`) : "",
      // Above the sections for the same reason: "Additional notes" is not a label
      // the intake knows, so inside a section its text ran into the city.
      clientNote ? letterParagraph(`Client's note: ${escapeHtml(clientNote).replace(/\r?\n/g, "<br/>")}`) : "",
      text(leadSource)
        ? letterParagraph(
            `How they found us: ${escapeHtml(text(leadSource) === "presentation" ? "the presentation we sent them (opened from its button)" : text(leadSource))}`,
          )
        : "",
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
        // Not the subject again: the inbox already shows it right above.
        title: "Request details",
        innerHtml: internalInner,
        cta: { href: "https://ats.arbeidmatch.no/command-center/intake-proposals", label: "Open in the ATS" },
        lang: "en",
        internal: true,
        recipient: "post@arbeidmatch.no",
      }),
    });

    // The client's confirmation, in Norwegian: the client is a Norwegian
    // employer (the owner's rule for letters to clients). The values he chose
    // in the wizard stay as he chose them; only our own words are translated.
    if (data.email && !(await isUnsubscribed(data.email))) {
      // The whole order, under the office copy's own headings, in Norwegian
      // (his correction, 25 September 2026: "comanda toata nu doar partiala").
      // Every value here is the one the office copy prints, so the two letters
      // cannot disagree about what was ordered.
      const receipt = clientReceiptSections({
        referenceId,
        service: text(data.hiringType),
        requesterKind: text(data.requesterKind),
        adContactLine,
        company: companyReal,
        orgNumber: text(data.orgNumber),
        email: text(data.email),
        fullName: fullNameReal,
        contactRole,
        phone: phoneReal,
        category: text(categoryValue),
        // Norwegian, like the rest of the letter: it used to say "Stilling: Carpenter".
        position: positionNb(text(selectedPosition)),
        jobSummary: text(data.job_summary),
        contractType: text(contractTypeValue),
        qualification: text(data.qualification),
        candidatesNeeded: text(numberOfPositionsValue),
        certifications: text(data.certifications),
        drivingLicence: text(data.driverLicense || data.driverLicenseOther),
        dNumber: text(data.dNumber) || text(data.dNumberOther),
        workTasks: lists.workTasks,
        personalQualities: lists.personalQualities,
        salary: text(data.salary),
        salaryPeriod: text(data.salaryPeriod),
        overtime: text(data.overtime),
        accommodation: text(data.accommodation),
        accommodationCost,
        localTravel: text(data.localTravel === "Other" ? data.localTravelOther : data.localTravel),
        internationalTravel: text(data.internationalTravel),
        rotation:
          text(data.hasRotation) === "Yes" && text(data.rotationWeeksOn)
            ? `${text(data.rotationWeeksOn)} weeks on / ${text(data.rotationWeeksOff) || "?"} weeks off`
            : text(data.hasRotation),
        weOffer: lists.weOffer,
        startDate: text(selectedStartDate),
        city: text(cityValue),
        region: regionDiffers ? regionValue : "",
        roleDetails: roleDetails.en,
        clientNote,
      });
      const clientInner = [
        letterParagraph(
          companyReal
            ? `Takk, <strong>${escapeHtml(companyReal)}</strong>. Vi har mottatt forespørselen deres. Her er alt dere sendte oss.`
            : "Takk. Vi har mottatt forespørselen deres. Her er alt dere sendte oss.",
        ),
        ...receipt.map((section) => {
          const facts = letterFacts(section.rows);
          return facts ? `${letterHeading(section.heading)}${facts}` : "";
        }),
        // The one place this letter asks for a reply: the footer no longer says it too.
        letterParagraph(
          "Vi går gjennom forespørselen og sender dere et detaljert tilbud på e-post for tjenesten dere valgte, vanligvis innen 1 til 2 virkedager. Er noe i oppsummeringen feil, svar på denne e-posten, så retter vi det.",
        ),
      ].join("");
      await transporter.sendMail({
        // From the office, not from no-reply: the letter asks for a reply, and
        // the reply must land where the order is read (25 September 2026).
        from: REQUEST_RECEIPT_FROM,
        replyTo: REQUEST_RECEIPT_REPLY_TO,
        to: data.email,
        subject: referenceId ? `Vi har mottatt forespørselen - ${referenceId}` : "Vi har mottatt forespørselen - ArbeidMatch",
        html: buildArbeidmatchLetter({
          title: "Forespørselen er mottatt",
          innerHtml: clientInner,
          lang: "no",
          recipient: data.email,
          contactPerson: REQUEST_CONTACT_PERSON,
          // The receipt of her own request: a service letter, no unsubscribe link.
          serviceLetter: true,
        }),
      });
    }

    if (data.referralEmail && !(await isUnsubscribed(data.referralEmail))) {
      const referralUnsubToken = await getOrCreateSubscription(data.referralEmail, "employer-request");
      const referralInner = [
        letterParagraph("Takk for at dere anbefalte ArbeidMatch."),
        letterParagraph(
          companyReal
            ? `Vi har mottatt en forespørsel fra <strong>${escapeHtml(companyReal)}</strong>, og de nevnte anbefalingen deres.`
            : "Vi har mottatt en forespørsel der anbefalingen deres ble nevnt.",
        ),
        letterParagraph("Kan vi hjelpe dere med egne ansettelser senere, gjør vi det gjerne."),
      ].join("");
      await transporter.sendMail({
        ...mailHeaders(),
        to: data.referralEmail,
        subject: "Takk for anbefalingen - ArbeidMatch",
        html: buildArbeidmatchLetter({
          title: "Takk for anbefalingen",
          innerHtml: referralInner,
          lang: "no",
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
    pushSlackField(slackFields, "Serviciu", ro(text(data.hiringType), { staffing: "Staffing (bemanning)", recruitment: "Recrutare", sourcing: "Sourcing", advertising: "Anunț de angajare" }));
    pushSlackField(
      slackFields,
      "Tip firmă",
      data.requesterKind === "agency" ? "Agenție de bemanning sau recrutare" : data.requesterKind === "own_operation" ? "Angajează pentru propria activitate" : "",
    );
    pushSlackField(slackFields, "Firmă", companyReal);
    pushSlackField(slackFields, "Nr. org.", data.orgNumber);
    pushSlackField(slackFields, "Persoană de contact", fullNameReal);
    pushSlackField(slackFields, "Email", data.email);
    pushSlackField(slackFields, "Telefon", phoneReal);
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
