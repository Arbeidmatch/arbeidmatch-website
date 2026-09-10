import {
  buildArbeidmatchLetter,
  letterCode,
  letterFacts,
  letterHeading,
  letterNote,
  letterParagraph,
  letterPre,
} from "@/lib/arbeidmatchEmailShell";
import { escapeHtml } from "@/lib/htmlSanitizer";

/**
 * Every letter the website sends, apart from the request form (send-request-email)
 * and the non-EU guide (nonEuLeadEmail.ts), in the ArbeidMatch letter.
 *
 * WHY THEY ARE HERE AND NOT IN THE ROUTES. The owner said on 10 September 2026
 * that the site's mail does not line up with our emails, and it did not: it went
 * out in two looks of its own, a navy one and a gold band, and neither was the
 * letter the ATS sends. Each builder takes plain data and returns the subject and
 * the whole letter, so what a preview renders is what the route sends.
 *
 * WHAT EACH ONE KEEPS. Its subject, its language (all English today, because
 * every form on the site is), its words, and its way off the list. What changed
 * is the envelope, the white ground, and the button: one at most, and only where
 * there is somewhere to go. Values are passed unescaped; the helpers escape them.
 */

export type Letter = { subject: string; html: string };

const EN = "en" as const;
const INTAKE_PROPOSALS = "https://ats.arbeidmatch.no/command-center/intake-proposals";

// ---------------------------------------------------------------------------
// /api/contact
// ---------------------------------------------------------------------------

/**
 * The contact form, to post@ (or support@ for a support request).
 *
 * THE ATS READS THIS ONE BACK. Its Gmail intake (ats-recruitment
 * `src/lib/intake/form-notification-parser.ts`, CONTACT_LABELS) recognises the
 * mail by the subject "New contact message:" and finds each answer by the label
 * in front of it, so the subject and the five labels, in this order, are fixed.
 * The title carries none of those labels on purpose: the old one said "Contact
 * message:", and the parser took that "message" for the Message field, first
 * occurrence wins. The button label and the contact box after the last field are
 * both in the parser's NOISE, which is what ends the Message value.
 */
export function contactNoticeLetter(args: {
  name: string;
  company: string;
  email: string;
  need: string;
  message: string;
  isSupport: boolean;
  to: string;
}): Letter {
  return {
    subject: `${args.isSupport ? "Support request" : "New contact message"}: ${args.name} from ${args.company}`,
    html: buildArbeidmatchLetter({
      title: args.isSupport ? "Support request from the website" : "Contact form on arbeidmatch.no",
      innerHtml: letterFacts([
        { label: "Name", value: args.name },
        { label: "Company", value: args.company },
        { label: "Email", value: args.email },
        { label: "Request type", value: args.need },
        { label: "Message", value: args.message },
      ]),
      // A contact message becomes an intake proposal in the ATS; a support request does not.
      cta: args.isSupport ? null : { href: INTAKE_PROPOSALS, label: "Open in the ATS" },
      lang: EN,
      internal: true,
      recipient: args.to,
    }),
  };
}

