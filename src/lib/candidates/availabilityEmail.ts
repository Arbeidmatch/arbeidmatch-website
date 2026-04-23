import { escapeHtml } from "@/lib/htmlSanitizer";
import { emailParagraph, premiumCtaButton, wrapPremiumEmail } from "@/lib/emailPremiumTemplate";

const FEEDBACK_URL = "https://www.arbeidmatch.no/contact";

function gdprFooterHtml(): string {
  return `
    <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.65);">
      GDPR notice: We process your profile data to provide job matching services and keep only relevant active records.
      You can request access, correction, anonymization, or deletion of your data at post@arbeidmatch.no.
    </p>
    <p style="margin:8px 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.65);">
      <a href="mailto:post@arbeidmatch.no?subject=Unsubscribe%20from%20candidate%20emails" style="color:#C9A84C;text-decoration:none;">Unsubscribe</a>
      ·
      <a href="${FEEDBACK_URL}" style="color:#C9A84C;text-decoration:none;">Feedback</a>
    </p>
  `;
}

export function buildAvailabilityCheckEmailHtml(params: {
  firstName: string;
  availableUrl: string;
  unavailableUrl: string;
}): string {
  const safeFirstName = escapeHtml(params.firstName || "there");
  return wrapPremiumEmail(
    [
      emailParagraph(`Hi ${safeFirstName},`),
      emailParagraph("<strong>Quick check-in from ArbeidMatch</strong>"),
      emailParagraph(
        "We want to make sure your profile is visible to the right employers. Are you still looking for work in Norway?",
      ),
      `<div style="margin:20px 0 10px;text-align:left;">
        ${premiumCtaButton(params.availableUrl, "Yes, I'm available")}
      </div>`,
      `<div style="margin:0 0 10px;text-align:left;">
        ${premiumCtaButton(params.unavailableUrl, "Not right now")}
      </div>`,
      emailParagraph("If you are not available now, you can pick when you want to become visible again."),
      gdprFooterHtml(),
    ].join(""),
  );
}

export function buildInactiveWarningEmailHtml(params: { firstName: string; keepActiveUrl: string }): string {
  const safeFirstName = escapeHtml(params.firstName || "there");
  return wrapPremiumEmail(
    [
      emailParagraph(`Hi ${safeFirstName},`),
      emailParagraph(
        "Your profile will be removed in 7 days due to inactivity. We only maintain active profiles to ensure the best experience for candidates and employers. Click below to keep your profile active.",
      ),
      `<div style="margin:20px 0 10px;text-align:left;">
        ${premiumCtaButton(params.keepActiveUrl, "Keep My Profile Active")}
      </div>`,
      gdprFooterHtml(),
    ].join(""),
  );
}

export function buildAnonymizedConfirmationEmailHtml(params: { firstName: string }): string {
  const safeFirstName = escapeHtml(params.firstName || "there");
  return wrapPremiumEmail(
    [
      emailParagraph(`Hi ${safeFirstName},`),
      emailParagraph(
        "Your data has been anonymized per your request or due to inactivity. Contact post@arbeidmatch.no for data requests.",
      ),
      gdprFooterHtml(),
    ].join(""),
  );
}
