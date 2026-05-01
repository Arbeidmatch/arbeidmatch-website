import { buildEmail, emailBodyParagraph } from "@/lib/emailTemplate";
import { escapeHtml } from "@/lib/htmlSanitizer";

/** Lead magnet HTML for non-EU candidates who request the free overview. */
export function buildNonEuLeadEmail(firstName: string, recipientEmail: string, unsubscribeToken?: string): string {
  const name = escapeHtml(firstName);
  const heading = "margin:0 0 10px;font-size:15px;font-weight:600;color:#C9A84C;";
  const body = [
    emailBodyParagraph(`Hi ${name},`),
    emailBodyParagraph(
      "Most non-EU workers who want to work in Norway focus on finding a job first. That is actually the last step, not the first.",
    ),
    emailBodyParagraph(
      "Before a Norwegian employer can legally hire you, several things need to be in place. Most people only discover this after they have already made plans, spent money, or turned down other opportunities.",
    ),
    `<p style="${heading}">What most guides leave out</p>`,
    emailBodyParagraph(
      "There is a specific sequence to the process. Doing things in the wrong order does not just slow you down. It can disqualify your application entirely or cost you months of waiting.",
    ),
    emailBodyParagraph(
      "The sequence depends on your trade, your country of origin, and the type of employer you are targeting. There is no single answer that works for everyone.",
    ),
    emailBodyParagraph(
      "ArbeidMatch works with Norwegian employers in construction, logistics, and industry. We see which candidates get placed quickly and which ones get stuck. The difference is almost always preparation, not qualifications.",
    ),
    `<p style="${heading}">Want to know where to start?</p>`,
    emailBodyParagraph(
      "Reply to this email with your trade and country of origin. We will tell you what the first step looks like for your specific situation. No cost, no obligation.",
    ),
    emailBodyParagraph(
      "If you are an electrician specifically, we also have a dedicated authorization guide. Just mention it in your reply.",
    ),
    `<p style="font-size:12px;color:rgba(255,255,255,0.4);">We are also working on a complete Norway Work Guide for non-EU workers. When it is ready, you will be among the first to receive it.</p>`,
  ].join("");

  return buildEmail({
    title: "You asked about working in Norway",
    preheader: "Here is what most people get wrong before they start",
    body,
    recipientEmail,
    unsubscribeToken,
    footerNote:
      "ArbeidMatch Norge AS is a private recruitment agency, not an official Norwegian authority. Information shared is general guidance only.",
  });
}