/** The sender's receipt. It used to end in a button asking for feedback on a message just sent. */
export function contactReceiptLetter(args: { name: string; need: string; to: string; unsubscribeUrl: string }): Letter {
  return {
    subject: "We received your message - ArbeidMatch",
    html: buildArbeidmatchLetter({
      title: "We received your message",
      innerHtml: [
        letterParagraph(`Hi ${escapeHtml(args.name)},`),
        letterParagraph("Thank you for contacting us. We received your message and will respond shortly."),
        letterFacts([{ label: "Request type", value: args.need }]),
      ].join(""),
      lang: EN,
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// /api/app-waitlist, /api/feature-waitlist
// ---------------------------------------------------------------------------

export function appWaitlistLetter(args: { to: string; unsubscribeUrl: string }): Letter {
  const subject = "You are on the ArbeidMatch App waitlist";
  return {
    subject,
    html: buildArbeidmatchLetter({
      title: subject,
      innerHtml: [
        letterParagraph("Hi there,"),
        letterParagraph(
          "You are on the list. We will notify you as soon as the ArbeidMatch app is available on iOS and Android.",
        ),
        letterHeading("In development"),
        letterParagraph("We are building something great and you will be among the first to know."),
      ].join(""),
      cta: { href: "https://arbeidmatch.no", label: "Visit ArbeidMatch" },
      lang: EN,
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

/** The feature arrives as a slug ("pricing-starter"), which is why the letter says "this feature". */
export function featureWaitlistLetter(args: { to: string; unsubscribeUrl: string }): Letter {
  return {
    subject: "You are on the waitlist",
    html: buildArbeidmatchLetter({
      title: "You are on the list",
      innerHtml: [
        letterParagraph(
          "You will be among the first to know when this feature launches. We are building something worth waiting for.",
        ),
        letterNote("No action needed. We will reach out directly when access becomes available for your account."),
      ].join(""),
      lang: EN,
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// /api/candidate-interest
// ---------------------------------------------------------------------------

export function candidateInterestNoticeLetter(args: {
  candidateId: string;
  role: string;
  partnerDomain: string;
  timestamp: string;
}): Letter {
  return {
    subject: `New candidate interest - ${args.role}`,
    html: buildArbeidmatchLetter({
      title: "A partner is interested in a candidate",
      innerHtml: [
        letterParagraph("A partner expressed interest in a candidate profile."),
        letterFacts([
          { label: "Candidate ID", value: args.candidateId },
          { label: "Role", value: args.role },
          { label: "Partner", value: args.partnerDomain },
          { label: "Time (ISO)", value: args.timestamp },
        ]),
      ].join(""),
      lang: EN,
      internal: true,
      recipient: "post@arbeidmatch.no",
    }),
  };
}

// ---------------------------------------------------------------------------
// /api/candidate-join-network
// ---------------------------------------------------------------------------

/**
 * The notice to cv@. The ATS inbox evaluation keeps this subject as its example
 * of our own system mail that mentions a candidate and is not a CV, so the
 * subject and the opening words stay as they were.
 */
export function verifiedProfileNoticeLetter(args: { email: string; timestamp: string }): Letter {
  return {
    subject: `Verified profile request: ${args.email}`,
    html: buildArbeidmatchLetter({
      title: "Verified profile request",
      innerHtml: letterFacts([
        { label: "Candidate email", value: args.email },
        { label: "EU/EEA passport confirmed", value: "yes" },
        { label: "GDPR consent confirmed", value: "yes" },
        { label: "Timestamp", value: args.timestamp },
      ]),
      lang: EN,
      internal: true,
      recipient: "cv@arbeidmatch.no",
    }),
  };
}

/** The link that was in the text is the button now: one way to the platform, not a link in a sentence. */
export function profileRequestLetter(args: { to: string; unsubscribeUrl: string }): Letter {
  return {
    subject: "Continue your ArbeidMatch profile request",
    html: buildArbeidmatchLetter({
      title: "Continue your profile request",
      innerHtml: [
        letterParagraph(
          "You are receiving this email because you, or someone who entered your email address, requested to create a candidate profile with ArbeidMatch.",
        ),
        letterParagraph("If this was you, continue your request by creating your profile in our recruitment portal."),
        letterParagraph(
          "This confirmation step helps us reduce false accounts and make sure we handle personal data in accordance with GDPR. If you did not make this request, you can safely ignore this email.",
        ),
      ].join(""),
      cta: { href: "https://jobs.arbeidmatch.no/sign-up", label: "Create your profile" },
      lang: EN,
      audience: "candidate",
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// /api/confirmation-feedback, /api/site-feedback
// ---------------------------------------------------------------------------

export function feedbackNoticeLetter(args: {
  score: number;
  source: string;
  purpose: string;
  pageUrl: string;
  submittedAt: string;
  email: string;
  note: string;
}): Letter {
  const subject = `New feedback: ${args.score}/10 from ${args.source}`;
  return {
    subject,
    html: buildArbeidmatchLetter({
      title: subject,
      innerHtml: letterFacts([
        { label: "Source", value: args.source },
        { label: "Purpose", value: args.purpose },
        { label: "Page URL", value: args.pageUrl },
        { label: "Score", value: `${args.score}/10` },
        { label: "Submitted (CET)", value: args.submittedAt },
        { label: "Email", value: args.email || "-" },
        { label: "Note", value: args.note },
      ]),
      lang: EN,
      internal: true,
      recipient: "post@arbeidmatch.no",
    }),
  };
}

/** The eligibility check's feedback comes from candidates, so the contact box gives them cv@. */
export function feedbackReceiptLetter(args: { score: number; source: string; to: string; unsubscribeUrl: string }): Letter {
  return {
    subject: "Thank you for your feedback - ArbeidMatch",
    html: buildArbeidmatchLetter({
      title: "Thank you for your feedback",
      innerHtml: [
        letterParagraph("Thank you for sharing your feedback."),
        letterParagraph(`We received your score: <strong>${args.score}/10</strong>.`),
        letterParagraph(`Source: <strong>${escapeHtml(args.source)}</strong>`),
      ].join(""),
      lang: EN,
      audience: "candidate",
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

export function siteFeedbackNoticeLetter(args: {
  rating: number;
  email: string;
  source: string;
  submittedAt: string;
  siteRelated: string;
  category: string;
  note: string;
  issueDetails: string;
}): Letter {
  const subject = `New site feedback: ${args.rating}/10 from ${args.email}`;
  return {
    subject,
    html: buildArbeidmatchLetter({
      title: subject,
      innerHtml: letterFacts([
        { label: "Rating", value: `${args.rating}/10` },
        { label: "Email", value: args.email },
        { label: "Source", value: args.source },
        { label: "Submitted (CET)", value: args.submittedAt },
        { label: "Related to website", value: args.siteRelated || "-" },
        { label: "Category", value: args.category || "-" },
        { label: "Improvement note", value: args.note || "-" },
        { label: "Issue details", value: args.issueDetails || "-" },
      ]),
      lang: EN,
      internal: true,
      recipient: "post@arbeidmatch.no",
    }),
  };
}

export function siteFeedbackReceiptLetter(args: { rating: number; to: string; unsubscribeUrl: string }): Letter {
  return {
    subject: "Thank you for your feedback - ArbeidMatch",
    html: buildArbeidmatchLetter({
      title: "Thank you for your feedback",
      innerHtml: [
        letterParagraph("Thank you for sharing your feedback with us."),
        letterParagraph(`We received your rating: <strong>${args.rating}/10</strong>.`),
        letterParagraph("Your input helps us improve the candidate and employer experience."),
      ].join(""),
      lang: EN,
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// /api/guide-interest-signup
// ---------------------------------------------------------------------------

/**
 * Unsigned now. It ended "Best regards, ArbeidMatch Team, support@", and the ATS
 * rule is that a letter with no person to sign it is signed by nobody rather
 * than by a team, and that a candidate is sent to cv@, which the box says.
 */
export function guideInterestLetter(args: {
  specialty: string;
  guideWanted: boolean;
  to: string;
  unsubscribeUrl: string;
}): Letter {
  const subject = "You are registered with ArbeidMatch";
  return {
    subject,
    html: buildArbeidmatchLetter({
      title: subject,
      innerHtml: [
        letterParagraph("Hi, thank you for registering your interest with ArbeidMatch."),
        letterParagraph(`We have noted your profile as: <strong>${escapeHtml(args.specialty)}</strong>.`),
        letterParagraph("We will contact you personally when we have a matching opportunity in Norway."),
        args.guideWanted
          ? letterParagraph("We will also notify you when the guide for your profession becomes available.")
          : "",
      ].join(""),
      lang: EN,
      audience: "candidate",
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// /api/legal-request
// ---------------------------------------------------------------------------

export function legalRequestNoticeLetter(args: {
  requestType: string;
  fullName: string;
  email: string;
  identityVerification: string | null;
  message: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  reference: string;
  rowId: string;
}): Letter {
  return {
    subject: `[Legal Request] ${args.requestType} from ${args.fullName}`,
    html: buildArbeidmatchLetter({
      title: "Legal request",
      innerHtml: [
        letterFacts([
          { label: "Reference", value: args.reference },
          { label: "Request type", value: args.requestType },
          { label: "Full name", value: args.fullName },
          { label: "Email", value: args.email },
          { label: "Identity verification", value: args.identityVerification ?? "(none)" },
        ]),
        letterHeading("Message"),
        letterPre(args.message),
        letterFacts([
          { label: "IP", value: args.ip },
          { label: "User agent", value: args.userAgent },
          { label: "Timestamp", value: args.timestamp },
          { label: "Row id", value: args.rowId },
        ]),
      ].join(""),
      lang: EN,
      internal: true,
      recipient: "legal@arbeidmatch.no",
    }),
  };
}

/** Written from legal@, so the box sends the reader back to legal@ rather than to the office inbox. */
export function legalRequestReceiptLetter(args: {
  fullName: string;
  requestType: string;
  reference: string;
  timestamp: string;
  to: string;
  unsubscribeUrl: string;
}): Letter {
  return {
    subject: "We received your legal request - ArbeidMatch",
    html: buildArbeidmatchLetter({
      title: "We received your legal request",
      innerHtml: [
        letterParagraph(`Dear ${escapeHtml(args.fullName)},`),
        letterParagraph(`We confirm receipt of your legal request submitted on ${escapeHtml(args.timestamp)}.`),
        letterFacts([
          { label: "Request type", value: args.requestType },
          { label: "Reference number", value: args.reference },
        ]),
        letterParagraph(
          "We will respond within 30 days as required by GDPR Article 12(3). If we need additional information to verify your identity, we will contact you at this email address.",
        ),
        letterParagraph("If you did not submit this request, please reply to this email immediately."),
        letterNote(
          `How we handle personal data is described in our <a href="https://www.arbeidmatch.no/privacy" style="color:#a8871f;">privacy policy</a>.`,
        ),
      ].join(""),
      lang: EN,
      contactEmail: "legal@arbeidmatch.no",
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// /api/non-eu-lead (the lead's own letter is nonEuLeadEmail.ts)
// ---------------------------------------------------------------------------

export function nonEuLeadNoticeLetter(args: { firstName: string; email: string }): Letter {
  return {
    subject: `New Non-EU Lead: ${args.firstName} ${args.email}`,
    html: buildArbeidmatchLetter({
      title: "New Non-EU lead",
      innerHtml: letterFacts([
        { label: "Name", value: args.firstName },
        { label: "Email", value: args.email },
      ]),
      lang: EN,
      internal: true,
      recipient: "post@arbeidmatch.no",
    }),
  };
}

// ---------------------------------------------------------------------------
// /api/partner-request, /api/partner-request/start, /api/slack/interactions
// ---------------------------------------------------------------------------

/** Decided in Slack, where the approve and reject buttons are, so the letter has none. */
export function partnerRequestNoticeLetter(args: {
  companyName: string;
  email: string;
  orgNumber: string;
  phone: string;
  contact: string;
  requestId: string;
}): Letter {
  return {
    subject: `New Partner Request: ${args.companyName}`,
    html: buildArbeidmatchLetter({
      title: "New partner request",
      innerHtml: letterFacts([
        { label: "Company", value: args.companyName },
        { label: "Email", value: args.email },
        { label: "Org Number", value: args.orgNumber },
        { label: "Phone", value: args.phone },
        { label: "Contact", value: args.contact },
        { label: "Request ID", value: args.requestId },
      ]),
      lang: EN,
      internal: true,
      recipient: "post@arbeidmatch.no",
    }),
  };
}

export function partnerApplicationLinkLetter(args: {
  applicationUrl: string;
  to: string;
  unsubscribeUrl: string;
}): Letter {
  return {
    subject: "Complete your ArbeidMatch partner application",
    html: buildArbeidmatchLetter({
      title: "Complete your application",
      innerHtml: [
        letterParagraph("Click the button below to continue your partner application with ArbeidMatch."),
        letterNote(
          "This link is confidential and intended only for your company account. For security reasons, it is valid for 30 minutes.",
        ),
        letterNote("If you did not request this, you can ignore this email."),
      ].join(""),
      cta: { href: args.applicationUrl, label: "Continue application" },
      lang: EN,
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

export function partnerApprovedLetter(args: { accessUrl: string; to: string; unsubscribeUrl: string }): Letter {
  return {
    subject: "Your ArbeidMatch partner access is ready",
    html: buildArbeidmatchLetter({
      title: "Welcome to ArbeidMatch",
      innerHtml: [
        letterParagraph(
          "Your partner account has been approved. Click below to access candidate profiles and submit your first request.",
        ),
        letterNote("This link is valid for 24 hours."),
      ].join(""),
      cta: { href: args.accessUrl, label: "Access Platform" },
      lang: EN,
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

export function partnerContactedLetter(args: { to: string; unsubscribeUrl: string }): Letter {
  return {
    subject: "We received your ArbeidMatch partner request",
    html: buildArbeidmatchLetter({
      title: "We will be in touch",
      innerHtml: letterParagraph(
        "Thank you for your interest in becoming an ArbeidMatch partner. Our team will review your request and contact you within 1 to 2 business days.",
      ),
      lang: EN,
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

export function partnerRejectedLetter(args: { to: string; unsubscribeUrl: string }): Letter {
  return {
    subject: "Your ArbeidMatch partner request",
    html: buildArbeidmatchLetter({
      title: "Thank you for your interest",
      innerHtml: letterParagraph(
        "After reviewing your request, we are unable to offer partner access at this time. You are welcome to reapply in the future, or reply to this email if you would like to know more.",
      ),
      lang: EN,
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// /api/recruiter-network/apply
// ---------------------------------------------------------------------------

export function recruiterApplicationReceiptLetter(args: {
  fullName: string;
  country: string;
  region: string;
  partnerType: string;
  monthlyReach: string;
  to: string;
  unsubscribeUrl: string;
}): Letter {
  return {
    subject: "We received your application - ArbeidMatch Recruiter Network",
    html: buildArbeidmatchLetter({
      title: "We received your application",
      innerHtml: [
        letterParagraph(`Hi ${escapeHtml(args.fullName)},`),
        letterParagraph("Thank you for applying to the ArbeidMatch Recruiter Network."),
        letterFacts([
          { label: "Name", value: args.fullName },
          { label: "Country", value: args.country },
          { label: "Region", value: args.region },
          { label: "Partner type", value: args.partnerType },
          { label: "Monthly reach", value: args.monthlyReach },
        ]),
        letterParagraph("Our team will review your application and contact you within 48 hours."),
        letterParagraph("We look forward to potentially building together."),
      ].join(""),
      cta: { href: "https://arbeidmatch.no", label: "Visit ArbeidMatch" },
      lang: EN,
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

export function recruiterApplicationNoticeLetter(args: {
  fullName: string;
  email: string;
  country: string;
  region: string;
  partnerType: string;
  profileUrl: string;
  monthlyReach: string;
  company: string;
  motivation: string;
}): Letter {
  const subject = `New Recruiter Network application: ${args.fullName} from ${args.country}`;
  return {
    subject,
    html: buildArbeidmatchLetter({
      title: subject,
      innerHtml: letterFacts([
        { label: "Full name", value: args.fullName },
        { label: "Email", value: args.email },
        { label: "Country", value: args.country },
        { label: "Region / city", value: args.region },
        { label: "Partner type", value: args.partnerType },
        { label: "Profile URL", value: args.profileUrl },
        { label: "Monthly reach", value: args.monthlyReach },
        { label: "ENK / AS", value: args.company },
        { label: "Motivation", value: args.motivation || "None provided" },
      ]),
      lang: EN,
      internal: true,
      recipient: "post@arbeidmatch.no",
    }),
  };
}

// ---------------------------------------------------------------------------
// /api/simple-request
// ---------------------------------------------------------------------------

export function candidateRequestLinkLetter(args: {
  jobSummary: string;
  linkUrl: string;
  to: string;
  unsubscribeUrl: string;
}): Letter {
  return {
    subject: "Your candidate request link - ArbeidMatch",
    html: buildArbeidmatchLetter({
      title: "Complete your candidate request",
      innerHtml: [
        letterParagraph(
          "Thank you for your interest in ArbeidMatch. Click the button below to complete your request details.",
        ),
        letterParagraph(`Selected role: <strong>${escapeHtml(args.jobSummary)}</strong>`),
        letterNote(`If the button below does not work, copy this link: ${escapeHtml(args.linkUrl)}`),
        letterNote("This link expires in 24 hours. If you did not request this, please ignore this email."),
      ].join(""),
      cta: { href: args.linkUrl, label: "Complete your request" },
      lang: EN,
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

// ---------------------------------------------------------------------------
// /api/send-eligibility-assistance, /api/verify-notification-email
// ---------------------------------------------------------------------------

/** One button, the one that matters. The second one asked for feedback before anything had happened. */
export function eligibilityVerifyLetter(args: {
  targetRegion: string;
  targetCountry: string;
  marketingConsent: string;
  verificationUrl: string;
  to: string;
  unsubscribeUrl: string;
}): Letter {
  return {
    subject: "Verify your email for notifications | ArbeidMatch",
    html: buildArbeidmatchLetter({
      title: "Verify your email for notifications",
      innerHtml: [
        letterParagraph(
          "Please verify your email address to confirm consent and activate your notification subscription.",
        ),
        letterFacts([
          { label: "Target region", value: args.targetRegion || "-" },
          { label: "Target country", value: args.targetCountry || "-" },
          { label: "Notification email", value: args.to },
          { label: "Marketing consent", value: args.marketingConsent || "No" },
        ]),
        // The envelope puts the button after the body, so this note sits above it.
        letterNote("If the button below does not work, reply to this email and we will help you on business days."),
      ].join(""),
      cta: { href: args.verificationUrl, label: "Verify email and activate notifications" },
      lang: EN,
      audience: "candidate",
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

export function eligibilityVerifiedLetter(args: { to: string; unsubscribeUrl: string }): Letter {
  return {
    subject: "Email verified for notifications | ArbeidMatch",
    html: buildArbeidmatchLetter({
      title: "Your email is now verified",
      innerHtml: [
        letterParagraph("You are now registered in our notification system."),
        letterParagraph("We will contact you by email when the updated guide is available."),
      ].join(""),
      lang: EN,
      audience: "candidate",
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}

export function verifiedSignupNoticeLetter(args: {
  email: string;
  targetRegion: string;
  targetCountry: string;
  marketingConsent: string;
  verifiedAt: string;
}): Letter {
  const subject = `Verified guide notification signup: ${args.email}`;
  return {
    subject,
    html: buildArbeidmatchLetter({
      title: subject,
      innerHtml: letterFacts([
        { label: "Email", value: args.email },
        { label: "Target region", value: args.targetRegion || "-" },
        { label: "Target country", value: args.targetCountry || "-" },
        { label: "Marketing consent", value: args.marketingConsent || "No" },
        { label: "Verified at (ISO)", value: args.verifiedAt },
      ]),
      lang: EN,
      internal: true,
      recipient: "post@arbeidmatch.no",
    }),
  };
}

export function verificationErrorNoticeLetter(args: {
  timestamp: string;
  errorType: string;
  errorMessage: string;
  tokenPreview: string;
  userAgent: string;
  clientIp: string;
}): Letter {
  const subject = `Verification error: ${args.errorType}`;
  return {
    subject,
    html: buildArbeidmatchLetter({
      title: subject,
      innerHtml: letterFacts([
        { label: "Timestamp (ISO)", value: args.timestamp },
        { label: "Error type", value: args.errorType },
        { label: "Error message", value: args.errorMessage || "-" },
        { label: "Token preview", value: args.tokenPreview },
        { label: "User agent", value: args.userAgent },
        { label: "Client IP", value: args.clientIp },
      ]),
      lang: EN,
      internal: true,
      recipient: "post@arbeidmatch.no",
    }),
  };
}

// ---------------------------------------------------------------------------
// /api/weekly-candidate-feedback-report, /api/weekly-guide-interest-report
// ---------------------------------------------------------------------------

export function weeklyFeedbackReportLetter(args: {
  avgScore: number;
  rows: { label: string; value: string }[];
}): Letter {
  return {
    subject: `Weekly candidate feedback report | Avg ${args.avgScore.toFixed(2)}/10`,
    html: buildArbeidmatchLetter({
      title: `Weekly candidate feedback report: average ${args.avgScore.toFixed(2)}/10`,
      innerHtml: letterFacts(args.rows),
      lang: EN,
      internal: true,
      recipient: "post@arbeidmatch.no",
    }),
  };
}

export function weeklyGuideInterestReportLetter(args: {
  generatedAt: string;
  totalInterested: number;
  weeklyInterested: number;
  launchTarget: number;
  progressPercent: number;
  remaining: number;
}): Letter {
  return {
    subject: `Weekly guide interest report | Total ${args.totalInterested}`,
    html: buildArbeidmatchLetter({
      title: `Weekly guide interest report: ${args.totalInterested} in total`,
      innerHtml: letterFacts([
        { label: "Report generated (CET)", value: args.generatedAt },
        { label: "Context", value: "Guide interest signups (eligibility assistance flow)" },
        { label: "Total interested candidates", value: String(args.totalInterested) },
        { label: "New interested this week", value: String(args.weeklyInterested) },
        { label: "Product launch target", value: String(args.launchTarget) },
        { label: "Progress", value: `${args.progressPercent}% (${args.remaining} remaining to target)` },
      ]),
      lang: EN,
      internal: true,
      recipient: "post@arbeidmatch.no",
    }),
  };
}

// ---------------------------------------------------------------------------
// src/lib/errorNotifier.ts
// ---------------------------------------------------------------------------

/**
 * The error alert. It was plain text only, and the text part stays exactly as it
 * was: it is what gets pasted into the fix-error script. The letter is for the
 * person who opens it in Gmail.
 */
export function errorAlertLetter(args: {
  route: string;
  timestamp: string;
  incident: string | null;
  errorMessage: string;
  errorStack: string;
  context: string;
}): string {
  return buildArbeidmatchLetter({
    title: `Error on ${args.route}`,
    innerHtml: [
      letterFacts([
        { label: "Time", value: args.timestamp },
        { label: "Route", value: args.route },
        { label: "Environment", value: "Production" },
        { label: "ODIN incident", value: args.incident ?? "" },
      ]),
      letterHeading("Error"),
      letterPre(args.errorMessage),
      letterHeading("Stack trace"),
      letterPre(args.errorStack),
      letterHeading("Context"),
      letterPre(args.context || "No additional context"),
    ].join(""),
    lang: EN,
    internal: true,
    recipient: "post@arbeidmatch.no",
  });
}

// ---------------------------------------------------------------------------
// /api/request-otp
// ---------------------------------------------------------------------------

export function requestOtpLetter(args: { code: string; to: string; unsubscribeUrl: string }): Letter {
  return {
    subject: "Your ArbeidMatch verification code",
    html: buildArbeidmatchLetter({
      title: "Your verification code",
      innerHtml: [
        letterParagraph("Use this code to continue your ArbeidMatch request:"),
        letterCode(args.code),
        letterNote("This code expires in 10 minutes. If you did not request it, you can ignore this email."),
      ].join(""),
      lang: EN,
      recipient: args.to,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  };
}
